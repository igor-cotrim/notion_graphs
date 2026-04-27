import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-dvh bg-[#0c0a09] font-sans">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col p-8 md:p-12">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            notion-graphs
          </span>
          {user && (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-xs font-medium text-white/60 transition hover:text-white/85"
              >
                Sign out
              </button>
            </form>
          )}
        </header>

        {/* Hero */}
        <div className="flex flex-1 flex-col justify-center gap-8 py-16">
          <h1 className="font-display text-[clamp(3.5rem,10vw,8rem)] font-bold leading-[0.92] tracking-tight text-white">
            Notion,
            <br />
            <span className="text-[#f97316]">charted.</span>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/70">
            Turn any Notion database into an embeddable chart. Connect your
            workspace, shape the data, and paste a signed embed URL back into
            Notion.
          </p>
          {user ? (
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/preview"
                className="font-display inline-flex items-center gap-2 bg-[#f97316] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ea6d0b]"
              >
                Open preview →
              </Link>
              <span className="text-sm text-white/60">
                {user.workspaceName
                  ? `${user.workspaceName} connected`
                  : "Workspace connected"}
              </span>
            </div>
          ) : (
            <a
              href="/api/auth/notion"
              className="font-display inline-flex w-fit items-center gap-2 bg-[#f97316] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ea6d0b]"
            >
              Connect Notion →
            </a>
          )}
        </div>

        {/* Steps */}
        <div className="border-t border-white/10 pt-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {(
              [
                [
                  "01",
                  "Connect",
                  "Authorize this app to read selected databases in your workspace.",
                ],
                [
                  "02",
                  "Configure",
                  "Paste a database ID, choose how to group, aggregate, and chart it.",
                ],
                [
                  "03",
                  "Generate",
                  "Click Generate embed URL for a signed, public-access link.",
                ],
                [
                  "04",
                  "Embed",
                  "Paste the URL (not the iframe) into Notion → Create embed.",
                ],
              ] as const
            ).map(([num, title, desc]) => (
              <div key={num} className="flex flex-col gap-2">
                <span className="font-mono text-xs font-medium text-[#f97316]">
                  {num}
                </span>
                <span className="font-display text-sm font-semibold text-white/80">
                  {title}
                </span>
                <span className="text-xs leading-relaxed text-white/60">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
