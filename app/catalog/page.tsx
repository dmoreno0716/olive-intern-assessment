"use client";

import { FunnelRenderer } from "@/lib/catalog/funnelRenderer";
import type { CatalogNode } from "@/lib/catalog/types";

const quizQuestion: CatalogNode = {
  kind: "Screen",
  props: {
    id: "stuck-when",
    kind: "question",
    body: [
      { kind: "Eyebrow", props: { text: "3 of 6" } },
      {
        kind: "Heading",
        props: {
          text: "When do you feel most stuck?",
          emphasis: "most stuck",
          size: "2xl",
        },
      },
      {
        kind: "Body",
        props: {
          text: "Pick the moment when your energy dips the hardest. We'll tune the protocol around it.",
        },
      },
      {
        kind: "ChoiceList",
        props: {
          field: "stuckWhen",
          options: [
            { value: "morning", label: "First thing in the morning" },
            { value: "afternoon", label: "Mid-afternoon slump" },
            { value: "night", label: "Right before bed" },
            { value: "varies", label: "It varies day to day" },
          ],
        },
      },
    ],
    footer: [{ kind: "PrimaryCTA", props: { label: "Continue" } }],
  },
};

const quizResult: CatalogNode = {
  kind: "Screen",
  props: {
    id: "result",
    kind: "result",
    showBack: false,
    body: [
      { kind: "ResultBadge", props: { label: "Your match" } },
      {
        kind: "ResultHero",
        props: {
          resultName: "The Slow Burn protocol fits you best.",
          emphasis: "Slow Burn",
          tagline:
            "Built for people whose afternoons fall apart. 14 days, 8 minutes a day, no caffeine reset.",
        },
      },
      {
        kind: "PriceCard",
        props: {
          title: "14 days · $24",
          subtitle: "$1.71/day",
          bullets: [
            "8-minute morning practice",
            "Afternoon micro-resets",
            "Cancel any time",
          ],
        },
      },
    ],
    footer: [
      {
        kind: "PrimaryCTA",
        props: {
          label: "Start my 14 days",
          action: "external",
          href: "/checkout?p=slow-burn",
        },
      },
      { kind: "SecondaryCTA", props: { label: "Maybe later" } },
    ],
  },
};

const standalonePaywall: CatalogNode = {
  kind: "Screen",
  props: {
    id: "paywall",
    kind: "gate",
    showProgress: false,
    showBack: false,
    body: [
      { kind: "Eyebrow", props: { text: "Limited offer" } },
      {
        kind: "Heading",
        props: {
          text: "Unlock your full plan.",
          emphasis: "full plan",
          size: "2xl",
          align: "center",
        },
      },
      {
        kind: "PriceCard",
        props: {
          title: "$49 / month",
          subtitle: "First 7 days free",
          bullets: ["All protocols", "Live coach calls", "Cancel any time"],
          variant: "emphasis",
        },
      },
      {
        kind: "SocialProof",
        props: {
          variant: "stats",
          stats: [
            { value: "12,000", label: "active members" },
            { value: "4.8★", label: "App Store" },
            { value: "92%", label: "stick with it" },
          ],
        },
      },
    ],
    footer: [
      {
        kind: "PrimaryCTA",
        props: { label: "Start free trial", action: "external" },
      },
      {
        kind: "Caption",
        props: {
          text: "Cancel any time. We'll remind you 2 days before billing.",
        },
      },
    ],
  },
};

const thankYou: CatalogNode = {
  kind: "Screen",
  props: {
    id: "thanks",
    kind: "intro",
    showProgress: false,
    showBack: false,
    body: [
      { kind: "IconBadge", props: { icon: "check", tone: "olive" } },
      {
        kind: "Heading",
        props: {
          text: "You're all set.",
          emphasis: "all set",
          size: "xl",
          align: "center",
        },
      },
      {
        kind: "Body",
        props: {
          text: "We sent your first session to qa@olive.app. Check your inbox in the next few minutes.",
        },
      },
    ],
    footer: [
      {
        kind: "PrimaryCTA",
        props: { label: "Open inbox", action: "external", href: "mailto:" },
      },
    ],
  },
};

const examples: { label: string; node: CatalogNode }[] = [
  { label: "Example 1 · quiz question screen", node: quizQuestion },
  { label: "Example 2 · quiz result screen", node: quizResult },
  { label: "Example 3 · standalone paywall", node: standalonePaywall },
  { label: "Example 4 · thank-you screen", node: thankYou },
];

export default function CatalogVerificationPage() {
  return (
    <main className="min-h-screen bg-background px-8 py-12">
      <header className="mx-auto mb-10 max-w-[1280px] space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Internal · catalog verification
        </p>
        <h1 className="font-display text-[32px] italic leading-[1.1]">
          The 31 funnel primitives, rendered.
        </h1>
        <p className="font-sans text-[14px] text-muted-foreground">
          Each frame below is one of the four example specs from
          design/CATALOG.md, piped through{" "}
          <code className="font-mono text-[12px]">@json-render/react</code>'s
          Renderer with our catalog registry.
        </p>
      </header>

      <section className="mx-auto grid max-w-[1280px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {examples.map((example) => (
          <figure key={example.label} className="flex flex-col gap-3">
            <figcaption className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              {example.label}
            </figcaption>
            <FunnelRenderer node={example.node} />
          </figure>
        ))}
      </section>
    </main>
  );
}
