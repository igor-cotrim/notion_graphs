"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FolderNode } from "@/lib/savedDbsRepo";
import { InlineTextInput } from "./InlineTextInput";

type SavedDb = FolderNode["dbs"][number];

export function SavedDbTab({
  db,
  active,
  moveTargets,
  onSelect,
  onRename,
  onMove,
  onDelete,
}: {
  db: SavedDb;
  active: boolean;
  moveTargets: Array<{ id: string; name: string }>;
  onSelect: () => void;
  onRename: (label: string) => void;
  onMove: (toFolderId: string) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: db.id });

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  if (renaming) {
    return (
      <InlineTextInput
        initial={db.label}
        placeholder="Label"
        onCommit={(label) => {
          onRename(label);
          setRenaming(false);
        }}
        onCancel={() => setRenaming(false)}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        "group relative flex items-center rounded border text-xs font-medium transition",
        active
          ? "border-[#f97316]/50 bg-[#f97316]/10 text-[#f97316]"
          : "border-[#2a2a28] text-white/80 hover:border-[#3a3a38] hover:text-white/95",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
        suppressHydrationWarning
        className="cursor-grab px-1.5 py-1 text-[11px] leading-none text-white/55 hover:text-white/80 active:cursor-grabbing"
      >
        ⠿
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 truncate py-1 pr-1 text-left"
        title={db.label}
      >
        {db.label}
      </button>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`More actions for ${db.label}`}
          className={[
            "px-1.5 py-1 text-[11px] leading-none transition",
            active
              ? "text-[#f97316]/60 hover:text-[#f97316]"
              : "text-white/55 hover:text-white/85",
          ].join(" ")}
        >
          ⋯
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full z-10 mt-1 min-w-40 overflow-hidden rounded border border-[#2a2a28] bg-[#161614] py-1 text-xs shadow-lg">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setRenaming(true);
              }}
              className="block w-full px-2.5 py-1.5 text-left text-white/85 hover:bg-[#2a2a28] hover:text-white"
            >
              Rename
            </button>
            {moveTargets.length > 0 ? (
              <div className="border-t border-[#2a2a28] py-1">
                <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/65">
                  Move to
                </p>
                {moveTargets.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onMove(f.id);
                    }}
                    className="block w-full truncate px-2.5 py-1 text-left text-white/80 hover:bg-[#2a2a28] hover:text-white/95"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="block w-full border-t border-[#2a2a28] px-2.5 py-1.5 text-left text-red-400 hover:bg-[#2a2a28]"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
