"use client";

import { useState } from "react";

export function InlineTextInput({
  initial = "",
  placeholder,
  submitLabel = "Save",
  onCommit,
  onCancel,
}: {
  initial?: string;
  placeholder?: string;
  submitLabel?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();

  function commit() {
    if (!trimmed) {
      onCancel();
      return;
    }
    onCommit(trimmed);
  }

  return (
    <div className="flex gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 rounded border border-[#2a2a28] bg-[#161614] px-2 py-1 text-xs text-white placeholder:text-white/25 focus:border-[#f97316] focus:outline-none transition"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={commit}
        className="rounded bg-[#f97316] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#ea6d0b]"
      >
        {submitLabel}
      </button>
    </div>
  );
}
