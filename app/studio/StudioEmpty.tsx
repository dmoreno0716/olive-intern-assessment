"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { readSSEStream } from "@/lib/studio/sse";
import { extractCompleteScreens } from "@/lib/studio/incrementalSpec";
import type { GenerateEvent } from "@/lib/studio/types";
import type { CatalogNode } from "@/lib/catalog/types";
import { GeneratingFilmstrip } from "./GeneratingFilmstrip";

const EXAMPLE_CHIPS = [
  "5-question quiz: what kind of eater are you?",
  "Lead-gen quiz that recommends an Olive plan",
  "Standalone paywall for the Olive Pro upsell",
  "Onboarding quiz for new Olive users",
  "3-question feedback survey",
];

type Phase =
  | { kind: "idle" }
  | { kind: "generating"; prompt: string }
  | { kind: "error"; message: string; prompt: string };

export function StudioEmpty() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [streamSpec, setStreamSpec] = useState<CatalogNode[]>([]);
  const [streamProgress, setStreamProgress] = useState<{
    chars: number;
    cost: number;
    done: boolean;
  }>({ chars: 0, cost: 0, done: false });
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setPhase({ kind: "generating", prompt: trimmed });
      setStreamSpec([]);
      setStreamProgress({ chars: 0, cost: 0, done: false });

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          const message = `Generation failed (${res.status})`;
          setPhase({ kind: "error", message, prompt: trimmed });
          return;
        }

        let charCount = 0;
        let buffer = "";
        let lastCount = 0;
        await readSSEStream<GenerateEvent>(res.body, (event) => {
          if (event.type === "delta") {
            charCount += event.text.length;
            buffer += event.text;
            setStreamProgress((p) => ({ ...p, chars: charCount }));
            // Try to materialize any newly-completed Screen objects.
            const screens = extractCompleteScreens(buffer);
            if (screens.length > lastCount) {
              lastCount = screens.length;
              setStreamSpec(screens);
            }
          } else if (event.type === "final") {
            setStreamSpec(event.spec);
            setStreamProgress((p) => ({
              ...p,
              cost: event.cost.total_usd,
              done: true,
            }));
          } else if (event.type === "persisted") {
            setStreamProgress((p) => ({
              ...p,
              cost: event.cost.total_usd,
              done: true,
            }));
            // Funnel is in the DB — navigate. State 3 will load it.
            router.push(`/studio/${event.funnel_id}`);
          } else if (event.type === "error") {
            setPhase({ kind: "error", message: event.message, prompt: trimmed });
          }
        }, ac.signal);
      } catch (err) {
        if (ac.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Network error";
        setPhase({ kind: "error", message, prompt: trimmed });
      }
    },
    [router],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void submit(prompt);
    },
    [prompt, submit],
  );

  const onChipClick = (text: string) => {
    setPrompt(text);
  };

  const onRetry = useCallback(() => {
    if (phase.kind !== "error") return;
    void submit(phase.prompt);
  }, [phase, submit]);

  const onCancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase({ kind: "idle" });
  }, []);

  if (phase.kind === "generating") {
    return (
      <GeneratingFilmstrip
        prompt={phase.prompt}
        spec={streamSpec}
        done={streamProgress.done}
        chars={streamProgress.chars}
        cost={streamProgress.cost}
        onCancel={onCancel}
      />
    );
  }

  return (
    <main
      className="studio relative flex min-h-dvh flex-col items-center justify-center px-6 py-24"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 30%, color-mix(in oklch, var(--olive-500) 5%, transparent), transparent 70%), var(--bg)",
      }}
    >
      <div className="mb-8 flex items-center gap-2.5 font-mono text-[12.5px] uppercase tracking-[0.06em] text-[var(--text-mute)]">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--cream-50)]"
          style={{
            background:
              "linear-gradient(135deg, var(--olive-700), var(--olive-500))",
            fontFamily: "var(--font-d)",
            fontStyle: "italic",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          O
        </span>
        Olive Quiz Funnel Studio
      </div>

      <h1 className="mb-3.5 max-w-[760px] text-center font-serif text-[54px] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--text)]">
        What funnel do you want to <em className="italic text-[var(--olive-700)]">build</em>?
      </h1>
      <p className="mb-9 max-w-[560px] text-center text-[15.5px] leading-[1.55] text-[var(--text-mute)]">
        Describe your audience, the question you want to answer, and what you&apos;re selling.
        Claude will draft a funnel you can edit.
      </p>

      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-[720px] flex-col gap-2 rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] p-[18px_18px_12px] shadow-2"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit(prompt);
            }
          }}
          placeholder="Describe the funnel you want to build..."
          rows={4}
          className="min-h-[80px] w-full resize-none border-none bg-transparent px-1 py-1.5 font-sans text-[16px] leading-[1.5] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
        />
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-c)] pt-2.5">
          <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--text-mute)]">
            <Sparkles className="h-3 w-3 text-[var(--olive-700)]" strokeWidth={2} />
            Claude will draft → you edit → you publish
          </div>
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="inline-flex items-center gap-2 rounded-[8px] border-none bg-[var(--olive-700)] px-3.5 py-2 font-sans text-[13px] font-medium text-[var(--cream-50)] shadow-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Generate funnel
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            <span
              className="rounded-[3px] bg-white/[0.18] px-1.5 py-px font-mono text-[10.5px] text-[var(--cream-50)]"
              aria-hidden
            >
              ⌘↵
            </span>
          </button>
        </div>
      </form>

      <div className="mt-5 grid w-full max-w-[720px] grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
        {EXAMPLE_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChipClick(c)}
            className="flex items-start gap-2.5 rounded-[10px] border border-[var(--border-c)] bg-[var(--surface)] px-3.5 py-3 text-left text-[13px] leading-[1.4] text-[var(--text)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
          >
            <span
              className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md text-[var(--olive-700)]"
              style={{ background: "var(--accent-soft)" }}
            >
              <Sparkles className="h-3 w-3" strokeWidth={2} />
            </span>
            <span>{c}</span>
          </button>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
        <span
          className="inline-block h-3.5 w-3.5 rounded-full"
          style={{
            background:
              "conic-gradient(from 60deg, var(--olive-500), var(--olive-300), var(--olive-700), var(--olive-500))",
          }}
        />
        Powered by Claude
      </div>

      {phase.kind === "error" && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--r-md)] border border-[color-mix(in_oklch,var(--error)_30%,var(--border-c))] bg-[var(--surface)] px-4 py-3 shadow-3"
        >
          <div className="flex items-center gap-3 text-[13px] text-[var(--text)]">
            <span className="font-medium text-[var(--error)]">
              Generation failed
            </span>
            <span className="text-[var(--text-mute)]">{phase.message}</span>
            <button
              type="button"
              onClick={onRetry}
              className="ml-3 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11.5px] font-medium text-[var(--text)]"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
