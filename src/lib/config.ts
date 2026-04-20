import { createHmac, timingSafeEqual } from "node:crypto";
import type { EmbedConfig } from "./types";

const SIG_BYTES = 16;

function getSecret(): string {
  const s = process.env.EMBED_SECRET;
  if (!s) throw new Error("EMBED_SECRET is not set");
  return s;
}

function b64urlEncode(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(payload).digest();
  return b64urlEncode(mac.subarray(0, SIG_BYTES));
}

export function encodeConfig(config: EmbedConfig, secret = getSecret()): string {
  const payload = b64urlEncode(Buffer.from(JSON.stringify(config), "utf8"));
  return `${payload}.${sign(payload, secret)}`;
}

export function decodeConfig(token: string, secret = getSecret()): EmbedConfig {
  const dot = token.lastIndexOf(".");
  if (dot < 0) throw new Error("Malformed token");
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid signature");
  }

  const json = b64urlDecode(payload).toString("utf8");
  const parsed = JSON.parse(json) as EmbedConfig;
  if (!parsed.db || !parsed.chart || !parsed.groupBy) {
    throw new Error("Invalid config");
  }
  return parsed;
}
