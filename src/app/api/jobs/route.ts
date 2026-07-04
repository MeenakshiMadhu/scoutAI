import { NextRequest, NextResponse } from "next/server";
import { JOBS, Job } from "@/lib/store";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get("page") ?? "0", 10);
  const size = 12;

  let results: Job[] = JOBS;

  // ---- structured filters ----
  const family = p.get("family");
  const locType = p.get("location_type");
  const emp = p.get("employment_type");
  if (family) results = results.filter((j) => j.role_family === family);
  if (locType) results = results.filter((j) => j.location_type === locType);
  if (emp) results = results.filter((j) => j.employment_type === emp);

  // ---- text search (multi-word, description included, title-priority) ----
  const q = p.get("q")?.toLowerCase().trim();
  const words = q ? q.split(/\s+/).filter(Boolean) : [];

  // attach a relevance score so we can rank; keep only rows that match every word
  let scored = results
    .map((j) => {
      const title = j.title.toLowerCase();
      const haystack = [
        j.title,
        j.company,
        j.location,
        j.department,
        j.skills.join(" "),
        j.description,
      ]
        .join(" ")
        .toLowerCase();

      if (words.length === 0) return { job: j, relevance: 0 };

      // every query word must appear somewhere (AND semantics)
      const allMatch = words.every((w) => haystack.includes(w));
      if (!allMatch) return null;

      // relevance: reward matches in the title heavily, exact-phrase in title most
      let relevance = 0;
      if (title.includes(q!)) relevance += 100; // full phrase in title
      relevance += words.filter((w) => title.includes(w)).length * 10; // each word in title
      return { job: j, relevance };
    })
    .filter(Boolean) as { job: Job; relevance: number }[];

  // ---- sort ----
  const sort = p.get("sort") ?? "newest";
  scored.sort((a, b) => {
    // when there's a search query, title relevance wins first
    if (words.length > 0 && b.relevance !== a.relevance)
      return b.relevance - a.relevance;
    const ja = a.job,
      jb = b.job;
    switch (sort) {
      case "newest":
        return jb.date_posted.localeCompare(ja.date_posted);
      case "oldest":
        return ja.date_posted.localeCompare(jb.date_posted);
      case "pay_high":
        return jb.compensation_max - ja.compensation_max;
      case "pay_low":
        return ja.compensation_min - jb.compensation_min;
      case "title":
        return ja.title.localeCompare(jb.title);
      default:
        return 0;
    }
  });

  const finalResults = scored.map((s) => s.job);
  const total = finalResults.length;
  const paged = finalResults.slice(page * size, page * size + size);

  return NextResponse.json({
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    jobs: paged,
  });
}
