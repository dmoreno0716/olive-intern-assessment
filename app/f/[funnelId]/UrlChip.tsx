"use client";

import { useSyncExternalStore } from "react";
import { Lock } from "lucide-react";

/**
 * The lock-icon URL chip floating above the desktop funnel card. The host
 * is read from the browser after mount so the chip always shows the real
 * deployed origin (localhost, a Vercel preview, or the production domain)
 * rather than a hardcoded marketing domain.
 *
 * `NEXT_PUBLIC_SITE_URL` (optional) supplies the server-rendered value so
 * the chip isn't briefly hostless; without it the chip renders the path
 * alone for one frame, then fills in.
 */
function envHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return "";
  try {
    return new URL(raw).host;
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }
}

/** The host never changes without a full navigation, so there is nothing
 * to subscribe to — this just satisfies the store contract. */
const subscribe = () => () => {};

export function UrlChip({ funnelId }: { funnelId: string }) {
  const host = useSyncExternalStore(
    subscribe,
    () => window.location.host,
    envHost,
  );

  const path = `/f/${funnelId.slice(0, 8)}…`;

  return (
    <div className="absolute left-1/2 top-4 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--cream-300)] bg-[var(--cream-50)] px-3 py-1.5 font-mono text-[11px] text-[var(--ftext-m)] shadow-1">
      <Lock className="h-[11px] w-[11px] text-[var(--olive-700)]" strokeWidth={2} />
      <span>
        {host}
        {path}
      </span>
    </div>
  );
}
