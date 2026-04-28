"use client";

import type { VariantAnalytics } from "@/app/api/funnels/[id]/analytics/route";
import { Sparkline } from "./charts/Sparkline";
import { Ring } from "./charts/Ring";

const RESULT_COLORS = ["var(--r1)", "var(--r2)", "var(--r3)", "var(--r4)", "var(--r5)"];

/**
 * Per-variant 4-up grid: Started, Completed, CTA Intent rate, Top Result.
 * Top Result hides itself entirely when the variant has no result screen
 * (per design/DECISIONS.md #12 — analytics empty states stay quiet).
 */
export function StatCards({ variant }: { variant: VariantAnalytics }) {
  const showTopResult = variant.has_result_screen && variant.top_result;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <Label>Started</Label>
        <Value>{variant.started}</Value>
        <BodyRow>
          <SparkWrap>
            <Sparkline values={variant.sparkline_30d} />
          </SparkWrap>
        </BodyRow>
        <Caption>30 days · sessions started</Caption>
      </Card>

      <Card>
        <Label>Completed</Label>
        <Value>{variant.completed}</Value>
        <BodyRow>
          <SparkWrap>
            <Sparkline values={variant.sparkline_30d} />
          </SparkWrap>
          <Ring fraction={variant.completion_rate} size={56} />
        </BodyRow>
        <Caption>{pct(variant.completion_rate)} of starts finished</Caption>
      </Card>

      <Card>
        <Label>CTA Intent Rate</Label>
        <Value>{pct(variant.cta_intent_rate)}</Value>
        <BodyRow>
          <Ring
            fraction={variant.cta_intent_rate}
            size={56}
            stroke="var(--olive-500)"
          />
        </BodyRow>
        <Caption>
          {variant.cta_clicked} CTA clicks ÷ {variant.completed} completers
        </Caption>
      </Card>

      {showTopResult && variant.top_result ? (
        <Card>
          <Label>Top Result</Label>
          <div
            className="m-0 flex items-center gap-2.5 font-serif text-[26px] italic leading-[1] tracking-[-0.005em] text-[var(--text)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-[4px]"
              style={{ background: RESULT_COLORS[variant.top_result.color_index] }}
            />
            <span className="truncate">{variant.top_result.label}</span>
          </div>
          {/* Mini legend showing the rest. */}
          <div className="mt-auto flex flex-col gap-1 font-mono text-[10.5px] text-[var(--text-faint)]">
            {variant.result_distribution.slice(0, 4).map((r) => (
              <div key={r.result_id} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-[2px]"
                  style={{ background: RESULT_COLORS[r.color_index] }}
                />
                <span className="truncate text-[var(--text-mute)]">{r.label}</span>
                <span className="ml-auto tabular-nums">
                  {Math.round((r.count / Math.max(1, variant.completed)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

/* ============================== Pieces ============================== */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[148px] flex-col gap-3.5 overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] px-5 pb-4 pt-[18px]">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
      {children}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans text-[34px] font-medium leading-[1] tabular-nums tracking-[-0.015em] text-[var(--text)]">
      {children}
    </div>
  );
}

function BodyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto flex items-end justify-between gap-2.5">
      {children}
    </div>
  );
}

function SparkWrap({ children }: { children: React.ReactNode }) {
  return <div className="h-[42px] flex-1">{children}</div>;
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] text-[var(--text-faint)]">
      {children}
    </div>
  );
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}
