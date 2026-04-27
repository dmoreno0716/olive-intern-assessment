import type { CatalogNode } from "@/lib/catalog/types";

/**
 * The example "Slow Burn" quiz from design/CATALOG.md, packaged as a
 * top-level array of Screen nodes. Used by the /api/generate stub and
 * the seed script.
 */
export const exampleQuizSpec: CatalogNode[] = [
  {
    kind: "Screen",
    props: {
      id: "intro",
      kind: "intro",
      showProgress: false,
      showBack: false,
      body: [
        { kind: "Eyebrow", props: { text: "Find your protocol" } },
        {
          kind: "Heading",
          props: {
            text: "What kind of energy fits your day?",
            emphasis: "energy",
            size: "2xl",
            align: "start",
          },
        },
        {
          kind: "Body",
          props: {
            text: "Six quick questions. We'll match you to the protocol that fits your rhythm.",
          },
        },
      ],
      footer: [{ kind: "PrimaryCTA", props: { label: "Start" } }],
    },
  },
  {
    kind: "Screen",
    props: {
      id: "stuck-when",
      kind: "question",
      body: [
        { kind: "Eyebrow", props: { text: "1 of 2" } },
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
  },
  {
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
  },
];
