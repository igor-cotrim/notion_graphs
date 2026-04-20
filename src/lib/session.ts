import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "__session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const SIG_BYTES = 16;

type Payload = { uid: string; iat: number };

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
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

function sign(payload: string): string {
  const mac = createHmac("sha256", getSecret()).update(payload).digest();
  return b64urlEncode(mac.subarray(0, SIG_BYTES));
}

function encode(payload: Payload): string {
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${body}.${sign(body)}`;
}

function decode(token: string): Payload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(b64urlDecode(body).toString("utf8")) as Payload;
    if (!parsed || typeof parsed.uid !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = encode({ uid: userId, iat: Math.floor(Date.now() / 1000) });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<Payload | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  return raw ? decode(raw) : null;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
