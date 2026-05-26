"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { mintEmbedUrl, refreshDb } from "@/app/actions";
import {
  createFolder,
  createSavedDb,
  deleteFolder,
  deleteSavedDb,
  moveSavedDb,
  renameFolder,
  renameSavedDb,
  reorderSavedDbs,
  updateSavedDbState,
} from "@/app/actions/folders";
import type { FolderTree } from "@/lib/savedDbsRepo";
import type { Aggregation, ChartType, StoredDbState } from "@/lib/types";
import { FolderList } from "./folders/FolderList";
import { Logo } from "./Logo";
import { useLocale } from "@/hooks/useLocale";

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

const COLLAPSE_KEY = "notion-graphs:folder-ui";
const LEGACY_KEY = "notion-graphs:dbs";

function snapshotFromState(next: State): StoredDbState {
  return {
    chart: next.chart,
    group: next.group,
    value: next.value,
    agg: next.agg,
    title: next.title,
    filters: next.filters,
  };
}

export function PreviewForm({
  initial,
  folders: initialFolders,
  groupOptions,
  valueOptions,
  filterOptions,
  workspaceName,
}: {
  initial: State;
  folders: FolderTree;
  groupOptions: string[];
  valueOptions: string[];
  filterOptions: Record<string, string[]>;
  workspaceName: string | null;
}) {
  const { t, toggleLocale, localeLabel } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [state, setState] = useState<State>(initial);
  const [tree, setTree] = useState<FolderTree>(initialFolders);
  const [activeSavedDbId, setActiveSavedDbId] = useState<string | null>(() => {
    for (const f of initialFolders) {
      for (const d of f.dbs) {
        if (d.notionDbId === initial.db) return d.id;
      }
    }
    return null;
  });
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [minted, setMinted] = useState<{ url: string; iframe: string } | null>(
    null,
  );
  const [mintErr, setMintErr] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [treeError, setTreeError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSnapshotRef = useRef<{
    id: string;
    state: StoredDbState;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCollapsedIds(
            new Set(parsed.filter((x): x is string => typeof x === "string")),
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const flushPendingSnapshot = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSnapshotRef.current;
    if (!pending) return;
    pendingSnapshotRef.current = null;
    void updateSavedDbState(pending.id, pending.state).catch(() => {
      // fire-and-forget; stale state rewrites on next edit
    });
  }, []);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") flushPendingSnapshot();
    }
    function onBeforeUnload() {
      flushPendingSnapshot();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flushPendingSnapshot();
    };
  }, [flushPendingSnapshot]);

  function scheduleSnapshotSave(savedDbId: string, snapshot: StoredDbState) {
    pendingSnapshotRef.current = { id: savedDbId, state: snapshot };
    setTree((prev) =>
      prev.map((f) => ({
        ...f,
        dbs: f.dbs.map((d) =>
          d.id === savedDbId ? { ...d, state: snapshot } : d,
        ),
      })),
    );
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushPendingSnapshot();
    }, 600);
  }

  function pushState(next: State, opts?: { savedDbId?: string | null }) {
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
    const targetSavedId =
      opts && "savedDbId" in opts ? opts.savedDbId : activeSavedDbId;
    if (next.db && targetSavedId) {
      scheduleSnapshotSave(targetSavedId, snapshotFromState(next));
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
    if (!activeSavedDbId) return;
    flushPendingSnapshot();
    setMinting(true);
    try {
      const res = await mintEmbedUrl(activeSavedDbId);
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

  function onManualDbChange(rawDb: string) {
    setState({ ...state, db: rawDb });
    if (activeSavedDbId) {
      const current = findSavedDb(tree, activeSavedDbId);
      if (!current || current.notionDbId !== rawDb) {
        flushPendingSnapshot();
        setActiveSavedDbId(null);
      }
    }
  }

  function selectSavedDb(savedDbId: string) {
    const row = findSavedDb(tree, savedDbId);
    if (!row) return;
    flushPendingSnapshot();
    const base: StoredDbState = row.state ?? snapshotFromState(state);
    const next: State = {
      db: row.notionDbId,
      chart: base.chart,
      group: base.group,
      value: base.value,
      agg: base.agg,
      title: base.title,
      filters: base.filters,
    };
    setActiveSavedDbId(savedDbId);
    setState(next);
    pushState(next, { savedDbId });
  }

  function startNew() {
    flushPendingSnapshot();
    setActiveSavedDbId(null);
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

  function runMutation(fn: () => Promise<void>) {
    setTreeError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        console.error("[runMutation]", e);
        setTreeError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function toggleCollapsed(folderId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function onNewFolder(name: string) {
    runMutation(async () => {
      const { id } = await createFolder(name);
      setTree((prev) => [...prev, { id, name, dbs: [] }]);
    });
  }

  function onRenameFolderUi(id: string, name: string) {
    setTree((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    runMutation(() => renameFolder(id, name));
  }

  function onDeleteFolderUi(id: string) {
    const hadActive =
      activeSavedDbId !== null &&
      (tree
        .find((f) => f.id === id)
        ?.dbs.some((d) => d.id === activeSavedDbId) ??
        false);
    setTree((prev) => prev.filter((f) => f.id !== id));
    if (hadActive) setActiveSavedDbId(null);
    runMutation(() => deleteFolder(id));
  }

  function onSaveCurrent(folderId: string, label: string) {
    if (!state.db) return;
    const snapshot = snapshotFromState(state);
    runMutation(async () => {
      const { id } = await createSavedDb({
        folderId,
        notionDbId: state.db,
        label,
        state: snapshot,
      });
      setTree((prev) =>
        prev.map((f) =>
          f.id === folderId
            ? {
                ...f,
                dbs: [
                  ...f.dbs,
                  { id, label, notionDbId: state.db, state: snapshot },
                ],
              }
            : f,
        ),
      );
      setActiveSavedDbId(id);
    });
  }

  function onRenameDb(id: string, label: string) {
    setTree((prev) =>
      prev.map((f) => ({
        ...f,
        dbs: f.dbs.map((d) => (d.id === id ? { ...d, label } : d)),
      })),
    );
    runMutation(() => renameSavedDb(id, label));
  }

  function onMoveDbUi(id: string, toFolderId: string) {
    let moved: FolderTree[number]["dbs"][number] | null = null;
    setTree((prev) => {
      const stripped = prev.map((f) => {
        const found = f.dbs.find((d) => d.id === id);
        if (found) moved = found;
        return { ...f, dbs: f.dbs.filter((d) => d.id !== id) };
      });
      if (!moved) return prev;
      return stripped.map((f) =>
        f.id === toFolderId ? { ...f, dbs: [...f.dbs, moved!] } : f,
      );
    });
    runMutation(() => moveSavedDb(id, toFolderId));
  }

  function onReorderDbsUi(folderId: string, orderedIds: string[]) {
    setTree((prev) =>
      prev.map((f) =>
        f.id !== folderId
          ? f
          : {
              ...f,
              dbs: orderedIds
                .map((id) => f.dbs.find((d) => d.id === id))
                .filter((d): d is NonNullable<typeof d> => d !== undefined),
            },
      ),
    );
    runMutation(() => reorderSavedDbs(folderId, orderedIds));
  }

  function onDeleteDbUi(id: string) {
    if (activeSavedDbId === id) {
      flushPendingSnapshot();
      setActiveSavedDbId(null);
    }
    setTree((prev) =>
      prev.map((f) => ({ ...f, dbs: f.dbs.filter((d) => d.id !== id) })),
    );
    runMutation(() => deleteSavedDb(id));
  }

  return (
    <aside className="scrollbar-orange flex h-full flex-col gap-5 overflow-y-auto border-r border-[#1e1e1c] bg-[#0c0a09] p-5 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            href="/"
            className="flex items-center gap-1.5 font-display text-sm font-semibold text-white transition hover:text-white/70"
          >
            <Logo className="h-4 w-4 text-[#f97316]" />
            {t("preview.heading")}
          </Link>
          {workspaceName ? (
            <p className="mt-0.5 text-xs text-white/70">{workspaceName}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded border border-[#2a2a28] px-2 py-1 text-xs font-medium text-white/70 transition hover:border-[#3a3a38] hover:text-white/85"
          >
            {localeLabel}
          </button>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded border border-[#2a2a28] px-2 py-1 text-xs font-medium text-white/70 transition hover:border-[#3a3a38] hover:text-white/85"
            >
              {t("preview.signOut")}
            </button>
          </form>
        </div>
      </div>

      <FolderList
        folders={tree}
        activeSavedDbId={activeSavedDbId}
        activeDbId={state.db}
        collapsedIds={collapsedIds}
        onToggleCollapsed={toggleCollapsed}
        onNewFolder={onNewFolder}
        onRenameFolder={onRenameFolderUi}
        onDeleteFolder={onDeleteFolderUi}
        onSaveCurrent={onSaveCurrent}
        onSelectDb={selectSavedDb}
        onRenameDb={onRenameDb}
        onMoveDb={onMoveDbUi}
        onDeleteDb={onDeleteDbUi}
        onReorderDbs={onReorderDbsUi}
        onNewBlank={startNew}
      />

      {treeError ? <p className="text-xs text-red-400">{treeError}</p> : null}

      <Field label={t("preview.databaseId")}>
        <input
          className={inputClass}
          value={state.db}
          onChange={(e) => onManualDbChange(e.target.value)}
          onBlur={() => pushState(state)}
          placeholder="2a046fb23fb5720b0905d3939b79f108"
        />
        <p className="text-xs leading-relaxed text-white/55">
          {t("preview.databaseIdHint")}{" "}
          <code className="font-mono text-white/70">
            notion.so/<strong>2a046fb…</strong>
          </code>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!state.db || refreshing}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded border border-[#2a2a28] px-2.5 py-1 text-xs font-medium text-white/70 transition hover:border-[#3a3a38] hover:text-white/85 disabled:opacity-40"
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
            ? t("preview.refreshing")
            : refreshedAt
              ? t("preview.refreshed")
              : t("preview.refreshData")}
        </button>
      </Field>

      <Field label={t("preview.chartType")}>
        <div className="flex gap-1">
          {(["pie", "bar", "line"] as ChartType[]).map((ct) => (
            <button
              key={ct}
              type="button"
              onClick={() => patch({ chart: ct })}
              className={pillClass(state.chart === ct)}
            >
              {ct}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("preview.groupBy")}>
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

      <Field label={t("preview.valueField")}>
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

      <Field label={t("preview.aggregation")}>
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

      <Field label={t("preview.titleField")}>
        <input
          className={inputClass}
          value={state.title}
          onChange={(e) => setState({ ...state, title: e.target.value })}
          onBlur={() => pushState(state)}
          placeholder={t("preview.titlePlaceholder")}
        />
      </Field>

      {Object.entries(filterOptions).map(([prop, options]) => (
        <Field
          key={prop}
          label={t("preview.filterLabel").replace("{prop}", prop)}
        >
          <div className="flex flex-wrap gap-1">
            {options.length === 0 ? (
              <span className="text-xs text-white/55">
                {t("preview.noFilterValues")}
              </span>
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
          disabled={!activeSavedDbId || pending || minting}
          className="font-display inline-flex w-full items-center justify-center gap-2 bg-[#f97316] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea6d0b] disabled:opacity-40"
        >
          {minting ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t("preview.generating")}
            </>
          ) : (
            t("preview.generateEmbed")
          )}
        </button>
        {!activeSavedDbId && state.db ? (
          <p className="text-xs text-white/55">{t("preview.saveTip")}</p>
        ) : null}
        {mintErr ? <p className="text-xs text-red-400">{mintErr}</p> : null}
        {minted ? (
          <div className="space-y-2 text-xs">
            <CopyBlock
              label="URL"
              value={minted.url}
              copyLabel={t("preview.copy")}
              copiedLabel={t("preview.copied")}
            />
            <CopyBlock
              label="Iframe"
              value={minted.iframe}
              copyLabel={t("preview.copy")}
              copiedLabel={t("preview.copied")}
            />
            <p className="text-white/55">{t("preview.embedTip")}</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function findSavedDb(
  tree: FolderTree,
  id: string,
): FolderTree[number]["dbs"][number] | null {
  for (const f of tree) {
    for (const d of f.dbs) {
      if (d.id === id) return d;
    }
  }
  return null;
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
      <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/65">
        {label}
      </span>
      {children}
    </label>
  );
}

function CopyBlock({
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded border border-[#2a2a28] bg-[#161614] p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/65">
          {label}
        </span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded bg-[#2a2a28] px-2 py-0.5 text-[10px] font-semibold text-white/75 transition hover:bg-[#3a3a38] hover:text-white/90"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <code className="font-mono block break-all text-[11px] leading-relaxed text-white/80">
        {value}
      </code>
    </div>
  );
}

const inputClass =
  "w-full rounded border border-[#2a2a28] bg-[#161614] px-2.5 py-1.5 text-sm text-white placeholder:text-white/55 focus:border-[#f97316] focus:outline-none transition";

function pillClass(active: boolean): string {
  return [
    "rounded border px-2.5 py-1 text-xs font-medium transition",
    active
      ? "border-[#f97316] bg-[#f97316] text-white"
      : "border-[#2a2a28] bg-transparent text-white/70 hover:border-[#3a3a38] hover:text-white/90",
  ].join(" ");
}
