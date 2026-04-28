"use client";

import { Filter } from "lucide-react";
import type { ResultBucket } from "@/app/api/funnels/[id]/analytics/route";

const RESULT_COLORS = ["var(--r1)", "var(--r2)", "var(--r3)", "var(--r4)", "var(--r5)"];

type Props = {
  buckets: ResultBucket[];
  totalCompleters: number;
  activeLabel: string | null;
  onPick: (label: string) => void;
};

/**
 * Hand-rolled SVG donut. Recharts has PieChart but the click-to-filter +
 * exact arc geometry was easier inline (per design/DASHBOARD.md
 * "Donut is hand-rolled SVG"). The center reads total completers; the
 * legend on the right is click-to-filter on the responses table below.
 */
export function ResultDonut({
  buckets,
  totalCompleters,
  activeLabel,
  onPick,
}: Props) {
  const totalCount = buckets.reduce((s, b) => s + b.count, 0);
  const denominator = Math.max(totalCount, 1);

  return (
    <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] md:grid-cols-[1fr_1.3fr]">
      <div className="relative flex items-center justify-center border-b border-[var(--border-c)] p-6 md:border-b-0 md:border-r">
        <Donut
          buckets={buckets}
          activeLabel={activeLabel}
          onPick={onPick}
          denominator={denominator}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5">
          <span className="font-serif text-[36px] italic leading-[1] tracking-[-0.01em] text-[var(--text)]">
            {totalCompleters}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            Completers
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2 p-5">
        {buckets.map((b) => {
          const isActive = activeLabel === b.label;
          const sharePct = (b.count / denominator) * 100;
          return (
            <button
              key={b.result_id}
              type="button"
              onClick={() => onPick(b.label)}
              className={`grid grid-cols-[18px_1fr_auto_auto] items-center gap-3 rounded-[var(--r-md)] px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-2)] ${
                isActive ? "bg-[var(--surface-2)]" : ""
              }`}
              style={
                isActive
                  ? {
                      outline: "1.5px solid var(--olive-700)",
                      outlineOffset: "-1.5px",
                    }
                  : undefined
              }
            >
              <span
                className="h-3.5 w-3.5 rounded-[4px]"
                style={{ background: RESULT_COLORS[b.color_index] }}
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-[18px] italic leading-[1.1] tracking-[-0.005em] text-[var(--text)]">
                  {b.label}
                </span>
                <span className="font-sans text-[11.5px] text-[var(--text-mute)]">
                  {b.count} {b.count === 1 ? "person" : "people"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-[1px] font-mono text-[13px] tabular-nums text-[var(--text)]">
                <span>{Math.round(sharePct)}%</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
                  Share
                </span>
              </div>
              <Filter
                className={`h-3.5 w-3.5 transition-opacity ${
                  isActive ? "opacity-100 text-[var(--olive-700)]" : "opacity-30 text-[var(--text-faint)]"
                }`}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== Donut SVG ============================== */

function Donut({
  buckets,
  activeLabel,
  onPick,
  denominator,
}: {
  buckets: ResultBucket[];
  activeLabel: string | null;
  onPick: (label: string) => void;
  denominator: number;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 92;
  const ir = 64;

  // Edge case: a single bucket draws as a full circle (a zero-degree
  // arc is a no-op in SVG arc commands).
  if (buckets.length === 1) {
    const b = buckets[0];
    const isActive = activeLabel === b.label;
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        <circle
          cx={cx}
          cy={cy}
          r={(r + ir) / 2}
          stroke={`var(--r${b.color_index + 1})`}
          strokeWidth={r - ir}
          fill="none"
          opacity={!activeLabel || isActive ? 1 : 0.4}
          onClick={() => onPick(b.label)}
          style={{ cursor: "pointer" }}
        />
      </svg>
    );
  }

  // Pre-compute the cumulative arc bounds so the render loop is pure
  // (no mutating `cursor` across iterations — React Compiler flagged
  // that as unsafe).
  const start = -Math.PI / 2;
  const cumulative: { from: number; to: number }[] = [];
  let acc = 0;
  for (const b of buckets) {
    const frac = b.count / denominator;
    cumulative.push({
      from: start + acc * 2 * Math.PI,
      to: start + (acc + frac) * 2 * Math.PI,
    });
    acc += frac;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      {buckets.map((b, i) => {
        if (b.count === 0) return null;
        const { from, to } = cumulative[i];
        const path = arcPath(cx, cy, r, ir, from, to);
        const isActive = activeLabel === b.label;
        const dim = activeLabel && !isActive;
        return (
          <path
            key={b.result_id}
            d={path}
            fill={`var(--r${b.color_index + 1})`}
            opacity={dim ? 0.4 : 1}
            onClick={() => onPick(b.label)}
            style={{
              cursor: "pointer",
              transformOrigin: `${cx}px ${cy}px`,
              transform: isActive ? "scale(1.04)" : "scale(1)",
              transition:
                "opacity var(--m-mid) var(--ease), transform var(--m-mid) var(--ease-em)",
            }}
          />
        );
      })}
    </svg>
  );
}

/** Outer arc → inner arc → close. Uses the large-arc flag so segments
 *  > 180° render correctly. */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  ir: number,
  start: number,
  end: number,
): string {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const x3 = cx + ir * Math.cos(end);
  const y3 = cy + ir * Math.sin(end);
  const x4 = cx + ir * Math.cos(start);
  const y4 = cy + ir * Math.sin(start);
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${ir} ${ir} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}
