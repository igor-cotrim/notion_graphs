"use server";

import { updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  deleteFolderById,
  deleteSavedDbById,
  ensureDefaultFolder,
  insertFolder,
  insertSavedDb,
  moveSavedDbToFolder,
  reorderDbs,
  savedDbTag,
  savedDbsTag,
  updateFolderName,
  updateSavedDbLabel,
  updateSavedDbStateById,
} from "@/lib/savedDbsRepo";
import type { StoredDbState } from "@/lib/types";

function normName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Name is required");
  if (trimmed.length > 80) throw new Error("Name is too long (max 80 chars)");
  return trimmed;
}

export async function createFolder(name: string): Promise<{ id: string }> {
  const user = await requireUser();
  const id = await insertFolder(user.id, normName(name));
  updateTag(savedDbsTag(user.id));
  return { id };
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const user = await requireUser();
  await updateFolderName(user.id, id, normName(name));
  updateTag(savedDbsTag(user.id));
}

export async function deleteFolder(id: string): Promise<void> {
  const user = await requireUser();
  await deleteFolderById(user.id, id);
  updateTag(savedDbsTag(user.id));
}

export async function createSavedDb(input: {
  folderId?: string;
  notionDbId: string;
  label: string;
  state: StoredDbState | null;
}): Promise<{ id: string; folderId: string }> {
  const user = await requireUser();
  const notionDbId = input.notionDbId.trim();
  if (!notionDbId) throw new Error("Database ID is required");
  const folderId = input.folderId ?? (await ensureDefaultFolder(user.id));
  try {
    const id = await insertSavedDb({
      userId: user.id,
      folderId,
      notionDbId,
      label: normName(input.label),
      state: input.state,
    });
    updateTag(savedDbsTag(user.id));
    return { id, folderId };
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      throw new Error("Already saved in this folder");
    }
    throw e;
  }
}

export async function renameSavedDb(id: string, label: string): Promise<void> {
  const user = await requireUser();
  await updateSavedDbLabel(user.id, id, normName(label));
  updateTag(savedDbsTag(user.id));
}

export async function deleteSavedDb(id: string): Promise<void> {
  const user = await requireUser();
  await deleteSavedDbById(user.id, id);
  updateTag(savedDbsTag(user.id));
  updateTag(savedDbTag(id));
}

function pgCode(e: unknown): string | undefined {
  const err = e as Record<string, unknown> | null;
  if (!err) return undefined;
  // DrizzleError wraps neon errors in .cause; check both levels
  return (err.code as string | undefined) ??
    ((err.cause as Record<string, unknown> | undefined)?.code as string | undefined);
}

export async function moveSavedDb(
  id: string,
  toFolderId: string,
): Promise<void> {
  const user = await requireUser();
  try {
    await moveSavedDbToFolder(user.id, id, toFolderId);
    updateTag(savedDbsTag(user.id));
  } catch (e) {
    console.error("[moveSavedDb] error code:", pgCode(e), "raw:", e);
    if (pgCode(e) === "23505") {
      throw new Error("Already saved in target folder");
    }
    throw e;
  }
}

export async function updateSavedDbState(
  id: string,
  state: StoredDbState,
): Promise<void> {
  const user = await requireUser();
  await updateSavedDbStateById(user.id, id, state);
  updateTag(savedDbsTag(user.id));
  updateTag(savedDbTag(id));
}

export async function reorderSavedDbs(
  folderId: string,
  orderedIds: string[],
): Promise<void> {
  const user = await requireUser();
  await reorderDbs(user.id, folderId, orderedIds);
  updateTag(savedDbsTag(user.id));
}
