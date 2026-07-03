import { NextRequest, NextResponse } from "next/server";
import { JOBS, Job } from "@/lib/store";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get("page") ?? "0", 10);
  const size = 12;

  let results: Job[] = JOBS;

  // ---- filters ----
  const family = p.get("family");
  const locType = p.get("location_type");
  const emp = p.get("employment_type");
  const q = p.get("q")?.toLowerCase().trim();

  if (family) results = results.filter((j) => j.role_family === family);
  if (locType) results = results.filter((j) => j.location_type === locType);
  if (emp) results = results.filter((j) => j.employment_type === emp);
  if (q)
    results = results.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
    );

  // ---- sort ----
  const sort = p.get("sort") ?? "newest";
  results = [...results].sort((a, b) => {
    switch (sort) {
      case "newest":
        return b.date_posted.localeCompare(a.date_posted);
      case "oldest":
        return a.date_posted.localeCompare(b.date_posted);
      case "pay_high":
        return b.compensation_max - a.compensation_max;
      case "pay_low":
        return a.compensation_min - b.compensation_min;
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // ---- paginate ----
  const total = results.length;
  const paged = results.slice(page * size, page * size + size);

  return NextResponse.json({
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    jobs: paged,
  });
}
