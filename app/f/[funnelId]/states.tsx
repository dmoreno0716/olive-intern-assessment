import Link from "next/link";
import { Lock, WifiOff } from "lucide-react";
import { FunnelPageFrame } from "./Frame";

/**
 * Shared error / state surfaces for the public funnel page. Each one
 * renders inside the same desktop card frame as the live funnel so visual
 * jumps are minimal between states.
 */

export function FunnelDraft({ funnelId, title }: { funnelId: string; title?: string }) {
  return (
    <FunnelPageFrame funnelId={funnelId}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 py-9 text-center">
        <div
          className="grid h-16 w-16 place-items-center rounded-[18px] border-[1.5px]"
          style={{
            borderColor:
              "color-mix(in oklch, var(--warning) 40%, var(--cream-300))",
            background:
              "color-mix(in oklch, var(--warning) 8%, var(--cream-50))",
            color: "var(--warning)",
          }}
        >
          <Lock className="h-7 w-7" strokeWidth={1.6} />
        </div>
        <h2 className="m-0 max-w-[320px] font-serif text-[30px] italic leading-[1.1] tracking-tight text-[var(--olive-900)]">
          This funnel is <em className="font-serif italic text-[var(--olive-700)]">not live yet</em>.
        </h2>
        <p className="m-0 max-w-[320px] text-[14.5px] leading-[1.5] text-[var(--ftext-m)]">
          {title
            ? `“${title}” hasn’t been published.`
            : "The creator hasn’t published this funnel."}
          {" "}Hang tight — they’ll share the link when it’s ready.
        </p>
        <span className="mt-1 rounded-[5px] border border-[var(--cream-300)] bg-[var(--cream-50)] px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-f)]">
          status · draft
        </span>
        <div className="mt-3 flex w-full max-w-[280px] flex-col gap-2">
          <Link
            href={`/studio/funnels/${funnelId}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[var(--olive-500)] bg-transparent px-5 py-3 text-[15px] font-medium text-[var(--olive-700)]"
          >
            Open in Studio →
          </Link>
        </div>
      </div>
    </FunnelPageFrame>
  );
}

export function FunnelLoadError({
  funnelId,
  message,
}: {
  funnelId: string;
  message: string;
}) {
  return (
    <FunnelPageFrame funnelId={funnelId}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 py-9 text-center">
        <div
          className="grid h-16 w-16 place-items-center rounded-[18px] border-[1.5px]"
          style={{
            borderColor: "color-mix(in oklch, var(--error) 40%, var(--cream-300))",
            background: "color-mix(in oklch, var(--error) 8%, var(--cream-50))",
            color: "var(--error)",
          }}
        >
          <WifiOff className="h-7 w-7" strokeWidth={1.6} />
        </div>
        <h2 className="m-0 max-w-[320px] font-serif text-[30px] italic leading-[1.1] tracking-tight text-[var(--olive-900)]">
          Couldn&apos;t reach Olive.
        </h2>
        <p className="m-0 max-w-[320px] text-[14.5px] leading-[1.5] text-[var(--ftext-m)]">
          {message}. Check your connection and try again.
        </p>
        <span className="mt-1 rounded-[5px] border border-[var(--cream-300)] bg-[var(--cream-50)] px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-f)]">
          err · network
        </span>
      </div>
    </FunnelPageFrame>
  );
}

