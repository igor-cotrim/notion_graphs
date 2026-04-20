"use server";

import { headers } from "next/headers";
import { encodeConfig } from "@/lib/config";
import type { EmbedConfig } from "@/lib/types";

export async function mintEmbedUrl(
  config: EmbedConfig,
): Promise<{ url: string; iframe: string }> {
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (!baseUrl) {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:3000";
    baseUrl = `${proto}://${host}`;
  }
  const token = encodeConfig(config);
  const url = `${baseUrl.replace(/\/$/, "")}/embed/${token}`;
  const iframe = `<iframe src="${url}" width="662" height="540" frameborder="0" style="max-width:100%;border:1px solid #EAEAEA;border-radius:8px"></iframe>`;
  return { url, iframe };
}
