"use client";

import type { SourceBreakdown as Row } from "@/app/api/funnels/[id]/analytics/route";

const SRC_META: Record<
  string,
  { label: string; mark: string; dot: string }
> = {
  tiktok: { label: "TikTok", mark: "TT", dot: "oklch(0.62 0.13 320)" },
  instagram: { label: "Instagram", mark: "IG", dot: "oklch(0.62 0.13 30)" },
  facebook: { label: "Facebook", mark: "FB", dot: "oklch(0.55 0.13 245)" },
  direct: { label: "Direct", mark: "↗", dot: "oklch(0.55 0.04 130)" },
};

type Props = {
  perSource: Row[];
  orderedSources: string[];
};

/**
 * Two-column layout: stacked horizontal bar chart on the left (started =
 * olive-300, completed = olive-700, drawn from x=0 so completed visually
 * sits inside started) and a mini table on the right with rates per
 * source. Stacks vertically below 768px.
 */
export function SourceBreakdown({ perSource, orderedSources }: Props) {
  // Always render the four canonical sources even when their count is 0
  // — a dashboard with no IG sessions should still show "IG: 0" so the
  // creator knows the channel is wired but quiet.
  const rowMap = new Map(perSource.map((r) => [r.source, r]));
  const rows: Row[] = orderedSources.map(
    (s) =>
      rowMap.get(s) ?? {
        source: s,
        started: 0,
        completed: 0,
        cta_clicked: 0,
        completion_rate: 0,
      },
  );
  for (const extra of perSource) {
    if (!orderedSources.includes(extra.source)) rows.push(extra);
  }

  const max = Math.max(1, ...rows.map((r) => r.started));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] px-5 py-5">
        <div className="mb-3.5 flex gap-3.5 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
          <LegendDot label="Started" color="var(--olive-300)" />
          <LegendDot label="Completed" color="var(--olive-700)" />
        </div>
        <div className="flex flex-col gap-3.5">
          {rows.map((r) => (
            <BarRow key={r.source} row={r} max={max} />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)]">
        <table className="w-full text-[12px]">
          <thead>
            <tr>
              <Th>Source</Th>
              <Th align="right">Sessions</Th>
              <Th align="right">Completion</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = SRC_META[r.source] ?? {
                label: r.source,
                mark: r.source.slice(0, 2).toUpperCase(),
                dot: "var(--text-faint)",
              };
              return (
                <tr key={r.source}>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-[2px]"
                        style={{ background: meta.dot }}
                      />
                      <span className="text-[var(--text)]">{meta.label}</span>
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono tabular-nums">{r.started}</span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono tabular-nums">
                      {r.started === 0
                        ? "—"
                        : `${Math.round(r.completion_rate * 100)}%`}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== Pieces ============================== */

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-[2px]"
        style={{ background: color }}
      />
      <span>{label}</span>
    </span>
  );
}

function BarRow({ row, max }: { row: Row; max: number }) {
  const meta = SRC_META[row.source] ?? {
    label: row.source,
    mark: row.source.slice(0, 2).toUpperCase(),
    dot: "var(--text-faint)",
  };
  const startedPct = (row.started / max) * 100;
  const completedPct = (row.completed / max) * 100;
  const startedInsideBar = startedPct > 18;
  return (
    <div className="grid grid-cols-[90px_1fr_80px] items-center gap-3.5 text-[12.5px]">
      <span className="inline-flex items-center gap-2 font-sans text-[var(--text)]">
        <span
          className="h-2 w-2 rounded-[2px]"
          style={{ background: meta.dot }}
        />
        {meta.label}
      </span>
      <div
        className="relative h-[22px] overflow-hidden rounded-[5px]"
        style={{ background: "var(--surface-2)" }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-[5px]"
          style={{ width: `${startedPct}%`, background: "var(--olive-300)" }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-[5px]"
          style={{
            width: `${completedPct}%`,
            background: "var(--olive-700)",
          }}
        />
        {row.started > 0 ? (
          <span
            className="absolute top-1/2 -translate-y-1/2 px-2 font-mono text-[11px] tabular-nums"
            style={{
              left: 0,
              color: startedInsideBar ? "var(--cream-50)" : "var(--text-mute)",
              transform:
                startedInsideBar
                  ? "translateY(-50%)"
                  : `translate(${startedPct}%, -50%)`,
            }}
          >
            {row.started}
          </span>
        ) : null}
      </div>
      <div className="text-right">
        <div className="font-mono text-[12px] font-medium text-[var(--text)] tabular-nums">
          {row.started === 0 ? "—" : `${Math.round(row.completion_rate * 100)}%`}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
          completion
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`border-b border-[var(--border-c)] bg-[var(--surface-2)] px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <td
      className={`border-b border-[var(--border-c)] px-3.5 py-2.5 last-of-type:border-b-0 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </td>
  );
}
