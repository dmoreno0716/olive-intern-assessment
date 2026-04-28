"use client";

import { useEffect, useRef } from "react";
import type { CatalogNode } from "@/lib/catalog/types";
import { renderNode } from "@/lib/catalog/render";
import "@/lib/catalog";

type Props = {
  prompt: string;
  spec: CatalogNode[];
  done: boolean;
  chars: number;
  cost: number;
  onCancel: () => void;
};

const CARD_W = 220;
const CARD_H = 380;
const SCREEN_W = 480;
const SCREEN_H = 760;
const SCALE = CARD_W / SCREEN_W;

/**
 * State 2 — generating filmstrip. As `delta` events arrive, complete
 * Screen nodes get parsed out of the buffer in StudioEmpty and snapped
 * into this filmstrip. A trailing skeleton card represents the screen
 * currently being drafted. Per design/DECISIONS.md #15.
 */
export function GeneratingFilmstrip({
  prompt,
  spec,
  done,
  chars,
  cost,
  onCancel,
}: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const screenCount = spec.length;

  // Scroll the filmstrip to the trailing card whenever a new one materializes.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [screenCount, done]);

  return (
    <main
      className="studio relative flex min-h-dvh flex-col gap-7 px-6 py-9"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto w-full max-w-[760px] rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-4 py-3 shadow-1">
        <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Prompt
        </div>
        <p className="m-0 line-clamp-2 text-[13.5px] leading-[1.5] text-[var(--text)]">
          {prompt}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="m-0 font-serif text-[34px] italic leading-tight tracking-tight text-[var(--text)]">
          Drafting your funnel<span className="opacity-60">…</span>
        </h2>
        <ProgressCaption
          screenCount={screenCount}
          chars={chars}
          done={done}
        />
      </div>

      <div
        ref={stripRef}
        className="-mx-6 flex shrink-0 snap-x snap-mandatory items-center gap-5 overflow-x-auto overflow-y-hidden px-6 pb-2 pt-2"
        style={{ minHeight: CARD_H + 24 }}
      >
        {spec.map((node, i) => (
          <PhoneCard key={`s-${i}`} index={i}>
            <ScaledScreen node={node} />
          </PhoneCard>
        ))}
        {!done && <PhoneCard index={spec.length} pending />}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4">
        <CostMeter cost={cost} />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}

function ProgressCaption({
  screenCount,
  chars,
  done,
}: {
  screenCount: number;
  chars: number;
  done: boolean;
}) {
  const label = done
    ? `${screenCount} screen${screenCount === 1 ? "" : "s"} drafted · finalizing`
    : screenCount === 0
      ? `Streaming · ${chars.toLocaleString()} chars`
      : `Screen ${screenCount + 1} · ${chars.toLocaleString()} chars`;
  return (
    <div className="flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.06em] text-[var(--text-mute)]">
      {!done && <Spinner />}
      <span>{label}</span>
    </div>
  );
}

function PhoneCard({
  index,
  pending,
  children,
}: {
  index: number;
  pending?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex shrink-0 snap-start flex-col gap-1.5"
      style={{ animation: "studio-card-in 280ms var(--ease-em) both" }}
    >
      <div
        className="relative shrink-0 overflow-hidden bg-[#0a0a0a] p-1"
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 26,
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.06), 0 16px 36px rgba(0,0,0,0.10)",
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden bg-[var(--cream-100)]"
          style={{ borderRadius: 22 }}
        >
          {pending ? <Skeleton /> : children}
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
          Screen {index + 1}
        </span>
        {pending ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--olive-700)]">
            drafting
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--success)]">
            ●
          </span>
        )}
      </div>
      <style>{`
        @keyframes studio-card-in {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ScaledScreen({ node }: { node: CatalogNode }) {
  return (
    <div
      style={{
        width: SCREEN_W,
        height: SCREEN_H,
        transform: `scale(${SCALE})`,
        transformOrigin: "top left",
        pointerEvents: "none",
      }}
    >
      {renderNode(node, "filmstrip")}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 px-5 py-7">
      <div className="h-[3px] w-full rounded-full bg-[var(--cream-300)]">
        <div
          className="h-full w-[28%] rounded-full bg-[var(--olive-500)]"
          style={{ animation: "studio-skel-bar 1500ms ease-in-out infinite" }}
        />
      </div>
      <div className="mt-6 h-[10px] w-[42%] rounded-full bg-[var(--cream-300)]" />
      <div className="h-[18px] w-[88%] rounded-md bg-[var(--cream-300)]" />
      <div className="h-[18px] w-[68%] rounded-md bg-[var(--cream-300)]" />
      <div className="mt-3 h-[10px] w-[34%] rounded-full bg-[var(--cream-300)]" />
      {[88, 84, 80, 76].map((w) => (
        <div
          key={w}
          className="h-[44px] rounded-[14px] border border-[var(--cream-300)]"
          style={{ width: `${w}%` }}
        />
      ))}
      <div className="mt-auto h-[44px] w-full rounded-[14px] bg-[var(--olive-500)] opacity-50" />
      <style>{`
        @keyframes studio-skel-bar {
          0%   { width: 18%; transform: translateX(0); }
          50%  { width: 38%; transform: translateX(180%); }
          100% { width: 18%; transform: translateX(420%); }
        }
      `}</style>
    </div>
  );
}

function CostMeter({ cost }: { cost: number }) {
  const display = cost > 0 ? `$${cost.toFixed(4)}` : "$0.0000";
  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-mute)]">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{
          background: "var(--olive-500)",
          boxShadow:
            "0 0 0 3px color-mix(in oklch, var(--olive-500) 22%, transparent)",
        }}
      />
      Cost · {display}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--olive-700)]"
      style={{ animation: "studio-spin 800ms linear infinite" }}
      aria-hidden
    >
      <style>{`@keyframes studio-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
