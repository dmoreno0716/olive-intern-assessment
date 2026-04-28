"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Pencil,
  Smartphone,
} from "lucide-react";
import type {
  AnalyticsPayload,
  VariantAnalytics,
} from "@/app/api/funnels/[id]/analytics/route";
import { StatCards } from "./StatCards";
import { ComparisonTable } from "./ComparisonTable";
import { SourceBreakdown } from "./SourceBreakdown";
import { DropOffChart } from "./DropOffChart";
import { ResultDonut } from "./ResultDonut";
import { ResponsesTable } from "./ResponsesTable";
import { EmptyState } from "./EmptyState";

type Props = {
  funnelId: string;
  funnelTitle: string;
  funnelStatus: "draft" | "published";
  funnelUpdatedAt: string;
  publicUrl: string;
  analytics: AnalyticsPayload;
};

const SOURCE_KEYS = ["tiktok", "instagram", "facebook", "direct"] as const;

export function Dashboard({
  funnelId,
  funnelTitle,
  funnelStatus,
  funnelUpdatedAt,
  publicUrl,
  analytics,
}: Props) {
  // The "All" tab shows the comparison table; clicking a variant tab
  // narrows everything below to that one variant.
  const [activeTab, setActiveTab] = useState<"all" | string>("all");
  const [resultFilter, setResultFilter] = useState<string | null>(null);

  const isEmpty = analytics.totals.started === 0;
  const activeVariant: VariantAnalytics | null = useMemo(() => {
    if (activeTab === "all") return null;
    return analytics.per_variant.find((v) => v.variant_id === activeTab) ?? null;
  }, [activeTab, analytics.per_variant]);

  // The dashboard scopes to the active tab everywhere below the variant
  // row; aggregating a "virtual" all-variants row keeps the rendering
  // path uniform.
  const scopedSources = useMemo(() => {
    return activeTab === "all"
      ? analytics.per_source_total
      : (activeVariant?.per_source ?? []);
  }, [activeTab, activeVariant, analytics.per_source_total]);

  const responsesScoped = useMemo(() => {
    let rows = analytics.responses;
    if (activeTab !== "all") {
      rows = rows.filter((r) => r.variant_id === activeTab);
    }
    if (resultFilter) {
      rows = rows.filter((r) => r.result?.label === resultFilter);
    }
    return rows;
  }, [analytics.responses, activeTab, resultFilter]);

  const showResultDonut =
    activeTab === "all"
      ? analytics.any_has_result_screen
      : (activeVariant?.has_result_screen ?? false);

  const aggregatedResults = useMemo(() => {
    if (activeTab !== "all") {
      return activeVariant?.result_distribution ?? [];
    }
    // Combine result distributions across every variant that has them.
    const map = new Map<
      string,
      { result_id: string; label: string; color_index: number; count: number }
    >();
    for (const v of analytics.per_variant) {
      for (const r of v.result_distribution) {
        const cur = map.get(r.label) ?? {
          result_id: r.result_id,
          label: r.label,
          color_index: r.color_index,
          count: 0,
        };
        cur.count += r.count;
        map.set(r.label, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [activeTab, activeVariant, analytics.per_variant]);

  const totalCompletersInScope = useMemo(() => {
    if (activeTab === "all") return analytics.totals.completed;
    return activeVariant?.completed ?? 0;
  }, [activeTab, activeVariant, analytics.totals.completed]);

  return (
    <main className="min-h-dvh bg-[var(--bg)]">
      {/* ───────── Top nav: breadcrumb + actions ───────── */}
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[var(--border-c)] bg-[var(--surface)] px-6 py-3">
        <div className="flex items-center gap-2.5 font-sans text-[13px] font-medium text-[var(--text)]">
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
          <em className="font-serif italic text-[15px] tracking-[-0.005em] text-[var(--olive-700)]">
            Olive
          </em>
          <span className="text-[var(--text-faint)]">·</span>
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Dashboard
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Link
            href={`/studio/${funnelId}`}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <Pencil className="h-3 w-3" strokeWidth={2} />
            Edit funnel
          </Link>
          <a
            href={`/api/funnels/${funnelId}/export`}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
            title="Download sessions + responses as CSV"
          >
            <Download className="h-3 w-3" strokeWidth={2} />
            Export CSV
          </a>
        </div>
      </header>

      {/* ───────── Hero header (title + URL chip + quick stats) ───────── */}
      <section className="flex flex-col gap-3 border-b border-[var(--border-c)] bg-[var(--surface)] px-7 pb-5 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 font-serif text-[38px] italic leading-[1] tracking-[-0.01em] text-[var(--text)]">
            {funnelTitle}
          </h1>
          <StatusPill status={funnelStatus} />
          <div className="ml-auto font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
            updated {relativeTime(funnelUpdatedAt)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <UrlChip value={publicUrl} />
          <Link
            href={`/webview-test?url=${encodeURIComponent(publicUrl)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface-2)] px-3 py-1.5 font-sans text-[12px] text-[var(--text-mute)] hover:text-[var(--text)]"
          >
            <Smartphone className="h-3 w-3" strokeWidth={2} />
            Open in webview test
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </Link>
          <div className="ml-auto hidden items-center gap-5 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-mute)] md:flex">
            <QuickStat label="Started" value={analytics.totals.started} />
            <QuickStat label="Completed" value={analytics.totals.completed} />
            <QuickStat
              label="CTA rate"
              value={pct(
                analytics.totals.completed
                  ? analytics.totals.cta_clicked / analytics.totals.completed
                  : 0,
              )}
            />
          </div>
        </div>
      </section>

      {/* ───────── Variant tabs ───────── */}
      <div className="sticky top-[53px] z-[9] flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--surface)] px-7">
        <div className="flex">
          <VariantTab
            active={activeTab === "all"}
            onClick={() => {
              setActiveTab("all");
              setResultFilter(null);
            }}
            label="All variants"
            sub={`${analytics.totals.started}`}
            tone="all"
          />
          {analytics.per_variant.map((v, i) => (
            <VariantTab
              key={v.variant_id}
              active={activeTab === v.variant_id}
              onClick={() => {
                setActiveTab(v.variant_id);
                setResultFilter(null);
              }}
              label={`Variant ${v.variant_name}`}
              sub={`${v.started}`}
              tone={`v${i % 4}`}
            />
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          funnelId={funnelId}
          publicUrl={publicUrl}
          variants={analytics.per_variant.map((v) => ({
            id: v.variant_id,
            name: v.variant_name,
          }))}
        />
      ) : (
        <div className="flex flex-col gap-6 px-7 pb-16 pt-6">
          {/* Stat cards (single variant) or comparison table (all). */}
          {activeTab === "all" ? (
            <Section
              title="Variants"
              desc="Compare performance across the live variants. Click any row to drill into a single variant."
            >
              <ComparisonTable
                variants={analytics.per_variant}
                onSelectVariant={(id) => {
                  setActiveTab(id);
                  setResultFilter(null);
                }}
              />
            </Section>
          ) : activeVariant ? (
            <Section
              title="Performance"
              desc="Headline metrics for this variant. CTA Intent rate is the share of completers who clicked the final CTA."
            >
              <StatCards variant={activeVariant} />
            </Section>
          ) : null}

          {/* Source breakdown */}
          <Section
            title="By source"
            desc="Where your traffic is coming from. Sources are tagged via the utm_source query param on the share URL."
          >
            <SourceBreakdown
              perSource={normalizeSources(scopedSources)}
              orderedSources={SOURCE_KEYS as unknown as string[]}
            />
          </Section>

          {/* Drop-off chart (only meaningful for a single variant — the
             screen list is per-variant). */}
          {activeVariant ? (
            <Section
              title="Drop-off"
              desc="How many users remain at each screen. The right-most bar is the share of completers who clicked the final CTA."
            >
              <DropOffChart
                variant={activeVariant}
                started={activeVariant.started}
                completed={activeVariant.completed}
                ctaClicked={activeVariant.cta_clicked}
              />
            </Section>
          ) : null}

          {/* Result distribution (conditional). */}
          {showResultDonut && aggregatedResults.length > 0 ? (
            <Section
              title="Outcomes"
              desc={
                activeTab === "all"
                  ? "Combined result distribution across variants. Click a slice to filter the responses below."
                  : "How many people landed on each outcome. Click a slice to filter the responses below."
              }
            >
              <ResultDonut
                buckets={aggregatedResults}
                totalCompleters={totalCompletersInScope}
                activeLabel={resultFilter}
                onPick={(label) =>
                  setResultFilter((cur) => (cur === label ? null : label))
                }
              />
            </Section>
          ) : null}

          {/* Responses table */}
          <Section
            title="Responses"
            desc="Every session in detail. Expand a row to see per-screen answers and dwell."
            right={
              resultFilter ? (
                <button
                  type="button"
                  className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--olive-700)] hover:underline"
                  onClick={() => setResultFilter(null)}
                >
                  Clear result filter ({resultFilter})
                </button>
              ) : null
            }
          >
            <ResponsesTable
              rows={responsesScoped}
              showVariantColumn={activeTab === "all"}
              showResultColumn={
                activeTab === "all"
                  ? analytics.any_has_result_screen
                  : (activeVariant?.has_result_screen ?? false)
              }
            />
          </Section>
        </div>
      )}
    </main>
  );
}

/* =====================================================================
   Sub-pieces (small enough to keep co-located with the dashboard chrome)
   ===================================================================== */

function Section({
  title,
  desc,
  right,
  children,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="m-0 font-serif text-[22px] italic leading-[1] tracking-[-0.005em] text-[var(--text)]">
            {title}
          </h2>
          {desc ? (
            <p className="m-0 max-w-[480px] text-[12.5px] leading-[1.45] text-[var(--text-mute)]">
              {desc}
            </p>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function VariantTab({
  active,
  onClick,
  label,
  sub,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  tone: string;
}) {
  const dotColor =
    tone === "v0"
      ? "var(--olive-500)"
      : tone === "v1"
        ? "var(--r4)"
        : tone === "v2"
          ? "var(--r5)"
          : tone === "v3"
            ? "var(--r2)"
            : "var(--text-mute)";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-[18px] py-[14px] font-sans text-[13px] font-medium ${
        active ? "text-[var(--text)]" : "text-[var(--text-mute)]"
      }`}
      style={{
        boxShadow: active
          ? "inset 0 -2px 0 0 var(--olive-700)"
          : undefined,
      }}
    >
      {tone !== "all" ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor }}
        />
      ) : null}
      {label}
      <span
        className="rounded-[4px] px-1.5 py-[1px] font-mono text-[11px] tabular-nums"
        style={{
          color: active ? "var(--text-mute)" : "var(--text-faint)",
          background: active ? "var(--accent-soft)" : "var(--surface-2)",
        }}
      >
        {sub}
      </span>
    </button>
  );
}

function StatusPill({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] font-medium"
        style={{
          background: "color-mix(in oklch, var(--success) 13%, var(--surface))",
          color: "var(--success)",
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--success)",
            boxShadow:
              "0 0 0 3px color-mix(in oklch, var(--success) 22%, transparent)",
          }}
        />
        Live
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] font-medium"
      style={{ background: "var(--surface-2)", color: "var(--text-mute)" }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--text-faint)]" />
      Draft
    </span>
  );
}

function UrlChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div
      className="inline-flex h-8 max-w-[420px] items-center gap-2 rounded-[8px] border border-[var(--border-c)] bg-[var(--surface-2)] px-3 py-1 font-mono text-[12px] text-[var(--text)]"
    >
      <span className="flex-1 truncate">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-6 items-center gap-1 rounded-[5px] border border-[var(--border-c)] bg-[var(--surface)] px-2 font-sans text-[11px] text-[var(--text)] hover:bg-[var(--surface-2)]"
        aria-label={copied ? "Copied" : "Copy share URL"}
      >
        {copied ? (
          <Check className="h-3 w-3 text-[var(--success)]" strokeWidth={2.4} />
        ) : (
          <Copy className="h-3 w-3" strokeWidth={2} />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function QuickStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[11px] uppercase tracking-[0.04em]">{label}</span>
      <span className="font-sans text-[18px] font-medium tabular-nums tracking-[-0.005em] text-[var(--text)]">
        {value}
      </span>
    </div>
  );
}

/* ============================== utils ============================== */

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const delta = Math.max(0, Date.now() - t);
  const m = Math.floor(delta / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Order known sources first, then any extras; lets the chart rows
 *  always read tiktok / ig / fb / direct in that order. */
function normalizeSources(
  rows: { source: string; started: number; completed: number; cta_clicked: number; completion_rate: number }[],
) {
  const order = ["tiktok", "instagram", "facebook", "direct"];
  const idx = (s: string) => {
    const i = order.indexOf(s);
    return i === -1 ? 99 : i;
  };
  return [...rows].sort((a, b) => idx(a.source) - idx(b.source));
}
