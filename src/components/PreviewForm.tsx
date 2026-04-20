"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mintEmbedUrl, refreshDb } from "@/app/actions";
import { type StoredDbState, updateDbState } from "@/lib/savedDbs";
import type { Aggregation, ChartType, EmbedConfig } from "@/lib/types";
import { DatabaseTabs } from "./DatabaseTabs";

type Filters = Record<string, string[]>;

type State = {
  db: string;
  chart: ChartType;
  group: string;
  value: string;
  agg: Aggregation;
  title: string;
  filters: Filters;
};

export function PreviewForm({
  initial,
  groupOptions,
  valueOptions,
  filterOptions,
  config,
  workspaceName,
}: {
  initial: State;
  groupOptions: string[];
  valueOptions: string[];
  filterOptions: Record<string, string[]>;
  config: EmbedConfig | null;
  workspaceName: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [state, setState] = useState<State>(initial);
  const [minted, setMinted] = useState<{ url: string; iframe: string } | null>(
    null,
  );
  const [mintErr, setMintErr] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);

  function pushState(next: State) {
    const params = new URLSearchParams();
    if (next.db) params.set("db", next.db);
    params.set("chart", next.chart);
    if (next.group) params.set("group", next.group);
    if (next.value) params.set("value", next.value);
    params.set("agg", next.agg);
    if (next.title) params.set("title", next.title);
    for (const [k, vs] of Object.entries(next.filters)) {
      if (vs.length) params.append("filter", `${k}:${vs.join(",")}`);
    }
    if (next.db) {
      updateDbState(next.db, {
        chart: next.chart,
        group: next.group,
        value: next.value,
        agg: next.agg,
        title: next.title,
        filters: next.filters,
      });
    }
    startTransition(() => router.push(`/preview?${params.toString()}`));
  }

  function patch(p: Partial<State>) {
    const next = { ...state, ...p };
    setState(next);
    pushState(next);
  }

  function toggleFilter(prop: string, value: string) {
    const current = state.filters[prop] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const filters = { ...state.filters, [prop]: next };
    if (!next.length) delete filters[prop];
    patch({ filters });
  }

  async function onMint() {
    setMintErr(null);
    setMinted(null);
    if (!config) return;
    setMinting(true);
    try {
      const res = await mintEmbedUrl(config);
      setMinted(res);
    } catch (e) {
      setMintErr(e instanceof Error ? e.message : "Failed to mint URL");
    } finally {
      setMinting(false);
    }
  }

  function onRefresh() {
    if (!state.db) return;
    startRefresh(async () => {
      await refreshDb(state.db);
      router.refresh();
      setRefreshedAt(Date.now());
    });
  }

  function selectDb(id: string, savedState?: StoredDbState) {
    if (savedState) {
      const next: State = { db: id, ...savedState };
      setState(next);
      pushState(next);
    } else {
      patch({ db: id });
    }
  }

  function startNew() {
    const blank: State = {
      db: "",
      chart: "pie",
      group: "Category",
      value: "Value",
      agg: "sum",
      title: "",
      filters: {},
    };
    setState(blank);
    setMinted(null);
    setMintErr(null);
    startTransition(() => router.push("/preview"));
  }

  return (
    <aside className="flex h-dvh flex-col gap-5 overflow-y-auto border-r border-[#1e1e1c] bg-[#0c0a09] p-5 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-white">
            Preview
          </h2>
          {workspaceName ? (
            <p className="mt-0.5 text-xs text-white/40">{workspaceName}</p>
          ) : null}
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded border border-[#2a2a28] px-2 py-1 text-xs font-medium text-white/40 transition hover:border-[#3a3a38] hover:text-white/70"
          >
            Sign out
          </button>
        </form>
      </div>

      <DatabaseTabs
        activeDb={state.db}
        currentState={{
          chart: state.chart,
          group: state.group,
          value: state.value,
          agg: state.agg,
          title: state.title,
          filters: state.filters,
        }}
        onSelect={selectDb}
        onNew={startNew}
      />

      <Field label="Database ID">
        <input
          className={inputClass}
          value={state.db}
          onChange={(e) => setState({ ...state, db: e.target.value })}
          onBlur={() => pushState(state)}
          placeholder="2a046fb23fb5720b0905d3939b79f108"
        />
        <p className="text-xs leading-relaxed text-white/25">
          Open the database as a full page in Notion, copy the URL. The ID is
          the 32-character code at the end:{" "}
          <code className="font-mono text-white/40">
            notion.so/<strong>2a046fb…</strong>
          </code>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!state.db || refreshing}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded border border-[#2a2a28] px-2.5 py-1 text-xs font-medium text-white/40 transition hover:border-[#3a3a38] hover:text-white/70 disabled:opacity-40"
        >
          <span
            aria-hidden
            className={
              refreshing ? "inline-block animate-spin" : "inline-block"
            }
          >
            ↻
          </span>
          {refreshing
            ? "Refreshing…"
            : refreshedAt
              ? "Refreshed"
              : "Refresh data"}
        </button>
      </Field>

      <Field label="Chart type">
        <div className="flex gap-1">
          {(["pie", "bar", "line"] as ChartType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => patch({ chart: t })}
              className={pillClass(state.chart === t)}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Group by">
        {groupOptions.length ? (
          <select
            className={inputClass}
            value={state.group}
            onChange={(e) => patch({ group: e.target.value })}
          >
            {groupOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={inputClass}
            value={state.group}
            onChange={(e) => setState({ ...state, group: e.target.value })}
            onBlur={() => pushState(state)}
            placeholder="Category"
          />
        )}
      </Field>

      <Field label="Value">
        {valueOptions.length ? (
          <select
            className={inputClass}
            value={state.value}
            onChange={(e) => patch({ value: e.target.value })}
          >
            {valueOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={inputClass}
            value={state.value}
            onChange={(e) => setState({ ...state, value: e.target.value })}
            onBlur={() => pushState(state)}
            placeholder="Value"
          />
        )}
      </Field>

      <Field label="Aggregation">
        <div className="flex gap-1">
          {(["sum", "count", "avg"] as Aggregation[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => patch({ agg: a })}
              className={pillClass(state.agg === a)}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Title">
        <input
          className={inputClass}
          value={state.title}
          onChange={(e) => setState({ ...state, title: e.target.value })}
          onBlur={() => pushState(state)}
          placeholder="(optional)"
        />
      </Field>

      {Object.entries(filterOptions).map(([prop, options]) => (
        <Field key={prop} label={`Filter — ${prop}`}>
          <div className="flex flex-wrap gap-1">
            {options.length === 0 ? (
              <span className="text-xs text-white/25">no values</span>
            ) : (
              options.map((opt) => {
                const active = state.filters[prop]?.includes(opt) ?? false;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleFilter(prop, opt)}
                    className={pillClass(active)}
                  >
                    {opt}
                  </button>
                );
              })
            )}
          </div>
        </Field>
      ))}

      {/* Footer: generate embed */}
      <div className="mt-auto space-y-3 border-t border-[#1e1e1c] pt-4">
        <button
          type="button"
          onClick={onMint}
          disabled={!config || pending || minting}
          className="font-display inline-flex w-full items-center justify-center gap-2 bg-[#f97316] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea6d0b] disabled:opacity-40"
        >
          {minting ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating…
            </>
          ) : (
            "Generate embed URL"
          )}
        </button>
        {mintErr ? <p className="text-xs text-red-400">{mintErr}</p> : null}
        {minted ? (
          <div className="space-y-2 text-xs">
            <CopyBlock label="URL" value={minted.url} />
            <CopyBlock label="Iframe" value={minted.iframe} />
            <p className="text-white/25">
              Tip: paste the URL (not the iframe) into Notion → Create embed.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded border border-[#2a2a28] bg-[#161614] p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/35">
          {label}
        </span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded bg-[#2a2a28] px-2 py-0.5 text-[10px] font-semibold text-white/50 transition hover:bg-[#3a3a38] hover:text-white/80"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <code className="font-mono block break-all text-[11px] leading-relaxed text-white/60">
        {value}
      </code>
    </div>
  );
}

const inputClass =
  "w-full rounded border border-[#2a2a28] bg-[#161614] px-2.5 py-1.5 text-sm text-white placeholder:text-white/25 focus:border-[#f97316] focus:outline-none transition";

function pillClass(active: boolean): string {
  return [
    "rounded border px-2.5 py-1 text-xs font-medium transition",
    active
      ? "border-[#f97316] bg-[#f97316] text-white"
      : "border-[#2a2a28] bg-transparent text-white/45 hover:border-[#3a3a38] hover:text-white/75",
  ].join(" ");
}
