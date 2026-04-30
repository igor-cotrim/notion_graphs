"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encodeEmbedRef } from "@/lib/config";
import { loadSavedDbForEmbed } from "@/lib/savedDbsRepo";

export async function refreshDb(dbId: string): Promise<void> {
  const user = await requireUser();
  updateTag(`notion-db:${user.id}:${dbId}`);
}

export async function mintEmbedUrl(
  savedDbId: string,
): Promise<{ url: string; iframe: string }> {
  const user = await requireUser();

  const row = await loadSavedDbForEmbed(savedDbId);
  if (!row || row.userId !== user.id) {
    throw new Error("Saved database not found");
  }

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (!baseUrl) {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:3000";
    baseUrl = `${proto}://${host}`;
  }

  const token = encodeEmbedRef({ v: 2, userId: user.id, savedDbId });
  const url = `${baseUrl.replace(/\/$/, "")}/embed/${token}`;
  const iframe = `<iframe src="${url}" width="662" height="540" frameborder="0" style="max-width:100%;border:1px solid #EAEAEA;border-radius:8px"></iframe>`;
  return { url, iframe };
}
