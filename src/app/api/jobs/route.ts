import { NextRequest, NextResponse } from "next/server";
import {
  BROWSE_PAGE_SIZE,
  parseBrowseFilters,
  queryRankedJobs,
} from "@/lib/jobBrowse";
import { fetchJobsForBrowse } from "@/lib/jobsDb";
import { toPublicJob } from "@/lib/jobTypes";

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const page = parseInt(p.get("page") ?? "0", 10);
    const filters = parseBrowseFilters(p);

    const jobs = await fetchJobsForBrowse();
    const ranked = queryRankedJobs(jobs, filters);
    const total = ranked.length;
    const paged = ranked
      .slice(page * BROWSE_PAGE_SIZE, page * BROWSE_PAGE_SIZE + BROWSE_PAGE_SIZE)
      .map((s) => toPublicJob(s.job));

    return NextResponse.json({
      total,
      page,
      size: BROWSE_PAGE_SIZE,
      totalPages: Math.ceil(total / BROWSE_PAGE_SIZE),
      jobs: paged,
    });
  } catch (e) {
    console.error("JOBS ERROR:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
