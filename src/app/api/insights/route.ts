import { NextRequest, NextResponse } from "next/server";
import { JOBS } from "@/lib/store";
import { generateMatchInsights } from "@/lib/matchInsights";

export async function POST(req: NextRequest) {
  try {
    const { profile, jobId } = await req.json();

    if (!profile || !jobId) {
      return NextResponse.json(
        { error: "Missing profile or jobId" },
        { status: 400 }
      );
    }

    const job = JOBS.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { embedding: _, ...rest } = job;
    const result = await generateMatchInsights(profile, rest);

    return NextResponse.json(result);
  } catch (e) {
    console.error("INSIGHTS ERROR:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
