"use client";
import { useState } from "react";

export default function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="filter-input rounded-xl px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer"
      >
        {selectedLabel}
        <svg
          className={`h-3.5 w-3.5 text-[var(--foreground-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setOpen(false)}
          />
          <div className="dropdown-menu absolute left-0 mt-1.5 min-w-[220px] max-h-72 overflow-y-auto rounded-xl z-[110] py-1.5">
            {options.map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors
                    ${selected ? "text-[var(--beige)] bg-[var(--coral)]/20" : "text-[var(--foreground)] hover:bg-white/8"}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
