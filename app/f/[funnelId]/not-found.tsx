import Link from "next/link";
import { SearchX } from "lucide-react";
import { FunnelPageFrame } from "./Frame";

/**
 * Triggered by the page's `notFound()` when the funnelId param is unknown
 * or the funnel has no published variants. Static — no params accessor in
 * Next 16 not-found segments.
 */
export default function NotFound() {
  return (
    <FunnelPageFrame funnelId="notfound">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 py-9 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[18px] border-[1.5px] border-[var(--cream-300)] bg-[var(--cream-50)] text-[var(--olive-700)]">
          <SearchX className="h-7 w-7" strokeWidth={1.6} />
        </div>
        <h2 className="m-0 max-w-[320px] font-serif text-[30px] italic leading-[1.1] tracking-tight text-[var(--olive-900)]">
          This funnel <em className="font-serif italic text-[var(--olive-700)]">doesn&apos;t exist</em>.
        </h2>
        <p className="m-0 max-w-[320px] text-[14.5px] leading-[1.5] text-[var(--ftext-m)]">
          It may have been moved, the link mistyped, or never published.
        </p>
        <span className="mt-1 rounded-[5px] border border-[var(--cream-300)] bg-[var(--cream-50)] px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-f)]">
          err · not_found
        </span>
        <div className="mt-3 flex w-full max-w-[280px] flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[var(--olive-500)] bg-transparent px-5 py-3 text-[15px] font-medium text-[var(--olive-700)]"
          >
            Go to Olive →
          </Link>
        </div>
      </div>
    </FunnelPageFrame>
  );
}
