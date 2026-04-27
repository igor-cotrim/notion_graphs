"use client";

import { useState } from "react";
import type { FolderTree } from "@/lib/savedDbsRepo";
import { FolderItem } from "./FolderItem";
import { InlineTextInput } from "./InlineTextInput";

export function FolderList({
  folders,
  activeSavedDbId,
  activeDbId,
  collapsedIds,
  onToggleCollapsed,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onSaveCurrent,
  onSelectDb,
  onRenameDb,
  onMoveDb,
  onDeleteDb,
  onReorderDbs,
  onNewBlank,
}: {
  folders: FolderTree;
  activeSavedDbId: string | null;
  activeDbId: string;
  collapsedIds: Set<string>;
  onToggleCollapsed: (folderId: string) => void;
  onNewFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onSaveCurrent: (folderId: string, label: string) => void;
  onSelectDb: (id: string) => void;
  onRenameDb: (id: string, label: string) => void;
  onMoveDb: (id: string, toFolderId: string) => void;
  onDeleteDb: (id: string) => void;
  onReorderDbs: (folderId: string, orderedIds: string[]) => void;
  onNewBlank: () => void;
}) {
  const [addingFolder, setAddingFolder] = useState(false);
  const allFolders = folders.map((f) => ({
    id: f.id,
    name: f.name,
    notionDbIds: new Set(f.dbs.map((d) => d.notionDbId)),
  }));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/65">
          Databases
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNewBlank}
            className="text-xs font-medium text-white/70 transition hover:text-white/85"
          >
            + New
          </button>
          {!addingFolder ? (
            <button
              type="button"
              onClick={() => setAddingFolder(true)}
              className="text-xs font-medium text-white/70 transition hover:text-white/85"
            >
              + Folder
            </button>
          ) : null}
        </div>
      </div>

      {addingFolder ? (
        <InlineTextInput
          placeholder="Folder name"
          onCommit={(name) => {
            onNewFolder(name);
            setAddingFolder(false);
          }}
          onCancel={() => setAddingFolder(false)}
        />
      ) : null}

      {folders.length === 0 && !addingFolder ? (
        <p className="text-xs leading-relaxed text-white/55">
          Create a folder to start pinning Notion databases.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {folders.map((folder) => {
          const containsActive = folder.dbs.some(
            (d) => d.notionDbId === activeDbId,
          );
          return (
            <FolderItem
              key={folder.id}
              folder={folder}
              allFolders={allFolders}
              activeSavedDbId={activeSavedDbId}
              activeDbId={activeDbId}
              canSaveHere={!containsActive}
              collapsed={collapsedIds.has(folder.id)}
              onToggleCollapsed={() => onToggleCollapsed(folder.id)}
              onRenameFolder={(name) => onRenameFolder(folder.id, name)}
              onDeleteFolder={() => onDeleteFolder(folder.id)}
              onSaveCurrent={(label) => onSaveCurrent(folder.id, label)}
              onSelectDb={onSelectDb}
              onRenameDb={onRenameDb}
              onMoveDb={onMoveDb}
              onDeleteDb={onDeleteDb}
              onReorderDbs={(ids) => onReorderDbs(folder.id, ids)}
            />
          );
        })}
      </div>
    </div>
  );
}
