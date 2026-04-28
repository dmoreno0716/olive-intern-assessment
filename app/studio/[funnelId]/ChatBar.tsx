"use client";

import { useCallback, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { CatalogNode } from "@/lib/catalog/types";
import { summarizeDiff, type DiffEntry } from "@/lib/studio/diff";

type Props = {
  variantId: string;
  spec: CatalogNode[];
  /** When set, refinements are scoped to this screen id. */
  scopeScreenId: string | null;
  /** Called with the new spec when the creator clicks Accept. */
  onApply: (next: CatalogNode[]) => void;
};

type Phase =
  | { kind: "idle" }
  | { kind: "thinking"; instruction: string }
  | {
      kind: "diff";
      instruction: string;
      next: CatalogNode[];
      summary: DiffEntry[];
    }
  | { kind: "error"; instruction: string; message: string };

const PLACEHOLDER =
  "Refine your funnel… (e.g. \"add a question about snacking\", \"make the result tone funnier\", \"strengthen the final CTA\")";

/**
 * Sticky bottom chat bar — the natural-language refinement channel.
 * Inline editing in the left panel is silent; this one goes through
 * a deliberate diff/Accept/Reject ceremony so a single off-prompt LLM
 * call can't quietly stomp the creator's previous edits.
 */
export function ChatBar({ variantId, spec, scopeScreenId, onApply }: Props) {
  const [instruction, setInstruction] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const submit = useCallback(async () => {
    const trimmed = instruction.trim();
    if (!trimmed) return;
    const scopedInstruction = scopeScreenId
      ? `Only modify the screen with id "${scopeScreenId}". Leave every other screen exactly as-is. ${trimmed}`
      : trimmed;
    setPhase({ kind: "thinking", instruction: trimmed });
    try {
      const res = await fetch(`/api/variants/${variantId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: scopedInstruction }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok: boolean;
            spec?: CatalogNode[];
            error?: string;
            issues?: { path: string; message: string }[];
          }
        | null;
      if (!res.ok || !data?.ok || !data.spec) {
        const message =
          data?.error ??
          (data?.issues?.length
            ? `Validation failed: ${data.issues[0]!.message}`
            : `Refine failed (${res.status})`);
        setPhase({ kind: "error", instruction: trimmed, message });
        return;
      }
      const summary = summarizeDiff(spec, data.spec);
      setPhase({
        kind: "diff",
        instruction: trimmed,
        next: data.spec,
        summary,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setPhase({ kind: "error", instruction: trimmed, message });
    }
  }, [instruction, scopeScreenId, spec, variantId]);

  const accept = () => {
    if (phase.kind !== "diff") return;
    onApply(phase.next);
    setPhase({ kind: "idle" });
    setInstruction("");
  };

  const reject = () => {
    setPhase({ kind: "idle" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const thinking = phase.kind === "thinking";

  return (
    <footer className="flex flex-col border-t border-[var(--border-c)] bg-[var(--surface)]">
      {phase.kind === "diff" && (
        <DiffPreview
          instruction={phase.instruction}
          summary={phase.summary}
          onAccept={accept}
          onReject={reject}
        />
      )}
      {phase.kind === "error" && (
        <ErrorRow
          message={phase.message}
          onRetry={() => void submit()}
          onDismiss={() => setPhase({ kind: "idle" })}
        />
      )}
      <div className="flex items-end gap-2.5 px-4 py-2.5">
        <ScopeChip scopeScreenId={scopeScreenId} />
        <div className="relative flex flex-1 items-center">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={thinking || phase.kind === "diff"}
            placeholder={PLACEHOLDER}
            rows={1}
            className="w-full resize-none rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface-2)] px-3 py-2 font-sans text-[13px] leading-snug text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--olive-700)] focus:bg-[var(--surface)] disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={thinking || phase.kind === "diff" || !instruction.trim()}
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--olive-700)] px-3 py-2 font-sans text-[12.5px] font-medium text-[var(--cream-50)] disabled:cursor-not-allowed disabled:opacity-50"
          title="Refine (⌘↵)"
        >
          {thinking ? (
            <>
              <Spinner /> Thinking…
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" strokeWidth={2} />
              Refine
            </>
          )}
        </button>
      </div>
    </footer>
  );
}

function ScopeChip({ scopeScreenId }: { scopeScreenId: string | null }) {
  const label = scopeScreenId ? `screen "${scopeScreenId}"` : "whole funnel";
  const accent = Boolean(scopeScreenId);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.04em] ${
        accent
          ? "border-[var(--olive-700)] bg-[color-mix(in_oklch,var(--olive-500)_8%,var(--surface))] text-[var(--olive-700)]"
          : "border-[var(--border-c)] bg-[var(--surface)] text-[var(--text-mute)]"
      }`}
      title="Refinements apply to this scope"
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: accent ? "var(--olive-500)" : "var(--border-strong)",
        }}
      />
      Refining: {label}
    </span>
  );
}

function DiffPreview({
  instruction,
  summary,
  onAccept,
  onReject,
}: {
  instruction: string;
  summary: DiffEntry[];
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="border-b border-[var(--border-c)] bg-[var(--surface-2)] px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Claude proposes
        </span>
        <span className="truncate text-[12px] text-[var(--text-mute)]">
          “{instruction}”
        </span>
      </div>
      <ul className="m-0 mb-3 flex flex-col gap-1.5">
        {summary.map((entry, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-2.5 py-1.5"
          >
            <span
              aria-hidden
              className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--olive-500)]"
            />
            <span className="flex-1 text-[12.5px] leading-snug text-[var(--text)]">
              {entry.summary}
            </span>
            {entry.screenIds.length > 0 && (
              <span className="flex shrink-0 flex-wrap items-center gap-1">
                {entry.screenIds.slice(0, 3).map((id) => (
                  <span
                    key={id}
                    className="rounded px-1.5 py-px font-mono text-[10px] text-[var(--olive-700)]"
                    style={{
                      background:
                        "color-mix(in oklch, var(--olive-500) 10%, var(--surface))",
                    }}
                  >
                    {id}
                  </span>
                ))}
                {entry.screenIds.length > 3 && (
                  <span className="font-mono text-[10px] text-[var(--text-faint)]">
                    +{entry.screenIds.length - 3}
                  </span>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
        >
          <X className="h-3 w-3" strokeWidth={2} />
          Reject
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--olive-700)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--cream-50)] hover:bg-[var(--olive-900)]"
        >
          <Check className="h-3 w-3" strokeWidth={2.4} />
          Accept
        </button>
      </div>
    </div>
  );
}

function ErrorRow({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 border-b border-[var(--border-c)] bg-[color-mix(in_oklch,var(--error)_8%,var(--surface))] px-4 py-2.5 text-[12.5px] text-[var(--text)]"
    >
      <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--error)]">
        Refine failed
      </span>
      <span className="flex-1 truncate text-[var(--text-mute)]">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--text)]"
      >
        Try again
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="grid h-6 w-6 place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface)]"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-3 rounded-full border-2 border-[color-mix(in_oklch,var(--cream-50)_40%,transparent)] border-t-[var(--cream-50)]"
      style={{ animation: "studio-spin 800ms linear infinite" }}
    >
      <style>{`@keyframes studio-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

