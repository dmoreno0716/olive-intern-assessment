"use client";

type Props = {
  fraction: number;
  size?: number;
  stroke?: string;
};

/** Hand-rolled SVG completion ring: thin track + accent arc + numeric
 *  label in the middle. Recharts has a RadialBar that does this but the
 *  numeric center label and exact stroke control are easier inline. */
export function Ring({ fraction, size = 56, stroke }: Props) {
  const f = Math.max(0, Math.min(1, fraction));
  const half = size / 2;
  const r = half - 5;
  const c = 2 * Math.PI * r;
  const dash = c * f;
  const gap = c - dash;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block shrink-0"
      role="img"
      aria-label={`${Math.round(f * 100)}% complete`}
    >
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth={4}
      />
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        stroke={stroke ?? "var(--olive-700)"}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(-90 ${half} ${half})`}
        style={{ transition: "stroke-dasharray var(--m-med) var(--ease-em)" }}
      />
      <text
        x={half}
        y={half + 4}
        textAnchor="middle"
        className="font-mono text-[11px]"
        style={{ fill: "var(--text)", fontVariantNumeric: "tabular-nums" }}
      >
        {Math.round(f * 100)}%
      </text>
    </svg>
  );
}
