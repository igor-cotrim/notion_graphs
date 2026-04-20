import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "__notion_oauth_state";

function getBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request): Promise<Response> {
  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) {
    return new NextResponse("NOTION_CLIENT_ID is not set", { status: 500 });
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${getBaseUrl(request)}/api/auth/notion/callback`;

  const authorizeUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("owner", "user");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const jar = await cookies();
  jar.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(authorizeUrl.toString());
}
