"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

type Props = {
  values: number[];
};

/** A 30-point area mini-chart. Tokens-only (olive-700 stroke, olive-500
 * tinted fill). Filled even when all values are zero so the card never
 * collapses to nothing. */
export function Sparkline({ values }: Props) {
  const id = useId();
  const data = useMemo(
    () => values.map((v, i) => ({ i, v })),
    [values],
  );
  const allZero = useMemo(() => values.every((v) => v === 0), [values]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--olive-500)"
              stopOpacity={0.32}
            />
            <stop
              offset="100%"
              stopColor="var(--olive-500)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={allZero ? "var(--border-strong)" : "var(--olive-700)"}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
