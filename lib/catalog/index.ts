import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";

import { Screen } from "./components/Screen";
import { Stack } from "./components/Stack";
import { Group } from "./components/Group";
import { Spacer } from "./components/Spacer";
import { Divider } from "./components/Divider";
import { Heading } from "./components/Heading";
import { Body } from "./components/Body";
import { Eyebrow } from "./components/Eyebrow";
import { Caption } from "./components/Caption";
import { ChoiceList } from "./components/ChoiceList";
import { MultiChoice } from "./components/MultiChoice";
import { ImageChoiceGrid } from "./components/ImageChoiceGrid";
import { ScalePicker } from "./components/ScalePicker";
import { ShortText } from "./components/ShortText";
import { LongText } from "./components/LongText";
import { EmailInput } from "./components/EmailInput";
import { NumberInput } from "./components/NumberInput";
import { ToggleRow } from "./components/ToggleRow";
import { PrimaryCTA } from "./components/PrimaryCTA";
import { SecondaryCTA } from "./components/SecondaryCTA";
import { ProgressBar } from "./components/ProgressBar";
import { BackButton } from "./components/BackButton";
import { ResultBadge } from "./components/ResultBadge";
import { ResultHero } from "./components/ResultHero";
import { PriceCard } from "./components/PriceCard";
import { EmailGate } from "./components/EmailGate";
import { SocialProof } from "./components/SocialProof";
import { Disclosure } from "./components/Disclosure";
import { Avatar } from "./components/Avatar";
import { IconBadge } from "./components/IconBadge";
import { PoweredFooter } from "./components/PoweredFooter";

import {
  AvatarSchema,
  AvatarDescription,
  BackButtonSchema,
  BackButtonDescription,
  BodySchema,
  BodyDescription,
  CaptionSchema,
  CaptionDescription,
  ChoiceListSchema,
  ChoiceListDescription,
  DisclosureSchema,
  DisclosureDescription,
  DividerSchema,
  DividerDescription,
  EmailGateSchema,
  EmailGateDescription,
  EmailInputSchema,
  EmailInputDescription,
  EyebrowSchema,
  EyebrowDescription,
  GroupSchema,
  GroupDescription,
  HeadingSchema,
  HeadingDescription,
  IconBadgeSchema,
  IconBadgeDescription,
  ImageChoiceGridSchema,
  ImageChoiceGridDescription,
  LongTextSchema,
  LongTextDescription,
  MultiChoiceSchema,
  MultiChoiceDescription,
  NumberInputSchema,
  NumberInputDescription,
  PoweredFooterSchema,
  PoweredFooterDescription,
  PriceCardSchema,
  PriceCardDescription,
  PrimaryCTASchema,
  PrimaryCTADescription,
  ProgressBarSchema,
  ProgressBarDescription,
  ResultBadgeSchema,
  ResultBadgeDescription,
  ResultHeroSchema,
  ResultHeroDescription,
  ScalePickerSchema,
  ScalePickerDescription,
  ScreenSchema,
  ScreenDescription,
  SecondaryCTASchema,
  SecondaryCTADescription,
  ShortTextSchema,
  ShortTextDescription,
  SocialProofSchema,
  SocialProofDescription,
  SpacerSchema,
  SpacerDescription,
  StackSchema,
  StackDescription,
  ToggleRowSchema,
  ToggleRowDescription,
} from "./schemas";

import { registerComponent } from "./render";

// Re-export the server-safe data map so existing imports of
// `lib/catalog` keep working. The actual definition lives in
// `./registry-data` (no "use client" → safe for server contexts like the
// LLM prompt builder).
export { catalogComponents } from "./registry-data";

/**
 * The catalog primitives, registered with @json-render/core's
 * defineCatalog. The schema we register against is @json-render/react's
 * flat-element schema, but our spec format (per design/CATALOG.md) is
 * nested: children live inside props (Screen.body, Stack.children, etc.).
 * The runtime renderer (lib/catalog/render.tsx) walks the nested form
 * directly.
 */
export const catalog = defineCatalog(schema, {
  components: {
    Screen: { props: ScreenSchema, slots: [], description: ScreenDescription },
    Stack: { props: StackSchema, slots: [], description: StackDescription },
    Group: { props: GroupSchema, slots: [], description: GroupDescription },
    Spacer: { props: SpacerSchema, slots: [], description: SpacerDescription },
    Divider: { props: DividerSchema, slots: [], description: DividerDescription },
    Heading: { props: HeadingSchema, slots: [], description: HeadingDescription },
    Body: { props: BodySchema, slots: [], description: BodyDescription },
    Eyebrow: { props: EyebrowSchema, slots: [], description: EyebrowDescription },
    Caption: { props: CaptionSchema, slots: [], description: CaptionDescription },
    ChoiceList: { props: ChoiceListSchema, slots: [], description: ChoiceListDescription },
    MultiChoice: { props: MultiChoiceSchema, slots: [], description: MultiChoiceDescription },
    ImageChoiceGrid: { props: ImageChoiceGridSchema, slots: [], description: ImageChoiceGridDescription },
    ScalePicker: { props: ScalePickerSchema, slots: [], description: ScalePickerDescription },
    ShortText: { props: ShortTextSchema, slots: [], description: ShortTextDescription },
    LongText: { props: LongTextSchema, slots: [], description: LongTextDescription },
    EmailInput: { props: EmailInputSchema, slots: [], description: EmailInputDescription },
    NumberInput: { props: NumberInputSchema, slots: [], description: NumberInputDescription },
    ToggleRow: { props: ToggleRowSchema, slots: [], description: ToggleRowDescription },
    PrimaryCTA: { props: PrimaryCTASchema, slots: [], description: PrimaryCTADescription },
    SecondaryCTA: { props: SecondaryCTASchema, slots: [], description: SecondaryCTADescription },
    ProgressBar: { props: ProgressBarSchema, slots: [], description: ProgressBarDescription },
    BackButton: { props: BackButtonSchema, slots: [], description: BackButtonDescription },
    ResultBadge: { props: ResultBadgeSchema, slots: [], description: ResultBadgeDescription },
    ResultHero: { props: ResultHeroSchema, slots: [], description: ResultHeroDescription },
    PriceCard: { props: PriceCardSchema, slots: [], description: PriceCardDescription },
    EmailGate: { props: EmailGateSchema, slots: [], description: EmailGateDescription },
    SocialProof: { props: SocialProofSchema, slots: [], description: SocialProofDescription },
    Disclosure: { props: DisclosureSchema, slots: [], description: DisclosureDescription },
    Avatar: { props: AvatarSchema, slots: [], description: AvatarDescription },
    IconBadge: { props: IconBadgeSchema, slots: [], description: IconBadgeDescription },
    PoweredFooter: { props: PoweredFooterSchema, slots: [], description: PoweredFooterDescription },
  },
  actions: {},
});

/**
 * Populate the runtime registry consumed by `renderNode` /
 * `<Children>`. The catalog above is the LLM contract; this map is the
 * physical wiring used by our recursive renderer.
 */
registerComponent("Screen", Screen);
registerComponent("Stack", Stack);
registerComponent("Group", Group);
registerComponent("Spacer", Spacer);
registerComponent("Divider", Divider);
registerComponent("Heading", Heading);
registerComponent("Body", Body);
registerComponent("Eyebrow", Eyebrow);
registerComponent("Caption", Caption);
registerComponent("ChoiceList", ChoiceList);
registerComponent("MultiChoice", MultiChoice);
registerComponent("ImageChoiceGrid", ImageChoiceGrid);
registerComponent("ScalePicker", ScalePicker);
registerComponent("ShortText", ShortText);
registerComponent("LongText", LongText);
registerComponent("EmailInput", EmailInput);
registerComponent("NumberInput", NumberInput);
registerComponent("ToggleRow", ToggleRow);
registerComponent("PrimaryCTA", PrimaryCTA);
registerComponent("SecondaryCTA", SecondaryCTA);
registerComponent("ProgressBar", ProgressBar);
registerComponent("BackButton", BackButton);
registerComponent("ResultBadge", ResultBadge);
registerComponent("ResultHero", ResultHero);
registerComponent("PriceCard", PriceCard);
registerComponent("EmailGate", EmailGate);
registerComponent("SocialProof", SocialProof);
registerComponent("Disclosure", Disclosure);
registerComponent("Avatar", Avatar);
registerComponent("IconBadge", IconBadge);
registerComponent("PoweredFooter", PoweredFooter);
