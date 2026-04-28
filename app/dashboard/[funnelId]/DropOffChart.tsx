"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VariantAnalytics } from "@/app/api/funnels/[id]/analytics/route";

type Step = {
  index: number;
  screen_id: string;
  kind: string;
  label: string;
  reached: number;
  median_dwell_ms: number;
  drop_off_pct: number;
  is_cta: boolean;
};

type Props = {
  variant: VariantAnalytics;
  started: number;
  completed: number;
  ctaClicked: number;
};

/**
 * Horizontal step chart. We append a synthetic terminal "Final → CTA"
 * bar so the right-most position always anchors on the conversion event,
 * regardless of whether the funnel ends on a result, gate, or generic
 * screen. Drop-off % is computed against the previous step's count.
 */
export function DropOffChart({
  variant,
  started,
  completed,
  ctaClicked,
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data: Step[] = useMemo(() => {
    const steps: Step[] = [];
    for (let i = 0; i < variant.drop_off.length; i++) {
      const r = variant.drop_off[i];
      const prev = i === 0 ? started : variant.drop_off[i - 1].reached;
      const drop = prev > 0 ? Math.max(0, prev - r.reached) / prev : 0;
      steps.push({
        index: i,
        screen_id: r.screen_id,
        kind: r.kind,
        label: r.label,
        reached: r.reached,
        median_dwell_ms: r.median_dwell_ms,
        drop_off_pct: drop,
        is_cta: false,
      });
    }
    // Synthetic CTA-click step.
    const lastReached = steps.length > 0 ? steps[steps.length - 1].reached : completed;
    const drop =
      lastReached > 0 ? Math.max(0, lastReached - ctaClicked) / lastReached : 0;
    steps.push({
      index: steps.length,
      screen_id: "__cta__",
      kind: "cta",
      label: "CTA Click",
      reached: ctaClicked,
      median_dwell_ms: 0,
      drop_off_pct: drop,
      is_cta: true,
    });
    return steps;
  }, [variant.drop_off, started, completed, ctaClicked]);

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] px-6 pb-5 pt-5">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 16, bottom: 4, left: 0 }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border-c)"
              strokeDasharray="2 3"
              opacity={0.6}
            />
            <XAxis
              dataKey="index"
              tickLine={false}
              axisLine={{ stroke: "var(--border-c)" }}
              tick={{
                fill: "var(--text-faint)",
                fontSize: 10,
                fontFamily: "var(--font-m)",
              }}
              tickFormatter={(v: number) => `${v + 1}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--text-faint)",
                fontSize: 10,
                fontFamily: "var(--font-m)",
              }}
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)", opacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const step = payload[0].payload as Step;
                return <BarTooltip step={step} started={started} />;
              }}
            />
            <Bar
              dataKey="reached"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
              onMouseEnter={(_, idx) => setHoverIdx(idx)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.screen_id}
                  fill={
                    d.is_cta
                      ? "var(--olive-700)"
                      : d.kind === "result"
                        ? "var(--olive-500)"
                        : d.kind === "gate"
                          ? "var(--olive-500)"
                          : "var(--olive-300)"
                  }
                  fillOpacity={
                    hoverIdx == null ? 1 : hoverIdx === i ? 1 : 0.55
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div
        className="mt-3 grid gap-0 font-mono text-[10.5px] tracking-[0.04em] text-[var(--text-faint)]"
        style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
      >
        {data.map((d, i) => (
          <div
            key={d.screen_id}
            className="flex flex-col items-center gap-0.5 px-1 text-center"
          >
            <span
              className="text-[9.5px] uppercase tracking-[0.08em]"
              style={{
                color: d.is_cta ? "var(--olive-700)" : "var(--text-mute)",
              }}
            >
              {d.is_cta ? "CTA" : `Step ${i + 1}`}
            </span>
            <span
              className="font-sans text-[11.5px] leading-[1.25]"
              style={{
                color: d.is_cta ? "var(--olive-700)" : "var(--text)",
              }}
            >
              {truncate(d.label, 22)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== Tooltip ============================== */

function BarTooltip({ step, started }: { step: Step; started: number }) {
  return (
    <div
      className="flex min-w-[200px] flex-col gap-2 rounded-[8px] px-3 py-2.5 shadow-3"
      style={{
        background: "var(--n-900)",
        color: "var(--cream-50)",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex justify-between gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em]"
        style={{ color: "color-mix(in oklch, var(--cream-50) 60%, transparent)" }}
      >
        <span>{step.is_cta ? "Final · CTA" : `Step ${step.index + 1} · ${step.kind}`}</span>
        <span>
          {started > 0
            ? `${Math.round((step.reached / started) * 100)}% of starts`
            : ""}
        </span>
      </div>
      <div
        className="font-serif text-[18px] italic leading-[1] tracking-[-0.005em]"
        style={{ color: "var(--cream-50)" }}
      >
        {step.label}
      </div>
      <div
        className="flex justify-between font-sans text-[11.5px]"
        style={{ color: "color-mix(in oklch, var(--cream-50) 75%, transparent)" }}
      >
        <span>Reached</span>
        <span className="tabular-nums" style={{ color: "var(--cream-50)" }}>
          {step.reached}
        </span>
      </div>
      {!step.is_cta ? (
        <div
          className="flex justify-between font-sans text-[11.5px]"
          style={{ color: "color-mix(in oklch, var(--cream-50) 75%, transparent)" }}
        >
          <span>Median dwell</span>
          <span className="tabular-nums" style={{ color: "var(--cream-50)" }}>
            {formatDwell(step.median_dwell_ms)}
          </span>
        </div>
      ) : null}
      {step.drop_off_pct > 0 ? (
        <div
          className="flex justify-between font-sans text-[11.5px]"
          style={{ color: "color-mix(in oklch, var(--cream-50) 75%, transparent)" }}
        >
          <span>Drop-off</span>
          <span className="tabular-nums" style={{ color: "var(--error)" }}>
            −{Math.round(step.drop_off_pct * 100)}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

function formatDwell(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}
