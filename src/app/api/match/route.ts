import { NextRequest, NextResponse } from "next/server";
import { JOBS } from "@/lib/store";
import { cosine } from "@/lib/embed";
import { filterJobsByProfile, MAX_MATCH_RESULTS } from "@/lib/matchFilters";
import { attachMatchPercents } from "@/lib/matchScore";

export async function POST(req: NextRequest) {
  const { profile, embedding } = await req.json();

  if (!embedding?.length) {
    return NextResponse.json(
      { error: "Missing resume embedding" },
      { status: 400 }
    );
  }

  const years = profile?.years_experience ?? 0;
  const pool = filterJobsByProfile(JOBS, years, profile?.seniority);

  const results = attachMatchPercents(
    pool
      .map((j) => {
        const { embedding: je, ...rest } = j;
        return { job: rest, score: cosine(embedding, je) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MATCH_RESULTS)
  );

  return NextResponse.json({
    total: results.length,
    results,
  });
}
