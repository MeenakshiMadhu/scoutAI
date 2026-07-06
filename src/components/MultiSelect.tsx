"use client";
import { useState } from "react";

const CHEVRON = (
  <svg
    className="h-3.5 w-3.5 text-[var(--foreground-muted)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(opt: string) {
    if (selected.includes(opt)) onChange(selected.filter((o) => o !== opt));
    else onChange([...selected, opt]);
  }

  const labelText =
    selected.length === 0 ? label : `${label} (${selected.length})`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`filter-input rounded-xl px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer
          ${selected.length > 0 ? "filter-input-active" : ""}`}
      >
        {labelText}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          {CHEVRON}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setOpen(false)}
          />
          <div className="dropdown-menu absolute left-0 mt-1.5 min-w-[220px] max-h-72 overflow-y-auto rounded-xl z-[110] py-1.5">
            {options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
                    ${checked ? "text-[var(--beige)] bg-[var(--coral)]/20" : "text-[var(--foreground)] hover:bg-white/8"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt)}
                    className="accent-[var(--coral)] rounded"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
