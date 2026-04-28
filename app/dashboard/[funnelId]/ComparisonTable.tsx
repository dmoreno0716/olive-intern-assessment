"use client";

import { ChevronRight } from "lucide-react";
import type { VariantAnalytics } from "@/app/api/funnels/[id]/analytics/route";

const RESULT_COLORS = ["var(--r1)", "var(--r2)", "var(--r3)", "var(--r4)", "var(--r5)"];
const VARIANT_SWATCH = ["var(--olive-500)", "var(--r4)", "var(--r5)", "var(--r2)"];

type Props = {
  variants: VariantAnalytics[];
  onSelectVariant: (variantId: string) => void;
};

/**
 * The "All variants" view — replaces stat cards with a comparison table.
 * Each row is one variant with started, completed, CTA-intent, and the
 * top result (or "—" if the variant has no result screen). The variant
 * with the highest completion-rate gets a "Winning" tag.
 */
export function ComparisonTable({ variants, onSelectVariant }: Props) {
  if (variants.length === 0) return null;

  // Identify the winning variant by completion rate (only when meaningful —
  // requires at least one variant with > 5 starts to avoid the "1 person
  // completed → 100%" trap).
  const eligible = variants.filter((v) => v.started >= 5);
  const winnerId =
    eligible.length > 1
      ? eligible.reduce((best, v) =>
          v.completion_rate > best.completion_rate ? v : best,
        ).variant_id
      : null;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)]">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <Th>Variant</Th>
            <Th align="right">Started</Th>
            <Th align="right">Completed</Th>
            <Th align="right">Completion rate</Th>
            <Th align="right">CTA Intent</Th>
            <Th>Top result</Th>
            <Th> </Th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => {
            const isWinner = v.variant_id === winnerId;
            return (
              <tr
                key={v.variant_id}
                onClick={() => onSelectVariant(v.variant_id)}
                className="cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
              >
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-9 w-2 rounded-[3px]"
                      style={{
                        background: VARIANT_SWATCH[i % VARIANT_SWATCH.length],
                      }}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-[var(--text)]">
                        Variant {v.variant_name}
                      </span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
                        {v.screens.length} screens
                      </span>
                    </div>
                    {isWinner ? (
                      <span
                        className="ml-1 inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-[0.06em] font-medium"
                        style={{
                          background:
                            "color-mix(in oklch, var(--success) 14%, var(--surface))",
                          color: "var(--success)",
                        }}
                      >
                        Winning
                      </span>
                    ) : null}
                  </div>
                </Td>
                <Td align="right">
                  <span className="font-medium text-[var(--text)] tabular-nums">
                    {v.started}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-medium text-[var(--text)] tabular-nums">
                    {v.completed}
                  </span>
                </Td>
                <Td align="right">
                  <PctBar value={v.completion_rate} />
                </Td>
                <Td align="right">
                  <PctBar value={v.cta_intent_rate} />
                </Td>
                <Td>
                  {v.has_result_screen && v.top_result ? (
                    <div className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px]"
                        style={{
                          background:
                            RESULT_COLORS[v.top_result.color_index],
                        }}
                      />
                      <span
                        className="font-serif text-[15px] italic text-[var(--text)]"
                        style={{ letterSpacing: "-0.005em" }}
                      >
                        {v.top_result.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--text-faint)]">—</span>
                  )}
                </Td>
                <Td align="right">
                  <ChevronRight
                    className="ml-auto h-4 w-4 text-[var(--text-faint)]"
                    strokeWidth={2}
                  />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
      className={`border-b border-[var(--border-c)] bg-[var(--surface-2)] px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)] ${
        align === "right" ? "text-right tabular-nums" : "text-left"
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
      className={`border-b border-[var(--border-c)] px-4 py-3.5 align-middle last-of-type:border-b-0 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </td>
  );
}

function PctBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="h-1 w-[88px] overflow-hidden rounded-full"
        style={{ background: "var(--surface-2)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${v * 100}%`,
            background: "var(--olive-700)",
          }}
        />
      </div>
      <span className="font-medium text-[13px] text-[var(--text)] tabular-nums">
        {Math.round(v * 100)}%
      </span>
    </div>
  );
}
