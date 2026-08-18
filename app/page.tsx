import Link from "next/link";
import { ArrowUpRight, BarChart3, Smartphone, Sparkles, Play } from "lucide-react";

/**
 * Front door. Four entry points into the app: the Studio itself, one
 * seeded example funnel as an end user sees it, that funnel's dashboard,
 * and the webview harness. Funnel-mode tokens (cream + olive), one column
 * on mobile, two on ≥ sm.
 */

/** Seeded by `pnpm seed:examples` — stable ID, see scripts/seed-examples.ts. */
const EXAMPLE_FUNNEL_ID = "00000000-0000-4000-8000-0000000e1001";

const ENTRIES = [
  {
    href: "/studio",
    icon: Sparkles,
    label: "Studio",
    blurb: "Describe a funnel; Claude drafts it. Edit inline or by chat.",
  },
  {
    href: `/f/${EXAMPLE_FUNNEL_ID}`,
    icon: Play,
    label: "Example funnel",
    blurb: "“What kind of eater are you?” — the live public funnel.",
  },
  {
    href: `/dashboard/${EXAMPLE_FUNNEL_ID}`,
    icon: BarChart3,
    label: "Dashboard",
    blurb: "Per-variant completion, drop-off, and result spread.",
  },
  {
    href: "/webview-test",
    icon: Smartphone,
    label: "Webview harness",
    blurb: "The same funnel inside a simulated mobile webview.",
  },
];

export default function Home() {
  return (
    <main
      className="funnel flex min-h-dvh flex-col items-center justify-center px-5 py-16 sm:px-6 sm:py-24"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 20%, color-mix(in oklch, var(--olive-500) 6%, transparent), transparent 65%), var(--cream-100)",
      }}
    >
      <div className="w-full max-w-[680px]">
        <div className="mb-7 flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--ftext-m)]">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--cream-50)]"
            style={{
              background:
                "linear-gradient(135deg, var(--olive-700), var(--olive-500))",
              fontSize: 12,
              lineHeight: 1,
            }}
            aria-hidden
          >
            ◆
          </span>
          Quiz Funnel Studio
        </div>

        <h1 className="m-0 font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--ftext)] sm:text-[54px]">
          Quiz funnels, <em className="italic text-[var(--olive-700)]">generated</em>.
        </h1>
        <p className="mb-10 mt-3.5 max-w-[520px] text-[15.5px] leading-[1.55] text-[var(--ftext-m)]">
          Type a description, get a multi-screen funnel you can preview, edit, and deploy.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ENTRIES.map(({ href, icon: Icon, label, blurb }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-2 rounded-[var(--r-lg)] border border-[var(--cream-300)] bg-[var(--cream-50)] p-4 shadow-1 transition-colors hover:border-[var(--olive-500)]"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4 shrink-0 text-[var(--olive-700)]"
                  strokeWidth={1.8}
                />
                <span className="font-sans text-[14.5px] font-medium text-[var(--ftext)]">
                  {label}
                </span>
                <ArrowUpRight
                  className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--ftext-f)] transition-colors group-hover:text-[var(--olive-700)]"
                  strokeWidth={2}
                />
              </div>
              <p className="m-0 text-[13.5px] leading-[1.45] text-[var(--ftext-m)]">
                {blurb}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-[12.5px] leading-[1.5] text-[var(--ftext-f)]">
          The example funnel and dashboard need seeded data —{" "}
          <code className="font-mono">pnpm seed:examples</code>.
        </p>
      </div>
    </main>
  );
}
