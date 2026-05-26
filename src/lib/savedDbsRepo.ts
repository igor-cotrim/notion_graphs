import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "./db/client";
import { folders, savedDbs } from "./db/schema";
import type { StoredDbState } from "./types";

export type FolderNode = {
  id: string;
  name: string;
  dbs: Array<{
    id: string;
    label: string;
    notionDbId: string;
    state: StoredDbState | null;
  }>;
};

export type FolderTree = FolderNode[];

const DEFAULT_FOLDER_NAME = "My databases";

export function savedDbsTag(userId: string): string {
  return `saved-dbs:${userId}`;
}

export function savedDbTag(savedDbId: string): string {
  return `saved-db:${savedDbId}`;
}

export type SavedDbForEmbed = {
  userId: string;
  notionDbId: string;
  label: string;
  state: StoredDbState | null;
};

async function fetchSavedDbForEmbed(
  savedDbId: string,
): Promise<SavedDbForEmbed | null> {
  const rows = await db
    .select({
      userId: savedDbs.userId,
      notionDbId: savedDbs.notionDbId,
      label: savedDbs.label,
      state: savedDbs.state,
    })
    .from(savedDbs)
    .where(eq(savedDbs.id, savedDbId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.userId,
    notionDbId: row.notionDbId,
    label: row.label,
    state: row.state ?? null,
  };
}

export function loadSavedDbForEmbed(
  savedDbId: string,
): Promise<SavedDbForEmbed | null> {
  return unstable_cache(
    () => fetchSavedDbForEmbed(savedDbId),
    ["saved-db-embed", savedDbId],
    { tags: [savedDbTag(savedDbId)] },
  )();
}

async function fetchFolderTree(userId: string): Promise<FolderTree> {
  const [folderRows, dbRows] = await Promise.all([
    db
      .select({
        id: folders.id,
        name: folders.name,
        position: folders.position,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(asc(folders.position), asc(folders.createdAt)),
    db
      .select({
        id: savedDbs.id,
        folderId: savedDbs.folderId,
        label: savedDbs.label,
        notionDbId: savedDbs.notionDbId,
        state: savedDbs.state,
        position: savedDbs.position,
        createdAt: savedDbs.createdAt,
      })
      .from(savedDbs)
      .where(eq(savedDbs.userId, userId))
      .orderBy(asc(savedDbs.position), asc(savedDbs.createdAt)),
  ]);

  const byFolder = new Map<string, FolderNode["dbs"]>();
  for (const f of folderRows) byFolder.set(f.id, []);
  for (const r of dbRows) {
    const bucket = byFolder.get(r.folderId);
    if (!bucket) continue;
    bucket.push({
      id: r.id,
      label: r.label,
      notionDbId: r.notionDbId,
      state: r.state ?? null,
    });
  }

  return folderRows.map((f) => ({
    id: f.id,
    name: f.name,
    dbs: byFolder.get(f.id) ?? [],
  }));
}

export function loadFolderTree(userId: string): Promise<FolderTree> {
  return unstable_cache(
    () => fetchFolderTree(userId),
    ["folder-tree", userId],
    { tags: [savedDbsTag(userId)] },
  )();
}

function newId(): string {
  return crypto.randomUUID();
}

export async function ensureDefaultFolder(userId: string): Promise<string> {
  const existing = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(eq(folders.userId, userId), eq(folders.name, DEFAULT_FOLDER_NAME)),
    )
    .limit(1);
  if (existing[0]) return existing[0].id;
  const id = newId();
  await db.insert(folders).values({ id, userId, name: DEFAULT_FOLDER_NAME });
  return id;
}

export async function insertFolder(
  userId: string,
  name: string,
): Promise<string> {
  const id = newId();
  await db.insert(folders).values({ id, userId, name });
  return id;
}

export async function updateFolderName(
  userId: string,
  id: string,
  name: string,
): Promise<void> {
  const res = await db
    .update(folders)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(folders.id, id), eq(folders.userId, userId)))
    .returning({ id: folders.id });
  if (res.length === 0) throw new Error("Folder not found");
}

export async function deleteFolderById(
  userId: string,
  id: string,
): Promise<void> {
  const res = await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)))
    .returning({ id: folders.id });
  if (res.length === 0) {
    console.error("[deleteFolderById] Folder not found", { userId, id });
    throw new Error("Folder not found");
  }
}

export async function insertSavedDb(args: {
  userId: string;
  folderId: string;
  notionDbId: string;
  label: string;
  state: StoredDbState | null;
}): Promise<string> {
  const id = newId();
  await db.insert(savedDbs).values({
    id,
    userId: args.userId,
    folderId: args.folderId,
    notionDbId: args.notionDbId,
    label: args.label,
    state: args.state,
  });
  return id;
}

export async function updateSavedDbLabel(
  userId: string,
  id: string,
  label: string,
): Promise<void> {
  const res = await db
    .update(savedDbs)
    .set({ label, updatedAt: new Date() })
    .where(and(eq(savedDbs.id, id), eq(savedDbs.userId, userId)))
    .returning({ id: savedDbs.id });
  if (res.length === 0) throw new Error("Saved DB not found");
}

export async function updateSavedDbStateById(
  userId: string,
  id: string,
  state: StoredDbState,
): Promise<void> {
  await db
    .update(savedDbs)
    .set({ state, updatedAt: new Date() })
    .where(and(eq(savedDbs.id, id), eq(savedDbs.userId, userId)));
}

export async function moveSavedDbToFolder(
  userId: string,
  id: string,
  toFolderId: string,
): Promise<void> {
  // Verify target folder belongs to this user before moving
  const targetFolder = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, toFolderId), eq(folders.userId, userId)))
    .limit(1);
  if (!targetFolder[0]) {
    console.error("[moveSavedDbToFolder] Target folder not found", {
      userId,
      toFolderId,
    });
    throw new Error("Target folder not found");
  }
  const res = await db
    .update(savedDbs)
    .set({ folderId: toFolderId, updatedAt: new Date() })
    .where(and(eq(savedDbs.id, id), eq(savedDbs.userId, userId)))
    .returning({ id: savedDbs.id });
  if (res.length === 0) {
    console.error("[moveSavedDbToFolder] Saved DB not found", { userId, id });
    throw new Error("Saved DB not found");
  }
}

export async function deleteSavedDbById(
  userId: string,
  id: string,
): Promise<void> {
  const res = await db
    .delete(savedDbs)
    .where(and(eq(savedDbs.id, id), eq(savedDbs.userId, userId)))
    .returning({ id: savedDbs.id });
  if (res.length === 0) throw new Error("Saved DB not found");
}

export async function reorderDbs(
  userId: string,
  folderId: string,
  orderedIds: string[],
): Promise<void> {
  const folder = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);
  if (!folder[0]) throw new Error("Folder not found");
  await Promise.all(
    orderedIds.map((id, position) =>
      db
        .update(savedDbs)
        .set({ position, updatedAt: new Date() })
        .where(
          and(
            eq(savedDbs.id, id),
            eq(savedDbs.userId, userId),
            eq(savedDbs.folderId, folderId),
          ),
        ),
    ),
  );
}
