"use client";
import { useEffect, useState } from "react";
import { Job } from "@/lib/store";
import ShareMenu from "@/components/ShareMenu";
import {
  matchPercentBg,
  matchPercentColor,
} from "@/lib/matchScore";
import type { InsightProfile, SkillKeyword } from "@/lib/matchInsights";

export type MatchProfile = InsightProfile;

type InsightsCache = {
  insights: string[];
  skillKeywords: SkillKeyword[];
};

export default function JobDetail({
  job,
  resumeUploaded,
  matchProfile,
  matchPercent,
}: {
  job: Job | null;
  resumeUploaded: boolean;
  matchProfile?: MatchProfile | null;
  matchPercent?: number;
}) {
  const [insights, setInsights] = useState<InsightsCache | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  useEffect(() => {
    if (!resumeUploaded || !job || !matchProfile) {
      setInsights(null);
      setInsightsError("");
      return;
    }

    let cancelled = false;
    setInsightsLoading(true);
    setInsightsError("");
    setInsights(null);

    fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: matchProfile, jobId: job.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setInsightsError(data.error);
          return;
        }
        setInsights({
          insights: data.insights ?? [],
          skillKeywords: data.skillKeywords ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setInsightsError("Couldn't load match insights");
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [job?.id, resumeUploaded, matchProfile]);

  if (!job) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[var(--card)]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--peach)]/20">
          <svg
            className="h-7 w-7 text-[var(--coral)]"
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
  const percent = matchPercent ?? 0;

  return (
    <div className="detail-scroll h-full overflow-y-auto bg-[var(--card)]">
      <div className="border-b border-gray-100 bg-gradient-to-br from-[var(--peach)]/15 via-white to-white px-6 pb-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-snug">
              {job.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-600">
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
        {resumeUploaded && matchProfile && (
          <div className="mb-6 space-y-4">
            <section
              className={`overflow-hidden rounded-xl border bg-gradient-to-br px-3.5 py-3 ${matchPercentBg(percent)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/70">
                    <svg
                      className="h-3.5 w-3.5 text-emerald-600"
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
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-gray-800">
                      Match score
                    </span>
                    <p className="text-[10px] leading-tight text-gray-600/75 truncate">
                      Based on your resume & this role
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-lg font-bold tabular-nums ${matchPercentColor(percent)}`}
                >
                  {matchPercent != null ? `${percent}%` : "—"}
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Top skills & keywords
              </h3>
              {insightsLoading && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton h-6 rounded-lg"
                      style={{ width: `${56 + (i % 3) * 20}px` }}
                    />
                  ))}
                </div>
              )}
              {!insightsLoading && insights && (
                <div className="flex flex-wrap gap-1.5">
                  {insights.skillKeywords.map(({ term, matched }) => (
                    <span
                      key={term}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        matched
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                          : "bg-gray-50 text-gray-600 ring-gray-200"
                      }`}
                    >
                      {matched && (
                        <span className="mr-1 text-emerald-600" aria-hidden>
                          ✓
                        </span>
                      )}
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                AI match insights
              </h3>
              {insightsLoading && (
                <div
                  className="rounded-lg border border-[var(--peach)]/30 bg-[var(--peach)]/10 p-4"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-[var(--coral)]/20 animate-ping" />
                      <svg
                        className="insights-loading-icon relative h-5 w-5 text-[var(--coral)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.75}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Analyzing your fit…
                      </p>
                      <p className="text-xs text-gray-500">
                        Generating personalized insights
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--coral)] animate-pulse-soft"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                        <div
                          className="insights-loading-bar h-3 flex-1 rounded-full"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!insightsLoading && insightsError && (
                <p className="text-sm text-red-500">{insightsError}</p>
              )}
              {!insightsLoading && insights && insights.insights.length > 0 && (
                <ul className="space-y-2.5">
                  {insights.insights.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-sm leading-relaxed text-gray-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--coral)]" />
                      {line}
                    </li>
                  ))}
                </ul>
              )}
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
                    ? "relative pl-4 before:absolute before:left-0 before:font-bold before:text-[var(--coral)] before:content-['•']"
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
