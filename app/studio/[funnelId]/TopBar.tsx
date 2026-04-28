"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Pencil, Plus } from "lucide-react";
import type { SaveStatus } from "@/lib/studio/saver";

type LocalVariant = {
  id: string;
  name: string;
};

type Props = {
  funnelId: string;
  funnelTitle: string;
  funnelStatus: "draft" | "published";
  hasUnpublishedEdits: boolean;
  onTitleChange: (next: string) => Promise<void> | void;
  variants: LocalVariant[];
  activeVariantId: string;
  onSwitchVariant: (id: string) => void;
  onRenameVariant: (id: string, next: string) => Promise<void> | void;
  onAddVariant: () => Promise<void> | void;
  saveStatus: SaveStatus;
  savedAt: number | null;
  saveError: string | null;
  onPublish: () => Promise<void> | void;
  publishing: boolean;
  publishError: string | null;
};

/**
 * State-3 top bar. Owns inline title editing, variant tab switching +
 * rename + duplicate, save badge, and the Publish/Republish button. Per
 * design/STUDIO.md §1.6 + §1.7. The published modal (state 4) is mounted
 * by the parent — this component only fires `onPublish` and renders the
 * status pill.
 */
export function TopBar({
  funnelId,
  funnelTitle,
  funnelStatus,
  hasUnpublishedEdits,
  onTitleChange,
  variants,
  activeVariantId,
  onSwitchVariant,
  onRenameVariant,
  onAddVariant,
  saveStatus,
  savedAt,
  saveError,
  onPublish,
  publishing,
  publishError,
}: Props) {
  const isPublished = funnelStatus === "published";
  const showDraftFlag = !isPublished || hasUnpublishedEdits;

  return (
    <header className="grid h-[52px] grid-cols-[minmax(0,auto)_1fr_auto] items-center gap-6 border-b border-[var(--border-c)] bg-[var(--surface)] px-4">
      <div className="flex min-w-0 items-center gap-2.5 font-sans text-[13px] font-medium text-[var(--text)]">
        <span
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[6px] text-[var(--cream-50)]"
          style={{
            background:
              "linear-gradient(135deg, var(--olive-700), var(--olive-500))",
            fontFamily: "var(--font-d)",
            fontStyle: "italic",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          O
        </span>
        <em className="shrink-0 font-serif italic text-[15px] tracking-[-0.005em] text-[var(--olive-700)]">
          Olive
        </em>
        <span className="shrink-0 text-[var(--text-faint)]">·</span>
        <EditableTitle value={funnelTitle} onCommit={onTitleChange} />
        <StatusPill
          isPublished={isPublished}
          isDraft={showDraftFlag}
          publishedAndClean={isPublished && !hasUnpublishedEdits}
        />
      </div>

      <div className="flex items-center justify-center">
        <VariantTabs
          variants={variants}
          activeId={activeVariantId}
          onSwitch={onSwitchVariant}
          onRename={onRenameVariant}
          onAdd={onAddVariant}
        />
      </div>

      <div className="flex items-center gap-3">
        <SaveBadge status={saveStatus} savedAt={savedAt} error={saveError} />
        <Link
          href={`/dashboard/${funnelId}`}
          className="inline-flex items-center gap-1.5 font-sans text-[12px] font-medium text-[var(--text-mute)] hover:text-[var(--text)]"
          title="View dashboard"
        >
          <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
          View dashboard
        </Link>
        <button
          type="button"
          onClick={() => void onPublish()}
          disabled={publishing}
          title={publishError ?? undefined}
          className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 font-sans text-[12.5px] font-medium ${
            publishError
              ? "border border-[var(--error)] bg-[var(--surface)] text-[var(--error)]"
              : "bg-[var(--olive-700)] text-[var(--cream-50)] hover:bg-[var(--olive-900)]"
          } disabled:opacity-60`}
        >
          {publishing ? (
            <>
              <Spinner /> Publishing…
            </>
          ) : (
            <>
              {isPublished && !hasUnpublishedEdits
                ? "Republish"
                : isPublished
                  ? "Republish →"
                  : "Publish →"}
            </>
          )}
        </button>
      </div>
    </header>
  );
}

/* ============================ Title ============================ */

function EditableTitle({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (next: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next.length === 0 || next === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    void onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        className="min-w-0 flex-1 border-b border-[var(--olive-700)] bg-transparent px-0.5 py-0 font-serif text-[15px] italic tracking-[-0.005em] text-[var(--text)] outline-none"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex min-w-0 items-center gap-1.5 text-left"
      title="Click to rename"
    >
      <span className="min-w-0 truncate font-serif italic text-[15px] tracking-[-0.005em] text-[var(--text)] group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-2">
        {value}
      </span>
      <Pencil
        className="h-3 w-3 shrink-0 text-[var(--text-faint)] opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={2}
      />
    </button>
  );
}

/* ============================ Status pill ============================ */

function StatusPill({
  isPublished,
  isDraft,
  publishedAndClean,
}: {
  isPublished: boolean;
  isDraft: boolean;
  publishedAndClean: boolean;
}) {
  if (publishedAndClean) {
    return (
      <span
        className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--success)]"
        style={{
          background: "color-mix(in oklch, var(--success) 10%, transparent)",
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
        live
      </span>
    );
  }
  if (isPublished && isDraft) {
    return (
      <span
        className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--warning)]"
        style={{
          background: "color-mix(in oklch, var(--warning) 12%, transparent)",
        }}
        title="Edits since last publish"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
        draft
      </span>
    );
  }
  return (
    <span
      className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]"
      style={{ background: "var(--surface-2)" }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--border-strong)]" />
      draft
    </span>
  );
}

/* ============================ Variant tabs ============================ */

function VariantTabs({
  variants,
  activeId,
  onSwitch,
  onRename,
  onAdd,
}: {
  variants: LocalVariant[];
  activeId: string;
  onSwitch: (id: string) => void;
  onRename: (id: string, next: string) => Promise<void> | void;
  onAdd: () => Promise<void> | void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const startRename = (v: LocalVariant) => {
    setRenamingId(v.id);
    setDraft(v.name);
  };
  const commitRename = (id: string) => {
    const next = draft.trim();
    if (next.length === 0) {
      setRenamingId(null);
      return;
    }
    void onRename(id, next);
    setRenamingId(null);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface-2)] p-[3px]">
      {variants.map((v) => {
        const active = v.id === activeId;
        const isRenaming = renamingId === v.id;
        return (
          <div key={v.id} className="flex items-center">
            {isRenaming ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commitRename(v.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename(v.id);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setRenamingId(null);
                  }
                }}
                className="w-[80px] rounded-[6px] border border-[var(--olive-700)] bg-[var(--surface)] px-2 py-[3px] font-mono text-[11.5px] font-medium text-[var(--text)] outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSwitch(v.id)}
                onDoubleClick={() => startRename(v)}
                className={`group inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-[5px] font-mono text-[11.5px] font-medium ${
                  active
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-1"
                    : "text-[var(--text-mute)] hover:text-[var(--text)]"
                }`}
                title={active ? "Double-click to rename" : "Switch variant"}
              >
                Variant {v.name}
                {active && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(v);
                    }}
                    className="grid h-3.5 w-3.5 cursor-pointer place-items-center rounded text-[var(--text-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-2)]"
                    title="Rename variant"
                    aria-label="Rename variant"
                  >
                    <Pencil className="h-2.5 w-2.5" strokeWidth={2} />
                  </span>
                )}
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        disabled={adding || variants.length >= 4}
        onClick={async () => {
          setAdding(true);
          try {
            await onAdd();
          } finally {
            setAdding(false);
          }
        }}
        title={
          variants.length >= 4
            ? "Up to 4 variants"
            : "Duplicate active variant"
        }
        className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-[5px] font-mono text-[11.5px] text-[var(--text-faint)] hover:text-[var(--olive-700)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {adding ? <Spinner /> : <Plus className="h-3 w-3" strokeWidth={2} />}
        Add variant
      </button>
    </div>
  );
}

/* ============================ Save badge ============================ */

function SaveBadge({
  status,
  savedAt,
  error,
}: {
  status: SaveStatus;
  savedAt: number | null;
  error: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-mute)]">
        <Spinner /> Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--error)]"
        title={error ?? undefined}
      >
        Couldn&apos;t save
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    const sec = Math.max(1, Math.floor((now - savedAt) / 1000));
    return (
      <span className="font-mono text-[11px] text-[var(--text-faint)]">
        Saved {sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m`} ago
      </span>
    );
  }
  return (
    <span className="font-mono text-[11px] text-[var(--text-faint)]">Idle</span>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-3 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--olive-700)]"
      style={{ animation: "studio-spin 800ms linear infinite" }}
    >
      <style>{`@keyframes studio-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

