"use client";
import { useState, useRef } from "react";

export default function ResumeUpload({
  onFileSelected,
}: {
  onFileSelected?: (file: File) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max 5MB.");
      return;
    }
    setFileName(file.name);
    onFileSelected?.(file);
  }

  function clearFile() {
    setFileName(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl glass-panel animate-fade-in stagger-1">
      {/* gradient accent strip */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />

      <div className="flex items-start justify-between gap-6 flex-wrap p-5 sm:p-6">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-800/30">
              <svg
                className="h-4 w-4 text-amber-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Get matched to your best-fit roles
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
            Upload your resume and we&apos;ll rank openings by how well they fit
            your experience, skills, and seniority. Your file is read to find
            matches - never stored.
          </p>
        </div>

        <div className="flex-1 min-w-[260px] max-w-sm">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200
              ${
                dragging
                  ? "border-amber-500 bg-amber-800/15 scale-[1.01]"
                  : fileName
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-[var(--border-strong)] hover:border-amber-500/50 hover:bg-white/[0.03]"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {fileName ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    className="h-5 w-5 text-emerald-400"
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
                <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <span className="font-medium truncate max-w-[180px]">
                    {fileName}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="text-amber-300 hover:text-amber-200 underline underline-offset-2 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <svg
                    className="h-5 w-5 text-[var(--foreground-muted)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  <span className="font-medium text-amber-300">
                    Click to upload
                  </span>{" "}
                  or drag & drop
                </p>
                <p className="text-xs text-[var(--foreground-muted)]/70">
                  PDF only · max 5MB
                </p>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-400 mt-2 flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
