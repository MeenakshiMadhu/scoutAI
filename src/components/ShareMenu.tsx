"use client";
import { useState } from "react";
import { Job } from "@/lib/store";

export default function ShareMenu({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // In production this is the deployed job URL; for now we build a shareable link to the job id.
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/?job=${job.id}`
      : "";
  const text = `${job.title} at ${job.company} (${job.location})`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const mailto = `mailto:?subject=${encodeURIComponent(
    text
  )}&body=${encodeURIComponent(text + "\n\n" + url)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 bg-white text-gray-900"
      >
        Share
      </button>
      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg z-20 py-1 text-sm">
            <button
              onClick={() => {
                copyLink();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a
              href={mailto}
              className="block px-3 py-2 hover:bg-gray-50 text-gray-900"
              onClick={() => setOpen(false)}
            >
              Email
            </a>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 hover:bg-gray-50 text-gray-900"
              onClick={() => setOpen(false)}
            >
              LinkedIn
            </a>
          </div>
        </>
      )}
    </div>
  );
}
