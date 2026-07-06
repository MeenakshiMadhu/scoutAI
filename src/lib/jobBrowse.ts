import { Job } from "@/lib/store";

export type BrowseFilters = {
  q?: string;
  loc?: string;
  family?: string[];
  location_type?: string[];
  employment_type?: string[];
  seniority?: string[];
  posted_within?: number;
  sort?: string;
};

export type RankedJob = {
  job: Job;
  relevance: number;
  matchScore?: number;
};

export function parseBrowseFilters(
  input: URLSearchParams | Record<string, string | undefined>
): BrowseFilters {
  const get = (key: string) =>
    input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key];

  const split = (key: string) => get(key)?.split(",").filter(Boolean) ?? [];
  const postedWithinDays = parseInt(get("posted_within") ?? "", 10);

  return {
    q: get("q")?.toLowerCase().trim() || undefined,
    loc: get("loc")?.toLowerCase().trim() || undefined,
    family: split("family"),
    location_type: split("location_type"),
    employment_type: split("employment_type"),
    seniority: split("seniority"),
    posted_within: postedWithinDays > 0 ? postedWithinDays : undefined,
    sort: get("sort") || undefined,
  };
}

export function applyStructuredFilters(
  jobs: Job[],
  filters: BrowseFilters
): Job[] {
  let results = jobs;

  if (filters.family?.length)
    results = results.filter((j) => filters.family!.includes(j.role_family));
  if (filters.location_type?.length)
    results = results.filter((j) =>
      filters.location_type!.includes(j.location_type)
    );
  if (filters.employment_type?.length)
    results = results.filter((j) =>
      filters.employment_type!.includes(j.employment_type)
    );
  if (filters.seniority?.length)
    results = results.filter((j) => filters.seniority!.includes(j.seniority));
  if (filters.posted_within) {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - filters.posted_within);
    results = results.filter((j) => new Date(j.date_posted) >= cutoff);
  }
  if (filters.loc)
    results = results.filter((j) =>
      j.location.toLowerCase().includes(filters.loc!)
    );

  return results;
}

export function applyTextSearch(jobs: Job[], q?: string): RankedJob[] {
  const words = q ? q.split(/\s+/).filter(Boolean) : [];

  return jobs
    .map((j) => {
      const title = j.title.toLowerCase();
      const haystack = [
        j.title,
        j.company,
        j.department,
        j.skills.join(" "),
        j.description,
      ]
        .join(" ")
        .toLowerCase();

      if (words.length === 0) return { job: j, relevance: 0 };

      const allMatch = words.every((w) => haystack.includes(w));
      if (!allMatch) return null;

      let relevance = 0;
      if (title.includes(q!)) relevance += 100;
      relevance += words.filter((w) => title.includes(w)).length * 10;
      return { job: j, relevance };
    })
    .filter(Boolean) as RankedJob[];
}

export function sortRankedJobs(
  items: RankedJob[],
  sort: string,
  hasSearchQuery: boolean
): RankedJob[] {
  return [...items].sort((a, b) => {
    if (hasSearchQuery && b.relevance !== a.relevance)
      return b.relevance - a.relevance;

    const ja = a.job;
    const jb = b.job;

    switch (sort) {
      case "match":
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
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
}

export function queryRankedJobs(
  jobs: Job[],
  filters: BrowseFilters,
  matchScores?: Map<string, number>
): RankedJob[] {
  const filtered = applyStructuredFilters(jobs, filters);
  const searched = applyTextSearch(filtered, filters.q).map((item) => ({
    ...item,
    matchScore: matchScores?.get(item.job.id),
  }));
  const sort = filters.sort ?? "newest";
  const hasSearchQuery = Boolean(filters.q?.trim());
  return sortRankedJobs(searched, sort, hasSearchQuery);
}

export const BROWSE_PAGE_SIZE = 12;
