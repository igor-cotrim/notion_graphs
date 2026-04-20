import { Client } from "@notionhq/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { createSession } from "@/lib/session";

const OAUTH_STATE_COOKIE = "__notion_oauth_state";

function getBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request): Promise<Response> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse("Notion OAuth not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const baseUrl = getBaseUrl(request);

  if (errorParam) {
    return NextResponse.redirect(
      `${baseUrl}/?error=${encodeURIComponent(errorParam)}`,
    );
  }
  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) {
    return new NextResponse("Invalid OAuth state", { status: 400 });
  }

  const notion = new Client();
  let tokenRes;
  try {
    tokenRes = await notion.oauth.token({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${baseUrl}/api/auth/notion/callback`,
      client_id: clientId,
      client_secret: clientSecret,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    return new NextResponse(`OAuth exchange failed: ${msg}`, { status: 502 });
  }

  const now = new Date();
  await db
    .insert(users)
    .values({
      id: tokenRes.bot_id,
      notionWorkspaceId: tokenRes.workspace_id,
      notionWorkspaceName: tokenRes.workspace_name,
      notionWorkspaceIcon: tokenRes.workspace_icon,
      notionOwnerId:
        tokenRes.owner.type === "user" ? tokenRes.owner.user.id : null,
      notionAccessTokenEnc: encrypt(tokenRes.access_token),
      notionRefreshTokenEnc: tokenRes.refresh_token
        ? encrypt(tokenRes.refresh_token)
        : null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        notionWorkspaceId: tokenRes.workspace_id,
        notionWorkspaceName: tokenRes.workspace_name,
        notionWorkspaceIcon: tokenRes.workspace_icon,
        notionOwnerId:
          tokenRes.owner.type === "user" ? tokenRes.owner.user.id : null,
        notionAccessTokenEnc: encrypt(tokenRes.access_token),
        notionRefreshTokenEnc: tokenRes.refresh_token
          ? encrypt(tokenRes.refresh_token)
          : null,
        updatedAt: now,
      },
    });

  await createSession(tokenRes.bot_id);
  return NextResponse.redirect(`${baseUrl}/preview`);
}
