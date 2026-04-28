"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Copy, Send, Smartphone } from "lucide-react";

const SOURCE_META: Record<
  string,
  { label: string; mark: string; tone: string }
> = {
  tiktok: { label: "TikTok", mark: "TT", tone: "tt" },
  instagram: { label: "Instagram", mark: "IG", tone: "ig" },
  facebook: { label: "Facebook", mark: "FB", tone: "fb" },
  direct: { label: "Direct", mark: "↗", tone: "dr" },
};

const SOURCE_DOT: Record<string, string> = {
  tt: "oklch(0.62 0.13 320)",
  ig: "oklch(0.62 0.13 30)",
  fb: "oklch(0.55 0.13 245)",
  dr: "oklch(0.55 0.04 130)",
};

type Props = {
  funnelId: string;
  publicUrl: string;
  variants: { id: string; name: string }[];
};

/**
 * Pre-data dashboard. We still render the canonical structure (so the
 * creator sees the shape they're about to fill) but with messaging that
 * pushes them toward sharing the URL or dogfooding via the harness.
 */
export function EmptyState({ funnelId, publicUrl, variants }: Props) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — silent */
    }
  };

  const sources: Array<keyof typeof SOURCE_META> = [
    "tiktok",
    "instagram",
    "facebook",
    "direct",
  ];

  return (
    <section
      className="flex flex-col items-center gap-5 border-b border-[var(--border-c)] px-7 py-12 text-center"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklch, var(--olive-500) 6%, transparent), transparent 70%), var(--surface)",
      }}
    >
      <div className="relative grid h-[60px] w-[60px] place-items-center">
        <span
          className="absolute inset-0 rounded-full border-[1.5px]"
          style={{
            borderColor: "var(--olive-500)",
            opacity: 0.3,
            animation: "emp-pulse 2s var(--ease-em) infinite",
          }}
        />
        <span
          className="absolute inset-0 rounded-full border-[1.5px]"
          style={{
            borderColor: "var(--olive-500)",
            opacity: 0.3,
            animation: "emp-pulse 2s var(--ease-em) infinite",
            animationDelay: "0.5s",
          }}
        />
        <span
          className="absolute inset-0 rounded-full border-[1.5px]"
          style={{
            borderColor: "var(--olive-500)",
            opacity: 0.3,
            animation: "emp-pulse 2s var(--ease-em) infinite",
            animationDelay: "1s",
          }}
        />
        <span
          className="relative grid h-[36px] w-[36px] place-items-center rounded-full text-[var(--cream-50)]"
          style={{
            background:
              "linear-gradient(135deg, var(--olive-700), var(--olive-500))",
          }}
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>

      <h2 className="m-0 max-w-[520px] font-serif text-[42px] italic leading-[1.05] tracking-[-0.01em] text-[var(--text)]">
        Waiting for your <em className="text-[var(--olive-700)]">first response</em>.
      </h2>
      <p className="m-0 max-w-[520px] text-[14px] leading-[1.55] text-[var(--text-mute)]">
        Share the URL below with anyone — TikTok, Instagram, Facebook, or
        directly. The dashboard will start populating as soon as the first
        session lands.
      </p>

      <div className="mt-1 flex w-full max-w-[720px] flex-col gap-3.5 rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)] p-4 shadow-2">
        <div className="flex h-[46px] items-center gap-2 rounded-[8px] border border-[var(--border-c)] bg-[var(--surface-2)] pl-[14px] pr-1 font-mono text-[14px] text-[var(--text)]">
          <span className="flex-1 truncate text-left">{publicUrl}</span>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border-0 bg-[var(--olive-700)] px-3.5 font-sans text-[12.5px] font-medium text-[var(--cream-50)] hover:bg-[var(--olive-900)]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={2} /> Copy share URL
              </>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-0 border-t border-[var(--border-c)] pt-2">
          <span className="px-1 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Per-channel URLs
          </span>
          {sources.map((s) => {
            const meta = SOURCE_META[s];
            const url =
              s === "direct" ? publicUrl : `${publicUrl}?utm_source=${s}`;
            return (
              <PerSourceRow
                key={s}
                label={meta.label}
                tone={meta.tone}
                url={url}
              />
            );
          })}
        </div>
      </div>

      <Link
        href={`/webview-test?url=${encodeURIComponent(publicUrl)}`}
        target="_blank"
        className="inline-flex items-center gap-1.5 font-sans text-[13px] text-[var(--olive-700)] underline underline-offset-[3px] hover:text-[var(--olive-900)]"
      >
        <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
        Or test it via the webview harness
        <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
      </Link>

      {/* dim skeleton previews */}
      <div className="grid w-full max-w-[1080px] grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {["Started", "Completed", "CTA Intent", "Top Result"].map((label) => (
          <div
            key={label}
            className="flex min-h-[136px] flex-col gap-3 rounded-[var(--r-lg)] border border-dashed border-[var(--border-c)] bg-[var(--surface)] p-5 text-left opacity-50"
          >
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
              {label}
            </span>
            <span className="font-sans text-[34px] font-medium leading-[1] text-[var(--text-faint)]">
              —
            </span>
            <span className="font-mono text-[10.5px] text-[var(--text-faint)]">
              No data yet
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
        funnel · {funnelId} · {variants.length} variant{variants.length === 1 ? "" : "s"}
      </p>

      <style>{`
        @keyframes emp-pulse {
          from { transform: scale(1); opacity: 0.4; }
          to   { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

function PerSourceRow({
  label,
  tone,
  url,
}: {
  label: string;
  tone: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-2.5 rounded-[5px] px-1 py-1.5 hover:bg-[var(--surface-2)]">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] font-mono text-[10.5px] font-medium uppercase tracking-[0.05em]"
        style={{
          background: `color-mix(in oklch, ${SOURCE_DOT[tone] ?? "var(--text-faint)"} 16%, transparent)`,
          color: SOURCE_DOT[tone] ?? "var(--text-faint)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-[2px]"
          style={{ background: SOURCE_DOT[tone] ?? "var(--text-faint)" }}
        />
        {label}
      </span>
      <span className="truncate text-left font-mono text-[11px] text-[var(--text-mute)]">
        {url}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-[var(--border-c)] bg-[var(--surface)] px-2 font-sans text-[11px] text-[var(--text-mute)] hover:text-[var(--text)]"
      >
        {copied ? (
          <Check className="h-3 w-3 text-[var(--success)]" strokeWidth={2.4} />
        ) : (
          <Copy className="h-3 w-3" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
