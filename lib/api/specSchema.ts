import { z } from "zod";

import { ScreenSchema } from "@/lib/catalog/components/Screen";
import { StackSchema } from "@/lib/catalog/components/Stack";
import { GroupSchema } from "@/lib/catalog/components/Group";
import { SpacerSchema } from "@/lib/catalog/components/Spacer";
import { DividerSchema } from "@/lib/catalog/components/Divider";
import { HeadingSchema } from "@/lib/catalog/components/Heading";
import { BodySchema } from "@/lib/catalog/components/Body";
import { EyebrowSchema } from "@/lib/catalog/components/Eyebrow";
import { CaptionSchema } from "@/lib/catalog/components/Caption";
import { ChoiceListSchema } from "@/lib/catalog/components/ChoiceList";
import { MultiChoiceSchema } from "@/lib/catalog/components/MultiChoice";
import { ImageChoiceGridSchema } from "@/lib/catalog/components/ImageChoiceGrid";
import { ScalePickerSchema } from "@/lib/catalog/components/ScalePicker";
import { ShortTextSchema } from "@/lib/catalog/components/ShortText";
import { LongTextSchema } from "@/lib/catalog/components/LongText";
import { EmailInputSchema } from "@/lib/catalog/components/EmailInput";
import { NumberInputSchema } from "@/lib/catalog/components/NumberInput";
import { ToggleRowSchema } from "@/lib/catalog/components/ToggleRow";
import { PrimaryCTASchema } from "@/lib/catalog/components/PrimaryCTA";
import { SecondaryCTASchema } from "@/lib/catalog/components/SecondaryCTA";
import { ProgressBarSchema } from "@/lib/catalog/components/ProgressBar";
import { BackButtonSchema } from "@/lib/catalog/components/BackButton";
import { ResultBadgeSchema } from "@/lib/catalog/components/ResultBadge";
import { ResultHeroSchema } from "@/lib/catalog/components/ResultHero";
import { PriceCardSchema } from "@/lib/catalog/components/PriceCard";
import { EmailGateSchema } from "@/lib/catalog/components/EmailGate";
import { SocialProofSchema } from "@/lib/catalog/components/SocialProof";
import { DisclosureSchema } from "@/lib/catalog/components/Disclosure";
import { AvatarSchema } from "@/lib/catalog/components/Avatar";
import { IconBadgeSchema } from "@/lib/catalog/components/IconBadge";
import { PoweredFooterSchema } from "@/lib/catalog/components/PoweredFooter";

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
