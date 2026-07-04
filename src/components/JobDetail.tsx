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
      <div className="h-full flex items-center justify-center text-gray-400 text-sm p-8 text-center">
        Select a role to see the details.
      </div>
    );
  }

  // description arrives as newline-separated text; split into readable lines
  const lines = job.description.split("\n").filter(Boolean);

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
          <p className="text-gray-600 mt-1">{job.company}</p>
        </div>
        <ShareMenu job={job} />
      </div>

      {/* meta chips */}
      <div className="flex flex-wrap gap-1.5 mt-4">
        {[
          job.location,
          job.location_type,
          job.employment_type,
          job.seniority,
        ].map((m, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
          >
            {m}
          </span>
        ))}
      </div>
      <p className="text-sm font-medium text-gray-800 mt-3">
        {job.compensation}
      </p>

      {/* ---- resume-gated sections (only after upload) ---- */}
      {resumeUploaded && (
        <div className="mt-6 space-y-4">
          {/* match score — placeholder until match route wired */}
          <section className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900">
                Match score
              </span>
              <span className="text-lg font-semibold text-green-700">— %</span>
            </div>
            <p className="text-xs text-green-800 mt-1">
              Based on your uploaded resume.
            </p>
          </section>

          {/* top skills / keywords — placeholder */}
          <section className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Top skills & keywords
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          {/* insights — placeholder */}
          <section className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Insights</h3>
            <p className="text-sm text-gray-500">
              Personalized fit insights will appear here once matching is
              enabled.
            </p>
          </section>
        </div>
      )}

      {/* full description — always visible */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          About this role
        </h3>
        <div className="text-sm text-gray-700 space-y-1">
          {lines.map((line, i) => (
            <p key={i} className={line.trim().startsWith("-") ? "pl-3" : ""}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
