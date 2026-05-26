"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { FolderNode } from "@/lib/savedDbsRepo";
import { useLocale } from "@/hooks/useLocale";
import { InlineTextInput } from "./InlineTextInput";
import { SavedDbTab } from "./SavedDbTab";

export function FolderItem({
  folder,
  allFolders,
  activeSavedDbId,
  activeDbId,
  canSaveHere,
  collapsed,
  onToggleCollapsed,
  onRenameFolder,
  onDeleteFolder,
  onSaveCurrent,
  onSelectDb,
  onRenameDb,
  onMoveDb,
  onDeleteDb,
  onReorderDbs,
}: {
  folder: FolderNode;
  allFolders: Array<{ id: string; name: string; notionDbIds: Set<string> }>;
  activeSavedDbId: string | null;
  activeDbId: string;
  canSaveHere: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRenameFolder: (name: string) => void;
  onDeleteFolder: () => void;
  onSaveCurrent: (label: string) => void;
  onSelectDb: (id: string) => void;
  onRenameDb: (id: string, label: string) => void;
  onMoveDb: (id: string, toFolderId: string) => void;
  onDeleteDb: (id: string) => void;
  onReorderDbs: (orderedIds: string[]) => void;
}) {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [localDbs, setLocalDbs] = useState(folder.dbs);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalDbs(folder.dbs);
  }, [folder.dbs]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localDbs.findIndex((d) => d.id === active.id);
    const newIndex = localDbs.findIndex((d) => d.id === over.id);
    const newDbs = arrayMove(localDbs, oldIndex, newIndex);
    setLocalDbs(newDbs);
    onReorderDbs(newDbs.map((d) => d.id));
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  function moveTargetsFor(notionDbId: string) {
    return allFolders.filter(
      (f) => f.id !== folder.id && !f.notionDbIds.has(notionDbId),
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {renaming ? (
          <div className="flex-1">
            <InlineTextInput
              initial={folder.name}
              placeholder={t("folders.folderNamePlaceholder")}
              onCommit={(name) => {
                onRenameFolder(name);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex flex-1 items-center gap-1.5 truncate text-left text-xs font-semibold text-white/75 transition hover:text-white/90"
              title={folder.name}
            >
              <span aria-hidden className="text-[9px] text-white/65">
                {collapsed ? "▸" : "▾"}
              </span>
              <span className="truncate">{folder.name}</span>
              <span className="text-[10px] font-normal text-white/60">
                {folder.dbs.length}
              </span>
            </button>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={`More actions for folder ${folder.name}`}
                className="px-1.5 py-0.5 text-[11px] leading-none text-white/55 transition hover:text-white/85"
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
                    {t("folders.renameFolder")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmingDelete(true);
                    }}
                    className="block w-full border-t border-[#2a2a28] px-2.5 py-1.5 text-left text-red-400 hover:bg-[#2a2a28]"
                  >
                    {t("folders.deleteFolder")}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-2 rounded border border-red-400/30 bg-red-400/5 px-2 py-1.5">
          <span className="flex-1 text-[11px] text-red-400/80">
            {folder.dbs.length === 0
              ? t("folders.deleteFolderEmpty")
              : folder.dbs.length === 1
                ? t("folders.deleteFolderWithDb").replace("{count}", "1")
                : t("folders.deleteFolderWithDbs").replace(
                    "{count}",
                    String(folder.dbs.length),
                  )}
          </span>
          <button
            type="button"
            onClick={() => {
              setConfirmingDelete(false);
              onDeleteFolder();
            }}
            className="rounded bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-red-600"
          >
            {t("folders.delete")}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="text-[11px] text-white/70 transition hover:text-white/85"
          >
            {t("folders.cancel")}
          </button>
        </div>
      ) : null}

      {!collapsed ? (
        <div className="flex flex-col gap-1 pl-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localDbs.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {localDbs.map((db) => (
                <SavedDbTab
                  key={db.id}
                  db={db}
                  active={db.id === activeSavedDbId}
                  moveTargets={moveTargetsFor(db.notionDbId)}
                  onSelect={() => onSelectDb(db.id)}
                  onRename={(label) => onRenameDb(db.id, label)}
                  onMove={(toFolderId) => onMoveDb(db.id, toFolderId)}
                  onDelete={() => onDeleteDb(db.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {savingNew ? (
            <InlineTextInput
              initial=""
              placeholder={t("folders.saveLabelPlaceholder")}
              onCommit={(label) => {
                onSaveCurrent(label);
                setSavingNew(false);
              }}
              onCancel={() => setSavingNew(false)}
            />
          ) : canSaveHere && activeDbId ? (
            <button
              type="button"
              onClick={() => setSavingNew(true)}
              className="self-start text-[11px] font-medium text-white/65 transition hover:text-white/85"
            >
              {t("folders.saveCurrentDb")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
