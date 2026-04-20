"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encodeConfig } from "@/lib/config";
import type { EmbedConfig } from "@/lib/types";

export async function refreshDb(dbId: string): Promise<void> {
  const user = await requireUser();
  updateTag(`notion-db:${user.id}:${dbId}`);
}

export async function mintEmbedUrl(
  config: EmbedConfig,
): Promise<{ url: string; iframe: string }> {
  const user = await requireUser();

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (!baseUrl) {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:3000";
    baseUrl = `${proto}://${host}`;
  }

  const signed: EmbedConfig = { ...config, userId: user.id };
  const token = encodeConfig(signed);
  const url = `${baseUrl.replace(/\/$/, "")}/embed/${token}`;
  const iframe = `<iframe src="${url}" width="662" height="540" frameborder="0" style="max-width:100%;border:1px solid #EAEAEA;border-radius:8px"></iframe>`;
  return { url, iframe };
}
