"use client";
import { useState } from "react";

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
        onClick={() => setOpen((o) => !o)}
        className="border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 flex items-center gap-1 hover:bg-gray-50"
      >
        {labelText}
        <span className="text-gray-500">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 min-w-[200px] max-h-72 overflow-y-auto bg-white border rounded-lg shadow-lg z-20 py-1">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
