import { Job } from "@/lib/store";
import ShareMenu from "@/components/ShareMenu";

export default function JobDetail({
  job,
  resumeUploaded,
}: {
  job: Job | null;
  resumeUploaded: boolean;
}) {
  if (!job) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[var(--card)]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <svg
            className="h-7 w-7 text-amber-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">
          Select a role to see the details
        </p>
      </div>
    );
  }

  const lines = job.description.split("\n").filter(Boolean);

  return (
    <div className="detail-scroll h-full overflow-y-auto bg-[var(--card)]">
      <div className="border-b border-gray-100 bg-gradient-to-br from-amber-50/80 via-white to-stone-50/40 px-6 pb-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-snug">
              {job.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-amber-900">
              {job.company}
            </p>
          </div>
          <ShareMenu job={job} />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {[job.location, job.location_type, job.employment_type, job.seniority].map(
            (m, i) => (
              <span
                key={i}
                className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200/80"
              >
                {m}
              </span>
            )
          )}
        </div>

        <p className="mt-3 text-lg font-bold text-gray-900">
          {job.compensation}
        </p>
      </div>

      <div className="px-6 py-5">
        {resumeUploaded && (
          <div className="mb-6 space-y-4">
            <section className="overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <svg
                      className="h-4 w-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-emerald-900">
                    Match score
                  </span>
                </div>
                <span className="text-2xl font-bold text-emerald-700">—%</span>
              </div>
              <p className="mt-2 text-xs text-emerald-700/80">
                Based on your uploaded resume.
              </p>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Top skills & keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Insights
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Personalized fit insights will appear here once matching is
                enabled.
              </p>
            </section>
          </div>
        )}

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="inline-block h-px flex-1 bg-gray-100" />
            About this role
            <span className="inline-block h-px flex-1 bg-gray-100" />
          </h3>
          <div className="space-y-2.5 text-sm leading-relaxed text-gray-700">
            {lines.map((line, i) => (
              <p
                key={i}
                className={
                  line.trim().startsWith("-")
                    ? "relative pl-4 before:absolute before:left-0 before:font-bold before:text-amber-700 before:content-['•']"
                    : ""
                }
              >
                {line.replace(/^-\s*/, "")}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Required skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span
                key={s}
                className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-100"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
