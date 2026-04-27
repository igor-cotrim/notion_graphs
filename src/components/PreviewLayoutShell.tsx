"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(callback: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getDesktopServerSnapshot() {
  return true;
}

export function PreviewLayoutShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const sidebarInert = !isDesktop && !open;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden lg:grid lg:grid-cols-[320px_1fr] lg:grid-rows-1">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1e1e1c] bg-[#0c0a09] px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          aria-controls="preview-sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded text-white/85 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#f97316] focus-visible:outline-offset-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
          notion-graphs
        </span>
        <span aria-hidden className="w-9" />
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      <div
        id="preview-sidebar"
        inert={sidebarInert ? true : undefined}
        className={[
          "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm transform transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:transform-none lg:transition-none",
        ].join(" ")}
      >
        {sidebar}
      </div>

      <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white lg:h-full">
        {children}
      </main>
    </div>
  );
}
