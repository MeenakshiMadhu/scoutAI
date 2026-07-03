"use client";
import { useEffect, useState } from "react";
import JobCard from "@/components/JobCard";
import JobDetail from "@/components/JobDetail";
import { FAMILIES, LOCATION_TYPES, EMPLOYMENT_TYPES, Job } from "@/lib/store";

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<Job | null>(null);
  // flips to true after a resume is uploaded — hardcoded for now
  const [resumeUploaded] = useState(false);

  const [q, setQ] = useState("");
  const [family, setFamily] = useState("");
  const [locType, setLocType] = useState("");
  const [emp, setEmp] = useState("");
  const [sort, setSort] = useState("newest");

  // reset to page 0 whenever a filter or sort changes
  useEffect(() => {
    setPage(0);
  }, [q, family, locType, emp, sort]);

  useEffect(() => {
    const t = setTimeout(async () => {
      // debounce so typing in search doesn't spam the API
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (family) params.set("family", family);
      if (locType) params.set("location_type", locType);
      if (emp) params.set("employment_type", emp);
      params.set("sort", sort);
      params.set("page", String(page));

      const d = await fetch(`/api/jobs?${params}`).then((r) => r.json());
      setJobs(d.jobs);
      setTotal(d.total);
      setTotalPages(d.totalPages);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, family, locType, emp, sort, page]);

  const selectClass =
    "border rounded-lg px-3 py-2 text-sm bg-white text-gray-900";

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">scoutAI</h1>
        <p className="mt-1 opacity-80">
          Browse open roles. Upload a resume to see your matches.
        </p>
      </header>

      {/* controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, company, skill…"
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px] bg-white text-gray-900 placeholder:text-gray-400"
        />
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className={selectClass}
        >
          <option value="">All fields</option>
          {FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={locType}
          onChange={(e) => setLocType(e.target.value)}
          className={selectClass}
        >
          <option value="">Any location type</option>
          {LOCATION_TYPES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={emp}
          onChange={(e) => setEmp(e.target.value)}
          className={selectClass}
        >
          <option value="">Any type</option>
          {EMPLOYMENT_TYPES.map((e2) => (
            <option key={e2} value={e2}>
              {e2}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={selectClass}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="pay_high">Pay: high to low</option>
          <option value="pay_low">Pay: low to high</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {/* result count */}
      <p className="text-sm mb-4 opacity-80">
        {loading ? "Loading…" : `${total.toLocaleString()} roles`}
      </p>

      {/* split layout */}
      <div className="flex gap-5">
        {/* left: job list */}
        <div className={selected ? "w-full lg:w-1/2" : "w-full"}>
          <div
            className={`grid gap-4 ${
              selected ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelected(j)}
                className="text-left"
              >
                <div
                  className={
                    selected && selected.id === j.id
                      ? "ring-2 ring-black rounded-xl"
                      : ""
                  }
                >
                  <JobCard job={j} />
                </div>
              </button>
            ))}
          </div>

          {jobs.length === 0 && !loading && (
            <p className="text-center py-16 opacity-80">
              No roles match those filters.
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm opacity-80">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* right: detail panel — only rendered when a job is selected */}
        {selected && (
          <aside
            className="hidden lg:block lg:w-1/2 border border-gray-200 rounded-xl bg-[var(--card)] sticky top-6 self-start"
            style={{ height: "calc(100vh - 8rem)" }}
          >
            <div className="flex justify-end p-2">
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700 text-sm px-2"
              >
                Close ✕
              </button>
            </div>
            <div className="h-[calc(100%-2.5rem)]">
              <JobDetail job={selected} resumeUploaded={resumeUploaded} />
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
