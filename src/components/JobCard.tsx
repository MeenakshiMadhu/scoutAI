import { Job } from "@/lib/store";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-[var(--card)] text-[var(--card-foreground)] flex flex-col">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-gray-900 leading-snug">
          {job.title}
        </h3>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {timeAgo(job.date_posted)}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{job.company}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {job.location_type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {job.employment_type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {job.seniority}
        </span>
      </div>

      <p className="text-sm text-gray-500 mt-3">{job.location}</p>
      <p className="text-sm font-medium text-gray-800 mt-1">
        {job.compensation}
      </p>

      <p className="text-sm text-gray-600 mt-3 line-clamp-3 flex-1">
        {job.description.split("\n").filter(Boolean)[0]}
      </p>

      <div className="flex flex-wrap gap-1 mt-3">
        {job.skills.slice(0, 4).map((s) => (
          <span
            key={s}
            className="text-xs text-gray-500 border rounded px-1.5 py-0.5"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
