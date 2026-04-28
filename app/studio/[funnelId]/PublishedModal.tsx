"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  Smartphone,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  funnelId: string;
  funnelTitle: string;
  url: string;
  sourceUrls: { source: string; url: string }[];
  onClose: () => void;
};

const SOURCE_META: Record<string, { label: string; mark: string }> = {
  tiktok: { label: "TikTok", mark: "TT" },
  instagram: { label: "Instagram", mark: "IG" },
  facebook: { label: "Facebook", mark: "FB" },
  direct: { label: "Direct", mark: "↗" },
};

/**
 * State 4 — published modal. Triggered by the Publish button in the top
 * bar. Surfaces the public URL + QR + per-source UTM URLs + deep links
 * to the dashboard and the webview test harness. Per design/STUDIO.md
 * §1.4 + design/DECISIONS.md #13 (one funnel id, four UTM-tagged
 * URLs — never separate funnel ids per channel).
 */
export function PublishedModal({
  funnelId,
  funnelTitle,
  url,
  sourceUrls,
  onClose,
}: Props) {
  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const harnessHref = `/webview-test?url=${encodeURIComponent(url)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="published-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8"
      style={{
        background: "color-mix(in oklch, var(--n-900) 50%, transparent)",
        animation: "studio-fade-in var(--m-mid) var(--ease)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[540px] overflow-hidden rounded-[var(--r-xl)] bg-[var(--cream-50)] shadow-3"
        style={{ animation: "studio-modal-in var(--m-med) var(--ease-em)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="px-7 pb-7 pt-9">
          <p className="m-0 mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Funnel published
          </p>
          <h2
            id="published-modal-title"
            className="m-0 mb-1.5 font-serif text-[34px] italic leading-[1.05] tracking-[-0.01em] text-[var(--text)]"
          >
            <span className="not-italic">{funnelTitle}</span>{" "}
            is{" "}
            <em className="text-[var(--olive-700)]">live</em>.
          </h2>
          <p className="m-0 mb-6 text-[14px] leading-[1.5] text-[var(--text-mute)]">
            Share these URLs to start collecting responses. Each channel
            uses the same funnel id — only the{" "}
            <span className="font-mono text-[12.5px]">utm_source</span>{" "}
            differs, so the dashboard splits performance per source
            automatically.
          </p>

          {/* Primary URL + QR */}
          <div className="mb-5 grid grid-cols-[1fr_auto] gap-4">
            <div className="flex flex-col gap-2">
              <Label>Shareable URL</Label>
              <UrlRow value={url} />
              <FunnelIdRow funnelId={funnelId} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="rounded-[var(--r-md)] border border-[var(--cream-300)] bg-white p-2 shadow-1">
                <QRCodeSVG
                  value={url}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="oklch(0.20 0.030 135)"
                  level="M"
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
                Scan to open
              </span>
            </div>
          </div>

          {/* Per-source URLs */}
          <div className="mb-6 flex flex-col gap-2">
            <Label>Per-channel URLs</Label>
            <ul className="m-0 flex flex-col gap-1.5">
              {sourceUrls.map((s) => {
                const meta = SOURCE_META[s.source] ?? {
                  label: s.source,
                  mark: s.source.slice(0, 2).toUpperCase(),
                };
                return (
                  <li key={s.source}>
                    <SourceRow
                      label={meta.label}
                      mark={meta.mark}
                      url={s.url}
                    />
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--cream-300)] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/${funnelId}`}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--cream-300)] bg-[var(--cream-50)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--text)] hover:bg-[var(--cream-100)]"
              >
                <BarChart3 className="h-3 w-3" strokeWidth={2} />
                View dashboard
              </Link>
              <Link
                href={harnessHref}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--cream-300)] bg-[var(--cream-50)] px-3 py-1.5 font-sans text-[12.5px] font-medium text-[var(--text)] hover:bg-[var(--cream-100)]"
              >
                <Smartphone className="h-3 w-3" strokeWidth={2} />
                Open in webview test harness
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              </Link>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--olive-700)] px-3.5 py-1.5 font-sans text-[12.5px] font-medium text-[var(--cream-50)] hover:bg-[var(--olive-900)]"
            >
              Continue editing
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes studio-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes studio-modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ============================ Pieces ============================ */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
      {children}
    </span>
  );
}

function FunnelIdRow({ funnelId }: { funnelId: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
        funnel id
      </span>
      <span className="truncate rounded-[5px] border border-[var(--cream-300)] bg-[var(--cream-50)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--text-mute)]">
        {funnelId}
      </span>
    </div>
  );
}

function UrlRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — silent */
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--cream-300)] bg-white px-2.5 py-2">
      <span className="flex-1 truncate font-mono text-[12px] text-[var(--text)]">
        {value}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="grid h-7 w-7 place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--cream-100)]"
        aria-label={`Copy ${value}`}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? (
          <Check
            className="h-3.5 w-3.5 text-[var(--success)]"
            strokeWidth={2.4}
          />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

function SourceRow({
  label,
  mark,
  url,
}: {
  label: string;
  mark: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — silent */
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--cream-300)] bg-white px-2.5 py-1.5">
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--olive-700)]"
        style={{ background: "var(--cream-200)" }}
        aria-hidden
      >
        {mark}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-sans text-[12.5px] font-medium text-[var(--text)]">
          {label}
        </span>
        <span className="truncate font-mono text-[10.5px] text-[var(--text-mute)]">
          {url}
        </span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="grid h-7 w-7 shrink-0 place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--cream-100)]"
        aria-label={`Copy ${label} URL`}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? (
          <Check
            className="h-3.5 w-3.5 text-[var(--success)]"
            strokeWidth={2.4}
          />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
