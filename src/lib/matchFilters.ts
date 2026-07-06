import { Job, SENIORITY_ORDER } from "@/lib/store";

/** Parsed YOE requirement from JD text (or min_years fallback) */
export type ParsedYoeRequirement =
  | { kind: "range"; min: number; max: number }
  | { kind: "minimum"; min: number };

const RANGE_RE = /(\d+)\s*-\s*(\d+)\s*years?\b/i;
const MINIMUM_RE = /(?:minimum\s+)?(\d+)\+\s*years?\b/i;

/**
 * Parse years-of-experience from a job description.
 * Falls back to min_years when the JD has no explicit range/minimum phrase.
 */
export function parseYoeRequirement(
  job: Pick<Job, "min_years" | "description">
): ParsedYoeRequirement {
  const text = job.description;

  const range = text.match(RANGE_RE);
  if (range) {
    return {
      kind: "range",
      min: parseInt(range[1], 10),
      max: parseInt(range[2], 10),
    };
  }

  const minimum = text.match(MINIMUM_RE);
  if (minimum) {
    return { kind: "minimum", min: parseInt(minimum[1], 10) };
  }

  // Fallback for listings that only expose a numeric min_years field
  if (job.min_years === 0) return { kind: "range", min: 0, max: 2 };
  if (job.min_years === 2) return { kind: "range", min: 2, max: 5 };
  return { kind: "minimum", min: job.min_years };
}

/** Candidate YOE window implied by a parsed requirement (+/-1 padding) */
export function candidateYoeWindow(req: ParsedYoeRequirement): {
  min: number;
  max: number | null;
} {
  if (req.kind === "range") {
    return {
      min: Math.max(0, req.min - 1),
      max: req.max + 1,
    };
  }
  return { min: Math.max(0, req.min - 1), max: null };
}

/**
 * Range in JD (e.g. 0-2, 2-5): match resumes within [min-1, max+1].
 * Minimum in JD (e.g. 2+, 5+): match resumes with [min-1]+ YOE.
 */
export function candidateMatchesYoeRequirement(
  candidateYears: number,
  req: ParsedYoeRequirement
): boolean {
  const y = Math.round(candidateYears);
  const window = candidateYoeWindow(req);

  if (window.max != null) return y >= window.min && y <= window.max;
  return y >= window.min;
}

export function jobMatchesCandidateYears(
  job: Job,
  candidateYears: number
): boolean {
  return candidateMatchesYoeRequirement(
    candidateYears,
    parseYoeRequirement(job)
  );
}

/**
 * Hybrid match pipeline — step 1 & 2 are hard filters; step 3 is semantic rank.
 * 1. Years: JD range/minimum rules (+/-1 padding)
 * 2. Seniority: ±1 level among survivors
 * (Cosine similarity on MiniLM embeddings runs in /api/match after this.)
 */
export function filterJobsByProfile(
  jobs: Job[],
  years: number,
  seniority: string | undefined
): Job[] {
  let pool = jobs.filter((j) => jobMatchesCandidateYears(j, years));

  const rank = seniority ? SENIORITY_ORDER.indexOf(seniority) : -1;
  if (rank >= 0) {
    pool = pool.filter((j) => Math.abs(j.seniority_rank - rank) <= 1);
  }

  return pool;
}

export const MAX_MATCH_RESULTS = 20;
