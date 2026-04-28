import type { CatalogNode } from "@/lib/catalog/types";

export type ScreenTemplate = {
  id: string;
  label: string;
  description: string;
  kind: "intro" | "question" | "gate" | "result" | "custom";
  build(): CatalogNode;
};

/** Starter Screen templates surfaced by the Add-screen picker. The
 * creator can refine details inline or via chat after inserting. */
export const SCREEN_TEMPLATES: ScreenTemplate[] = [
  {
    id: "intro",
    label: "Intro",
    description: "Hook + start CTA.",
    kind: "intro",
    build: () => ({
      kind: "Screen",
      props: {
        id: "intro",
        kind: "intro",
        showProgress: false,
        showBack: false,
        body: [
          { kind: "Eyebrow", props: { text: "New screen" } },
          {
            kind: "Heading",
            props: {
              text: "Welcome to Olive.",
              emphasis: "Olive",
              size: "2xl",
            },
          },
          {
            kind: "Body",
            props: {
              text: "A short intro paragraph the creator can edit.",
            },
          },
        ],
        footer: [
          { kind: "PrimaryCTA", props: { label: "Start" } },
        ],
      },
    }),
  },
  {
    id: "question",
    label: "Question",
    description: "Single-select with a heading.",
    kind: "question",
    build: () => ({
      kind: "Screen",
      props: {
        id: "question",
        kind: "question",
        body: [
          { kind: "Eyebrow", props: { text: "Question" } },
          {
            kind: "Heading",
            props: { text: "What's your goal?", size: "2xl" },
          },
          {
            kind: "ChoiceList",
            props: {
              field: "goal",
              options: [
                { value: "energy", label: "More energy" },
                { value: "calm", label: "Less stress" },
                { value: "focus", label: "Sharper focus" },
              ],
            },
          },
        ],
        footer: [{ kind: "PrimaryCTA", props: { label: "Continue" } }],
      },
    }),
  },
  {
    id: "gate",
    label: "Email gate",
    description: "Capture an email before the result.",
    kind: "gate",
    build: () => ({
      kind: "Screen",
      props: {
        id: "gate",
        kind: "gate",
        body: [
          { kind: "Eyebrow", props: { text: "Almost there" } },
          {
            kind: "Heading",
            props: {
              text: "Where should we send your result?",
              size: "2xl",
            },
          },
          {
            kind: "EmailGate",
            props: {
              field: "email",
              cta: "Show my result",
              privacyNote: "We never share your email.",
            },
          },
        ],
      },
    }),
  },
  {
    id: "result",
    label: "Result",
    description: "Reveal page with a tagline.",
    kind: "result",
    build: () => ({
      kind: "Screen",
      props: {
        id: "result",
        kind: "result",
        body: [
          { kind: "ResultBadge", props: { label: "Your match" } },
          {
            kind: "ResultHero",
            props: {
              resultName: "The Slow Burn Eater",
              emphasis: "Slow Burn",
              tagline: "You build energy with steady rituals.",
            },
          },
          {
            kind: "Body",
            props: {
              text: "Edit this paragraph to describe the result in more detail.",
            },
          },
        ],
        footer: [
          {
            kind: "PrimaryCTA",
            props: { label: "See my plan", action: "external" },
          },
        ],
      },
    }),
  },
  {
    id: "thanks",
    label: "Thanks",
    description: "Closing screen with social proof.",
    kind: "custom",
    build: () => ({
      kind: "Screen",
      props: {
        id: "thanks",
        kind: "custom",
        body: [
          {
            kind: "Heading",
            props: { text: "Thanks for sharing.", size: "2xl" },
          },
          {
            kind: "Body",
            props: { text: "We read every response." },
          },
          {
            kind: "SocialProof",
            props: {
              variant: "stats",
              stats: [
                { value: "12k", label: "Olive members" },
                { value: "94%", label: "would recommend" },
              ],
            },
          },
        ],
      },
    }),
  },
];
