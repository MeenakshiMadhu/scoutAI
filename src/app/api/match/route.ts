import { NextRequest, NextResponse } from "next/server";
import { JOBS } from "@/lib/store";
import { cosine } from "@/lib/embed";
import { filterJobsByProfile, MAX_MATCH_RESULTS } from "@/lib/matchFilters";

export async function POST(req: NextRequest) {
  const { profile, embedding, page = 0 } = await req.json();

  if (!embedding?.length) {
    return NextResponse.json({ error: "Missing resume embedding" }, { status: 400 });
  }

  const years = profile?.years_experience ?? 0;
  const pool = filterJobsByProfile(JOBS, years, profile?.seniority);

  const scored = pool
    .map((j) => {
      const { embedding: je, ...rest } = j;
      return { job: rest, score: cosine(embedding, je) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCH_RESULTS);

  const total = scored.length;
  const size = MAX_MATCH_RESULTS;

  return NextResponse.json({
    total,
    page: 0,
    size,
    totalPages: 1,
    results: scored,
  });
}
