import { NextRequest, NextResponse } from "next/server";
import { JOBS } from "@/lib/store";
import {
  BROWSE_PAGE_SIZE,
  parseBrowseFilters,
  queryRankedJobs,
} from "@/lib/jobBrowse";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get("page") ?? "0", 10);
  const filters = parseBrowseFilters(p);

  const ranked = queryRankedJobs(JOBS, filters);
  const total = ranked.length;
  const paged = ranked
    .slice(page * BROWSE_PAGE_SIZE, page * BROWSE_PAGE_SIZE + BROWSE_PAGE_SIZE)
    .map((s) => s.job);

  return NextResponse.json({
    total,
    page,
    size: BROWSE_PAGE_SIZE,
    totalPages: Math.ceil(total / BROWSE_PAGE_SIZE),
    jobs: paged,
  });
}
