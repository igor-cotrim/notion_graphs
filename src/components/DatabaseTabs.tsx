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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Databases
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNew}
            className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
          >
            + New
          </button>
          {!isActiveSaved && activeDb && !adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
            >
              + Save current
            </button>
          ) : null}
        </div>
      </div>

      {items.length === 0 && !adding ? (
        <p className="text-xs text-zinc-400">
          No saved databases yet. Paste an ID below and click{" "}
          <strong>+ Save current</strong> to pin it as a tab.
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
                  "inline-flex items-center gap-1 rounded-md border text-xs font-medium transition",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400",
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
                    active
                      ? "text-white/70 hover:text-white"
                      : "text-zinc-400 hover:text-zinc-700",
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
            placeholder="Label (e.g. 04/2026)"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={commitAdd}
            className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white"
          >
            Save
          </button>
        </div>
      ) : null}
    </div>
  );
}
