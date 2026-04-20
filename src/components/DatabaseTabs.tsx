"use client";

import { useEffect, useState } from "react";
import {
  loadSavedDbs,
  persistSavedDbs,
  type SavedDb,
  type StoredDbState,
} from "@/lib/savedDbs";

export function DatabaseTabs({
  activeDb,
  currentState,
  onSelect,
  onNew,
}: {
  activeDb: string;
  currentState: StoredDbState;
  onSelect: (id: string, state?: StoredDbState) => void;
  onNew: () => void;
}) {
  const [items, setItems] = useState<SavedDb[]>([]);
  const [adding, setAdding] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");

  // localStorage is only available after hydration — populate on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setItems(loadSavedDbs()), []);

  function commitAdd() {
    const label = draftLabel.trim();
    if (!label || !activeDb) {
      setAdding(false);
      setDraftLabel("");
      return;
    }
    if (items.some((i) => i.id === activeDb)) {
      setAdding(false);
      setDraftLabel("");
      return;
    }
    const next = [...items, { label, id: activeDb, state: currentState }];
    setItems(next);
    persistSavedDbs(next);
    setAdding(false);
    setDraftLabel("");
  }

  function remove(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    persistSavedDbs(next);
  }

  const isActiveSaved = items.some((i) => i.id === activeDb);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/35">
          Databases
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNew}
            className="text-xs font-medium text-white/40 transition hover:text-white/70"
          >
            + New
          </button>
          {!isActiveSaved && activeDb && !adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-xs font-medium text-white/40 transition hover:text-white/70"
            >
              + Save
            </button>
          ) : null}
        </div>
      </div>

      {items.length === 0 && !adding ? (
        <p className="text-xs leading-relaxed text-white/25">
          Paste a database ID below and click{" "}
          <strong className="text-white/40">+ Save</strong> to pin it here.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => {
            const active = item.id === activeDb;
            return (
              <span
                key={item.id}
                className={[
                  "inline-flex items-center gap-0.5 rounded border text-xs font-medium transition",
                  active
                    ? "border-[#f97316]/50 bg-[#f97316]/10 text-[#f97316]"
                    : "border-[#2a2a28] text-white/45 hover:border-[#3a3a38] hover:text-white/70",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item.id, item.state)}
                  className="px-2 py-1"
                >
                  {item.label}
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.label}`}
                  className={[
                    "px-1.5 py-1 text-[11px] leading-none transition",
                    active ? "text-[#f97316]/60 hover:text-[#f97316]" : "text-white/25 hover:text-white/60",
                  ].join(" ")}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      {adding ? (
        <div className="flex gap-1">
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setDraftLabel("");
              }
            }}
            placeholder="Label (e.g. Budget 04/2026)"
            className="flex-1 rounded border border-[#2a2a28] bg-[#161614] px-2 py-1 text-xs text-white placeholder:text-white/25 focus:border-[#f97316] focus:outline-none transition"
          />
          <button
            type="button"
            onClick={commitAdd}
            className="rounded bg-[#f97316] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#ea6d0b]"
          >
            Save
          </button>
        </div>
      ) : null}
    </div>
  );
}
