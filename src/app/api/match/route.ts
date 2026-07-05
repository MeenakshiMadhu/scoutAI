import { NextRequest, NextResponse } from "next/server";
import { JOBS, SENIORITY_ORDER } from "@/lib/store";
import { cosine } from "@/lib/embed";

export async function POST(req: NextRequest) {
  const { profile, embedding, page = 0 } = await req.json();
  const size = 12;
  const rank = SENIORITY_ORDER.indexOf(profile.seniority);
  const years = profile.years_experience ?? 0;

  // STEP 1 — hard filters (role family, seniority band, years required in JD)
  let pool = JOBS;
  if (profile.role_family)
    pool = pool.filter((j) => j.role_family === profile.role_family);
  if (rank >= 0)
    pool = pool.filter((j) => Math.abs(j.seniority_rank - rank) <= 1);
  // Drop roles that require more experience than the candidate has (+1 yr stretch)
  pool = pool.filter((j) => j.min_years <= years + 1);
  // Drop roles above candidate level when JD min years exceed their experience
  if (rank >= 0) {
    pool = pool.filter(
      (j) => !(j.seniority_rank > rank && j.min_years > years)
    );
  }

  // STEP 2 — cosine rank the survivors
  const scored = pool
    .map((j) => {
      const { embedding: je, ...rest } = j;
      return { job: rest, score: cosine(embedding, je) };
    })
    .sort((a, b) => b.score - a.score);

  const total = scored.length;
  return NextResponse.json({
    total,
    page,
    size,
    totalPages: Math.max(1, Math.ceil(total / size)),
    results: scored.slice(page * size, page * size + size),
  });
}
