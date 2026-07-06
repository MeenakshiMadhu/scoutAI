import { Job } from "@/lib/store";
import { matchPercentColor } from "@/lib/matchScore";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const SENIORITY_STYLES: Record<string, string> = {
  Intern: "bg-amber-50 text-amber-900 ring-amber-100",
  Junior: "bg-stone-100 text-stone-700 ring-stone-200",
  Mid: "bg-orange-50 text-orange-800 ring-orange-100",
  Senior: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Staff: "bg-amber-50 text-amber-700 ring-amber-100",
  Director: "bg-orange-50 text-orange-700 ring-orange-100",
  VP: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function JobCard({
  job,
  selected,
  matchPercent,
}: {
  job: Job;
  selected?: boolean;
  matchPercent?: number;
}) {
  const seniorityStyle =
    SENIORITY_STYLES[job.seniority] ?? "bg-gray-50 text-gray-700 ring-gray-100";

  return (
    <article
      className={`group relative h-full rounded-2xl border bg-[var(--card)] p-5 text-[var(--card-foreground)] transition-all duration-200
        ${
          selected
            ? "border-amber-700 shadow-xl shadow-amber-950/15 ring-2 ring-amber-700/50"
            : "border-gray-200/70 shadow-sm hover:-translate-y-1 hover:border-amber-200/80 hover:shadow-lg hover:shadow-amber-950/8"
        }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-amber-900 via-amber-700 to-amber-500 transition-opacity duration-200 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-gray-900 pr-1">
          {job.title}
        </h3>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {matchPercent != null && (
            <span
              className={`rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1 ring-inset ring-emerald-100 ${matchPercentColor(matchPercent)}`}
            >
              {matchPercent}% match
            </span>
          )}
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-400 whitespace-nowrap">
            {timeAgo(job.date_posted)}
          </span>
        </div>
      </div>

      <p className="mt-1 text-sm font-medium text-amber-900/80">
        {job.company}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${seniorityStyle}`}
        >
          {job.seniority}
        </span>
        <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-100">
          {job.location_type}
        </span>
        <span className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-100">
          {job.employment_type}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
        <svg
          className="h-3.5 w-3.5 shrink-0 text-gray-400"
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
        {job.location}
      </div>

      <p className="mt-2.5 text-sm font-semibold text-gray-900">
        {job.compensation}
      </p>

      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
        {job.description.split("\n").filter(Boolean)[0]}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
        {job.skills.slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
          >
            {s}
          </span>
        ))}
        {job.skills.length > 4 && (
          <span className="rounded-md px-2 py-0.5 text-[11px] font-medium text-gray-400">
            +{job.skills.length - 4}
          </span>
        )}
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/40 bg-[var(--card)] p-5">
      <div className="skeleton mb-3 h-5 w-3/4 rounded-md" />
      <div className="skeleton mb-4 h-4 w-1/3 rounded-md" />
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-4 w-1/2 rounded-md" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded-md" />
      <div className="skeleton mt-4 h-10 w-full rounded-md" />
      <div className="flex gap-1.5 mt-4 pt-3 border-t border-gray-100">
        <div className="skeleton h-5 w-14 rounded-md" />
        <div className="skeleton h-5 w-14 rounded-md" />
        <div className="skeleton h-5 w-14 rounded-md" />
      </div>
    </div>
  );
}
