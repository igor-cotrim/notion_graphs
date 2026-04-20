import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

function getBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request): Promise<Response> {
  await clearSession();
  return NextResponse.redirect(`${getBaseUrl(request)}/`, { status: 303 });
}
