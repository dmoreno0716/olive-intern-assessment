import { z } from "zod";

import {
  AvatarSchema,
  BackButtonSchema,
  BodySchema,
  CaptionSchema,
  ChoiceListSchema,
  DisclosureSchema,
  DividerSchema,
  EmailGateSchema,
  EmailInputSchema,
  EyebrowSchema,
  GroupSchema,
  HeadingSchema,
  IconBadgeSchema,
  ImageChoiceGridSchema,
  LongTextSchema,
  MultiChoiceSchema,
  NumberInputSchema,
  PoweredFooterSchema,
  PriceCardSchema,
  PrimaryCTASchema,
  ProgressBarSchema,
  ResultBadgeSchema,
  ResultHeroSchema,
  ScalePickerSchema,
  ScreenSchema,
  SecondaryCTASchema,
  ShortTextSchema,
  SocialProofSchema,
  SpacerSchema,
  StackSchema,
  ToggleRowSchema,
} from "@/lib/catalog/schemas";

const kindSchemas: Record<string, z.ZodTypeAny> = {
  Screen: ScreenSchema,
  Stack: StackSchema,
  Group: GroupSchema,
  Spacer: SpacerSchema,
  Divider: DividerSchema,
  Heading: HeadingSchema,
  Body: BodySchema,
  Eyebrow: EyebrowSchema,
  Caption: CaptionSchema,
  ChoiceList: ChoiceListSchema,
  MultiChoice: MultiChoiceSchema,
  ImageChoiceGrid: ImageChoiceGridSchema,
  ScalePicker: ScalePickerSchema,
  ShortText: ShortTextSchema,
  LongText: LongTextSchema,
  EmailInput: EmailInputSchema,
  NumberInput: NumberInputSchema,
  ToggleRow: ToggleRowSchema,
  PrimaryCTA: PrimaryCTASchema,
  SecondaryCTA: SecondaryCTASchema,
  ProgressBar: ProgressBarSchema,
  BackButton: BackButtonSchema,
  ResultBadge: ResultBadgeSchema,
  ResultHero: ResultHeroSchema,
  PriceCard: PriceCardSchema,
  EmailGate: EmailGateSchema,
  SocialProof: SocialProofSchema,
  Disclosure: DisclosureSchema,
  Avatar: AvatarSchema,
  IconBadge: IconBadgeSchema,
  PoweredFooter: PoweredFooterSchema,
};

export const KNOWN_KINDS = Object.keys(kindSchemas);

const CHILD_KEYS = ["body", "footer", "children"] as const;

export type SpecIssue = { path: string; message: string };

/**
 * Validate a single catalog node against its schema, then recurse into
 * any known child-array keys (body / footer / children). Returns a flat
 * list of issues; empty array means valid.
 */
function validateNode(
  node: unknown,
  path: string,
  issues: SpecIssue[],
): void {
  if (!node || typeof node !== "object") {
    issues.push({ path, message: "Node must be an object" });
    return;
  }
  const n = node as { kind?: unknown; props?: unknown };
  if (typeof n.kind !== "string") {
    issues.push({ path: `${path}.kind`, message: "Missing or non-string kind" });
    return;
  }
  const schema = kindSchemas[n.kind];
  if (!schema) {
    issues.push({ path: `${path}.kind`, message: `Unknown kind: ${n.kind}` });
    return;
  }
  const props = n.props ?? {};
  const result = schema.safeParse(props);
  if (!result.success) {
    for (const issue of result.error.issues) {
      issues.push({
        path: `${path}.props.${issue.path.join(".")}`,
        message: issue.message,
      });
    }
    return;
  }
  const validatedProps = result.data as Record<string, unknown>;
  for (const key of CHILD_KEYS) {
    const children = validatedProps[key];
    if (Array.isArray(children)) {
      children.forEach((child, i) =>
        validateNode(child, `${path}.props.${key}[${i}]`, issues),
      );
    }
  }
}

/**
 * A funnel variant's spec is the top-level array of Screen nodes (per
 * design/CATALOG.md §"Composition rules summary"). Anything else is
 * rejected at the top level; nested kinds are walked recursively.
 */
export const SpecSchema = z.array(z.unknown()).superRefine((arr, ctx) => {
  const issues: SpecIssue[] = [];
  arr.forEach((node, i) => {
    const n = node as { kind?: unknown };
    if (n?.kind !== "Screen") {
      issues.push({
        path: `[${i}].kind`,
        message: `Top-level nodes must be Screen, got ${String(n?.kind)}`,
      });
      return;
    }
    validateNode(node, `[${i}]`, issues);
  });
  for (const issue of issues) {
    ctx.addIssue({
      code: "custom",
      path: issue.path.split("."),
      message: issue.message,
    });
  }
});
