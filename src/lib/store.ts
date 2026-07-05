import jobs from "@/data/jobs-embedded.json";
// import { cosine } from "@/lib/embed";

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type Job = {
  id: string;
  title: string;
  company: string;
  role_family: string;
  seniority: string;
  seniority_rank: number;
  min_years: number;
  location: string;
  country: string;
  location_type: string;
  department: string;
  employment_type: string;
  date_posted: string;
  compensation: string;
  compensation_min: number;
  compensation_max: number;
  skills: string[];
  description: string;
  embedding: number[];
};

export const JOBS = jobs as Job[];

export const FAMILIES = [...new Set(JOBS.map((j) => j.role_family))].sort();
export const LOCATION_TYPES = ["On-site", "Remote", "Hybrid"];
export const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Intern"];
export const SENIORITY_ORDER = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Director",
  "VP",
];

// ---- family centroids: average vector per role_family ----
function buildCentroids(): Record<string, number[]> {
  const groups: Record<string, number[][]> = {};
  for (const j of JOBS) (groups[j.role_family] ??= []).push(j.embedding);

  const centroids: Record<string, number[]> = {};
  for (const [family, vecs] of Object.entries(groups)) {
    const dim = vecs[0].length;
    const avg = new Array(dim).fill(0);
    for (const v of vecs) for (let i = 0; i < dim; i++) avg[i] += v[i];
    for (let i = 0; i < dim; i++) avg[i] /= vecs.length;
    centroids[family] = avg;
  }
  return centroids;
}
export const CENTROIDS = buildCentroids();

// nearest family to a resume vector
export function nearestFamily(vec: number[]): string {
  let best = "",
    bestScore = -Infinity;
  for (const [family, c] of Object.entries(CENTROIDS)) {
    const s = cosine(vec, c);
    if (s > bestScore) {
      bestScore = s;
      best = family;
    }
  }
  return best;
}

// DEBUG FUNCTION: returns a sorted list of role families with their cosine similarity scores to the given vector
export function familyScores(vec: number[]): [string, number][] {
  return Object.entries(CENTROIDS)
    .map(([f, c]) => [f, cosine(vec, c)] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}
