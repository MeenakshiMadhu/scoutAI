import { NextRequest, NextResponse } from "next/server";
import { cosine } from "@/lib/embed";
import { fetchJobsForMatch } from "@/lib/jobsDb";
import type { JobWithEmbedding } from "@/lib/jobTypes";
import { filterJobsByProfile, MAX_MATCH_RESULTS } from "@/lib/matchFilters";
import { attachMatchPercents } from "@/lib/matchScore";

export async function POST(req: NextRequest) {
  try {
    const { profile, embedding } = await req.json();

    if (!embedding?.length) {
      return NextResponse.json(
        { error: "Missing resume embedding" },
        { status: 400 }
      );
    }

    const jobs = await fetchJobsForMatch();
    const years = profile?.years_experience ?? 0;
    const pool = filterJobsByProfile(jobs, years, profile?.seniority);

    const results = attachMatchPercents(
      pool
        .filter((j): j is JobWithEmbedding => Array.isArray(j.embedding))
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
  } catch (e) {
    console.error("MATCH ERROR:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
