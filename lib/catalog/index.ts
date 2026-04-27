import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";

import { Screen, ScreenSchema, ScreenDescription } from "./components/Screen";
import { Stack, StackSchema, StackDescription } from "./components/Stack";
import { Group, GroupSchema, GroupDescription } from "./components/Group";
import { Spacer, SpacerSchema, SpacerDescription } from "./components/Spacer";
import { Divider, DividerSchema, DividerDescription } from "./components/Divider";
import { Heading, HeadingSchema, HeadingDescription } from "./components/Heading";
import { Body, BodySchema, BodyDescription } from "./components/Body";
import { Eyebrow, EyebrowSchema, EyebrowDescription } from "./components/Eyebrow";
import { Caption, CaptionSchema, CaptionDescription } from "./components/Caption";
import { ChoiceList, ChoiceListSchema, ChoiceListDescription } from "./components/ChoiceList";
import { MultiChoice, MultiChoiceSchema, MultiChoiceDescription } from "./components/MultiChoice";
import { ImageChoiceGrid, ImageChoiceGridSchema, ImageChoiceGridDescription } from "./components/ImageChoiceGrid";
import { ScalePicker, ScalePickerSchema, ScalePickerDescription } from "./components/ScalePicker";
import { ShortText, ShortTextSchema, ShortTextDescription } from "./components/ShortText";
import { LongText, LongTextSchema, LongTextDescription } from "./components/LongText";
import { EmailInput, EmailInputSchema, EmailInputDescription } from "./components/EmailInput";
import { NumberInput, NumberInputSchema, NumberInputDescription } from "./components/NumberInput";
import { ToggleRow, ToggleRowSchema, ToggleRowDescription } from "./components/ToggleRow";
import { PrimaryCTA, PrimaryCTASchema, PrimaryCTADescription } from "./components/PrimaryCTA";
import { SecondaryCTA, SecondaryCTASchema, SecondaryCTADescription } from "./components/SecondaryCTA";
import { ProgressBar, ProgressBarSchema, ProgressBarDescription } from "./components/ProgressBar";
import { BackButton, BackButtonSchema, BackButtonDescription } from "./components/BackButton";
import { ResultBadge, ResultBadgeSchema, ResultBadgeDescription } from "./components/ResultBadge";
import { ResultHero, ResultHeroSchema, ResultHeroDescription } from "./components/ResultHero";
import { PriceCard, PriceCardSchema, PriceCardDescription } from "./components/PriceCard";
import { EmailGate, EmailGateSchema, EmailGateDescription } from "./components/EmailGate";
import { SocialProof, SocialProofSchema, SocialProofDescription } from "./components/SocialProof";
import { Disclosure, DisclosureSchema, DisclosureDescription } from "./components/Disclosure";
import { Avatar, AvatarSchema, AvatarDescription } from "./components/Avatar";
import { IconBadge, IconBadgeSchema, IconBadgeDescription } from "./components/IconBadge";
import { PoweredFooter, PoweredFooterSchema, PoweredFooterDescription } from "./components/PoweredFooter";

import { registerComponent } from "./render";

/**
 * The 31 catalog primitives, registered with @json-render/core's
 * defineCatalog. Each entry carries the Zod props schema and an
 * LLM-facing description string.
 *
 * The schema we register against is @json-render/react's flat-element
 * schema, but our spec format (per design/CATALOG.md) is nested:
 * children live inside props (Screen.body, Stack.children, etc.).
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
