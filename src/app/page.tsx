"use client";
import { useEffect, useState } from "react";
import JobCard, { JobCardSkeleton } from "@/components/JobCard";
import JobDetail from "@/components/JobDetail";
import MultiSelect from "@/components/MultiSelect";
import SingleSelect from "@/components/SingleSelect";
import ResumeUpload from "@/components/ResumeUpload";
import MatchLoadingPanel from "@/components/MatchLoadingPanel";
import { BROWSE_PAGE_SIZE, queryRankedJobs } from "@/lib/jobBrowse";
import { clearInsightsCache } from "@/lib/insightsCache";
import {
  FAMILIES,
  LOCATION_TYPES,
  EMPLOYMENT_TYPES,
  SENIORITY_ORDER,
  Job,
} from "@/lib/store";

type MatchedJob = { job: Job; score: number; matchPercent: number };

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [selected, setSelected] = useState<Job | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [matchProfile, setMatchProfile] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");

  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [family, setFamily] = useState<string[]>([]);
  const [locType, setLocType] = useState<string[]>([]);
  const [emp, setEmp] = useState<string[]>([]);
  const [seniority, setSeniority] = useState<string[]>([]);
  const [recentWeek, setRecentWeek] = useState(false);
  const [sort, setSort] = useState("newest");

  const [matchSession, setMatchSession] = useState<{
    profile: {
      role_family: string;
      seniority: string;
      years_experience?: number;
    };
    embedding: number[];
  } | null>(null);
  const [matchedPool, setMatchedPool] = useState<MatchedJob[]>([]);

  function clearMatchMode() {
    clearInsightsCache();
    setIsUploading(false);
    setResumeUploaded(false);
    setMatchProfile(null);
    setMatchSession(null);
    setMatchedPool([]);
    setSort("newest");
    setPage(0);
    setSelected(null);
  }

  //   FUNCTION to Handle Resume Upload
  async function handleResume(file: File) {
    clearInsightsCache();
    setSelected(null);
    setUploadError("");
    setIsUploading(true);
    setLoading(true);
    const fd = new FormData();
    fd.append("resume", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd }).then(
      (r) => r.json()
    );
    if (up.error) {
      setUploadError(up.error);
      setIsUploading(false);
      setLoading(false);
      return;
    }

    setMatchProfile(up.profile);
    setMatchSession({ profile: up.profile, embedding: up.embedding });
    setSort("match");
    setPage(0);
    setResumeUploaded(true);
    setIsUploading(false);
    // loading stays true — match fetch effect picks up from here
  }

  // reset page and close detail when filters or sort change
  useEffect(() => {
    setPage(0);
    setSelected(null);
  }, [q, loc, family, locType, emp, seniority, recentWeek, sort]);

  // fetch browse jobs — skip when showing resume-matched results
  useEffect(() => {
    if (resumeUploaded) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (loc) params.set("loc", loc);
      if (family.length) params.set("family", family.join(","));
      if (locType.length) params.set("location_type", locType.join(","));
      if (emp.length) params.set("employment_type", emp.join(","));
      if (seniority.length) params.set("seniority", seniority.join(","));
      if (recentWeek) params.set("posted_within", "7");
      params.set("sort", sort);
      params.set("page", String(page));
      const d = await fetch(`/api/jobs?${params}`).then((r) => r.json());
      setJobs(d.jobs);
      setTotal(d.total);
      setTotalPages(d.totalPages);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [
    q,
    loc,
    family.join(","),
    locType.join(","),
    emp.join(","),
    seniority.join(","),
    recentWeek,
    sort,
    page,
    resumeUploaded,
  ]);

  // fetch top 20 matches once per resume session — filters apply client-side only
  useEffect(() => {
    if (!resumeUploaded || !matchSession) {
      setMatchedPool([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const m = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: matchSession.profile,
          embedding: matchSession.embedding,
        }),
      }).then((r) => r.json());
      if (cancelled) return;
      setMatchedPool(m.results ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeUploaded, matchSession]);

  // filter/sort/paginate within the fixed top-20 match pool
  useEffect(() => {
    if (!resumeUploaded || !matchedPool.length) return;
    setLoading(true);
    const t = setTimeout(() => {
        const jobs = matchedPool.map((x) => x.job);
        const matchScores = new Map(
          matchedPool.map((x) => [x.job.id, x.score])
        );
        const matchPercents = new Map(
          matchedPool.map((x) => [x.job.id, x.matchPercent])
        );
        const ranked = queryRankedJobs(
          jobs,
          {
            q,
            loc,
            family,
            location_type: locType,
            employment_type: emp,
            seniority,
            posted_within: recentWeek ? 7 : undefined,
            sort,
          },
          matchScores
        );
        const total = ranked.length;
        const paged = ranked
          .slice(
            page * BROWSE_PAGE_SIZE,
            page * BROWSE_PAGE_SIZE + BROWSE_PAGE_SIZE
          )
          .map(({ job, matchScore }) => ({
            ...job,
            _score: matchScore ?? 0,
            _matchPercent: matchPercents.get(job.id),
          }));
        setJobs(paged);
        setTotal(total);
        setTotalPages(Math.ceil(total / BROWSE_PAGE_SIZE) || 1);
        setLoading(false);
      },
      250
    );
    return () => clearTimeout(t);
  }, [
    q,
    loc,
    family.join(","),
    locType.join(","),
    emp.join(","),
    seniority.join(","),
    recentWeek,
    sort,
    page,
    resumeUploaded,
    matchedPool,
  ]);

  const sortOptions = resumeUploaded
    ? [
        { value: "match", label: "Best match" },
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "pay_high", label: "Pay: high → low" },
        { value: "pay_low", label: "Pay: low → high" },
        { value: "title", label: "Title A–Z" },
      ]
    : [
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "pay_high", label: "Pay: high → low" },
        { value: "pay_low", label: "Pay: low → high" },
        { value: "title", label: "Title A–Z" },
      ];

  const hasFilters =
    family.length > 0 ||
    locType.length > 0 ||
    emp.length > 0 ||
    seniority.length > 0 ||
    recentWeek;

  const isMatching =
    isUploading ||
    (resumeUploaded && matchedPool.length === 0 && loading);

  return (
    <main className="w-full max-w-7xl mx-auto self-stretch px-4 sm:px-6 py-8 lg:py-10 text-center">
      {/* Header */}
      <header className="mb-8 w-full animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--coral)] shadow-lg shadow-black/25">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--peach)]">
            AI-Powered Career Search
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gradient">
          scoutAI
        </h1>
        <p className="mt-2 max-w-xl mx-auto text-base text-[var(--foreground-muted)]">
          Browse open roles across industries. Upload your resume to unlock
          personalized matches tailored to your experience.
        </p>
      </header>

      {/* Resume Upload */}
      <ResumeUpload onFileSelected={handleResume} onClear={clearMatchMode} />
      {uploadError && (
        <p className="text-red-500 text-sm mb-4 text-center">{uploadError}</p>
      )}

      {/* Filters */}
      <section className="relative z-30 w-full glass-panel rounded-2xl p-4 sm:p-5 mb-6 animate-fade-in stagger-1 overflow-visible">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap gap-3 w-full max-w-3xl justify-center">
            <div className="relative flex-[2] min-w-[220px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)] pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job title or keywords"
                className="filter-input w-full rounded-xl pl-9 pr-9 py-2.5 text-sm"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/8"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[160px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)] pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="Location"
                className="filter-input w-full rounded-xl pl-9 pr-9 py-2.5 text-sm"
              />
              {loc && (
                <button
                  type="button"
                  onClick={() => setLoc("")}
                  aria-label="Clear location"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/8"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <MultiSelect
              label="Business Area"
              options={FAMILIES}
              selected={family}
              onChange={setFamily}
            />
            <MultiSelect
              label="Seniority"
              options={SENIORITY_ORDER}
              selected={seniority}
              onChange={setSeniority}
            />
            <MultiSelect
              label="Location Type"
              options={LOCATION_TYPES}
              selected={locType}
              onChange={setLocType}
            />
            <MultiSelect
              label="Employment Type"
              options={EMPLOYMENT_TYPES}
              selected={emp}
              onChange={setEmp}
            />
            <button
              type="button"
              aria-pressed={recentWeek}
              onClick={() => setRecentWeek((v) => !v)}
              className={`filter-input rounded-xl px-3 py-2.5 text-sm cursor-pointer flex items-center gap-2
                ${recentWeek ? "filter-input-active" : "hover:bg-white/8"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors
                  ${
                    recentWeek
                      ? "bg-[var(--coral)]"
                      : "bg-[var(--foreground-muted)]/40"
                  }`}
                aria-hidden
              />
              Last 7 days
            </button>
            {hasFilters && (
              <button
                onClick={() => {
                  setFamily([]);
                  setSeniority([]);
                  setLocType([]);
                  setEmp([]);
                  setRecentWeek(false);
                }}
                className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] px-2 py-2 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
            <div className="flex items-center justify-center gap-2 shrink-0">
              <span className="hidden sm:inline text-xs text-[var(--foreground-muted)]">
                Sort
              </span>
              <SingleSelect
                label="Sort by"
                value={sort}
                onChange={setSort}
                options={sortOptions}
              />
            </div>
          </div>
        </div>
      </section>

      {resumeUploaded && matchProfile && (
        <div className="mb-4 w-full rounded-lg bg-[var(--background-elevated)] border border-[var(--border-strong)] px-4 py-3 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-[var(--foreground)]">
            Top 20 matches for your profile - add more filters to refine this
            list!
          </p>
          <button
            onClick={clearMatchMode}
            className="text-sm text-[var(--peach)] hover:text-[var(--beige)] underline shrink-0"
          >
            Clear · Browse all jobs
          </button>
        </div>
      )}

      {/* Result count */}
      <div className="flex w-full flex-col items-center justify-center gap-2 mb-5 animate-fade-in stagger-2 relative">
        <p className="text-sm font-medium text-[var(--foreground-muted)]">
          {isMatching ? (
            <span className="text-[var(--foreground-muted)]">
              Finding your best-fit roles…
            </span>
          ) : loading ? (
            <span className="inline-flex flex-col items-center gap-3">
              <span className="search-loader" aria-hidden="true">
                <span className="search-loader-dot" />
                <span className="search-loader-dot" />
                <span className="search-loader-dot" />
              </span>
              <span>Searching roles…</span>
            </span>
          ) : (
            <>
              <span className="text-[var(--foreground)] font-semibold">
                {total.toLocaleString()}
              </span>{" "}
              {total === 1 ? "role" : "roles"} found
            </>
          )}
        </p>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="lg:hidden text-sm btn-ghost px-3 py-1.5 rounded-lg absolute right-0 top-0"
          >
            Close detail ✕
          </button>
        )}
      </div>

      {/* Split layout */}
      <div className="flex w-full min-w-0 gap-5 animate-fade-in stagger-3 relative z-0 text-left">
        <div
          className={`min-w-0 ${selected ? "w-full lg:w-1/2" : "w-full"}`}
        >
          <div
            className={`grid w-full gap-4 ${
              selected ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {isMatching ? (
              <div className="col-span-full">
                <MatchLoadingPanel mode={isUploading ? "upload" : "match"} />
              </div>
            ) : loading
              ? Array.from({ length: selected ? 3 : 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))
              : jobs.length > 0
                ? jobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => setSelected(j)}
                      className="text-left"
                    >
                      <JobCard
                        job={j}
                        selected={selected?.id === j.id}
                        matchPercent={
                          resumeUploaded ? j._matchPercent : undefined
                        }
                      />
                    </button>
                  ))
                : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass-panel-light">
                        <svg
                          className="h-8 w-8 text-[var(--foreground-muted)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-[var(--foreground)]">
                        No roles match those filters
                      </p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Try broadening your search or clearing filters
                      </p>
                    </div>
                  )}
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-outline px-4 py-2 rounded-xl text-sm font-medium"
              >
                ← Previous
              </button>
              <span className="text-sm text-[var(--foreground-muted)] px-2">
                Page{" "}
                <span className="text-[var(--foreground)] font-medium">
                  {page + 1}
                </span>{" "}
                of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-outline px-4 py-2 rounded-xl text-sm font-medium"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {selected && (
          <aside
            className="w-full lg:w-1/2 rounded-2xl overflow-hidden glass-panel sticky top-6 self-start shadow-2xl shadow-black/20"
            style={{ height: "calc(100vh - 8rem)" }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                Role details
              </span>
              <button
                onClick={() => setSelected(null)}
                className="hidden lg:block btn-ghost text-sm px-2 py-1 rounded-lg"
              >
                Close ✕
              </button>
            </div>
            <div className="h-[calc(100%-2.75rem)]">
              <JobDetail
                job={selected}
                resumeUploaded={resumeUploaded}
                matchProfile={matchProfile}
                matchPercent={
                  resumeUploaded ? (selected as any)._matchPercent : undefined
                }
              />
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
