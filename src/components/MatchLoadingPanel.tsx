"use client";
import { useEffect, useState } from "react";

const UPLOAD_PHRASES = [
  "Reading your resume…",
  "Extracting your skills and experience…",
  "Building your career profile…",
  "Almost ready to find your matches…",
];

const MATCH_PHRASES = [
  "Fetching the best matches for you…",
  "Scanning open roles for your profile…",
  "Comparing your skills to job requirements…",
  "Ranking opportunities by fit…",
  "Curating your top 20 matches…",
  "Found your top 20 matches — hang tight!",
];

export default function MatchLoadingPanel({
  mode,
}: {
  mode: "upload" | "match";
}) {
  const phrases = mode === "upload" ? UPLOAD_PHRASES : MATCH_PHRASES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [mode]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 2600);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mb-8 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[var(--coral)]/20" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--coral)] animate-spin" />
        <span className="search-loader" aria-hidden="true">
          <span className="search-loader-dot" />
          <span className="search-loader-dot" />
          <span className="search-loader-dot" />
        </span>
      </div>

      <p
        key={`${mode}-${index}`}
        className="match-phrase text-lg font-medium text-[var(--foreground)] max-w-md"
      >
        {phrases[index]}
      </p>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        {mode === "upload"
          ? "This usually takes a few seconds"
          : "Personalizing results from your resume"}
      </p>
    </div>
  );
}
