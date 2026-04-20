import { NextResponse } from "next/server";
import { decodeConfig } from "@/lib/config";

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 500;

function getBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const base = getBaseUrl(request);
  if (parsed.origin !== new URL(base).origin) {
    return NextResponse.json({ error: "Foreign url" }, { status: 400 });
  }

  const match = parsed.pathname.match(/^\/embed\/([^/]+)$/);
  if (!match) {
    return NextResponse.json({ error: "Not an embed url" }, { status: 400 });
  }

  const token = match[1];
  let title: string | undefined;
  try {
    title = decodeConfig(token).title;
  } catch {
    // valid shape, invalid signature — still return a generic oEmbed response
  }

  const safeUrl = `${base}/embed/${encodeURIComponent(token)}`;
  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;

  return NextResponse.json(
    {
      type: "rich",
      version: "1.0",
      provider_name: "notion-graphs",
      provider_url: base,
      title: title ?? "notion-graphs chart",
      width,
      height,
      html: `<iframe src="${safeUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen style="border:0;"></iframe>`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
