"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { CurrentUser } from "@/lib/auth";
import { Logo } from "./Logo";

export function HomePageClient({ user }: { user: CurrentUser | null }) {
  const { t, toggleLocale, localeLabel } = useLocale();

  const steps = [
    ["01", t("home.step01Title"), t("home.step01Desc")],
    ["02", t("home.step02Title"), t("home.step02Desc")],
    ["03", t("home.step03Title"), t("home.step03Desc")],
    ["04", t("home.step04Title"), t("home.step04Desc")],
  ] as const;

  return (
    <main className="min-h-dvh bg-[#0c0a09] font-sans">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col p-8 md:p-12">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-[#f97316]" />
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              notion-graphs
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="text-xs font-medium text-white/60 transition hover:text-white/85"
            >
              {localeLabel}
            </button>
            {user && (
              <>
                <span className="text-xs text-white/30">·</span>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="text-xs font-medium text-white/60 transition hover:text-white/85"
                  >
                    {t("home.signOut")}
                  </button>
                </form>
              </>
            )}
          </div>
        </header>

        {/* Hero */}
        <div className="flex flex-1 flex-col justify-center gap-8 py-16">
          <h1 className="font-display text-[clamp(3.5rem,10vw,8rem)] font-bold leading-[0.92] tracking-tight text-white">
            {t("home.heroTitle1")}
            <br />
            <span className="text-[#f97316]">{t("home.heroTitle2")}</span>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/70">
            {t("home.heroSubtitle")}
          </p>
          {user ? (
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/preview"
                className="font-display inline-flex items-center gap-2 bg-[#f97316] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ea6d0b]"
              >
                {t("home.openPreview")}
              </Link>
              <span className="text-sm text-white/60">
                {user.workspaceName
                  ? t("home.workspaceConnected").replace(
                      "{name}",
                      user.workspaceName,
                    )
                  : t("home.workspaceConnectedGeneric")}
              </span>
            </div>
          ) : (
            <a
              href="/api/auth/notion"
              className="font-display inline-flex w-fit items-center gap-2 bg-[#f97316] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ea6d0b]"
            >
              {t("home.connectNotion")}
            </a>
          )}
        </div>

        {/* Steps */}
        <div className="border-t border-white/10 pt-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {steps.map(([num, title, desc]) => (
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
