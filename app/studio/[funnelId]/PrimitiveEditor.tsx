"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import type { ZodTypeAny } from "zod";
import type { CatalogNode } from "@/lib/catalog/types";
import {
  AvatarSchema,
  BodySchema,
  CaptionSchema,
  ChoiceListSchema,
  DisclosureSchema,
  EmailGateSchema,
  EmailInputSchema,
  EyebrowSchema,
  HeadingSchema,
  IconBadgeSchema,
  ImageChoiceGridSchema,
  LongTextSchema,
  MultiChoiceSchema,
  NumberInputSchema,
  PriceCardSchema,
  PrimaryCTASchema,
  ResultBadgeSchema,
  ResultHeroSchema,
  ScalePickerSchema,
  SecondaryCTASchema,
  ShortTextSchema,
  SocialProofSchema,
  ToggleRowSchema,
} from "@/lib/catalog/schemas";
import { patchPrimitiveProps } from "@/lib/studio/specOps";
import { Field, Section, Empty } from "./SpecEditor";

type Props = {
  node: CatalogNode;
  onChange: (next: CatalogNode) => void;
};

/**
 * Inline editor for a single primitive inside Screen.body or .footer.
 * Switches on `node.kind` to render the right field set, validates each
 * patched node against its Zod schema, and surfaces any field-level
 * errors below the input.
 */
export function PrimitiveEditor({ node, onChange }: Props) {
  const kind = node.kind;
  const props = (node.props ?? {}) as Record<string, unknown>;

  const schema = SCHEMA_BY_KIND[kind];
  const issues = useMemo(() => {
    if (!schema) return new Map<string, string>();
    const result = schema.safeParse(props);
    if (result.success) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const i of result.error.issues) {
      map.set(i.path.join("."), i.message);
    }
    return map;
  }, [schema, props]);

  const set = (patch: Record<string, unknown>) => onChange(patchPrimitiveProps(node, patch));

  const wrap = (children: React.ReactNode, summary?: string) => (
    <div className="rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-2.5 py-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.04em] text-[var(--olive-700)]">
          {kind}
        </span>
        {summary && (
          <span className="truncate text-[11px] text-[var(--text-faint)]">
            {summary}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );

  const err = (path: string) => issues.get(path);

  /* ---- Typography ---- */
  if (kind === "Heading") {
    const text = (props.text as string) ?? "";
    const emphasis = (props.emphasis as string | undefined) ?? "";
    const size = (props.size as string) ?? "xl";
    const align = (props.align as string) ?? "start";
    return wrap(
      <>
        <Field label="Text">
          <Textarea
            value={text}
            onChange={(v) => set({ text: v })}
            error={err("text")}
            rows={2}
          />
        </Field>
        <Field label="Emphasis (italicized substring)">
          <Input
            value={emphasis}
            onChange={(v) => set({ emphasis: v || undefined })}
            error={err("emphasis")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Size">
            <Select
              value={size}
              options={["sm", "md", "lg", "xl", "2xl", "3xl"]}
              onChange={(v) => set({ size: v })}
            />
          </Field>
          <Field label="Align">
            <Select
              value={align}
              options={["start", "center"]}
              onChange={(v) => set({ align: v })}
            />
          </Field>
        </div>
      </>,
      text,
    );
  }

  if (kind === "Body") {
    const text = (props.text as string) ?? "";
    return wrap(
      <>
        <Field label="Text">
          <Textarea
            value={text}
            onChange={(v) => set({ text: v })}
            error={err("text")}
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Size">
            <Select
              value={(props.size as string) ?? "md"}
              options={["sm", "md", "lg"]}
              onChange={(v) => set({ size: v })}
            />
          </Field>
          <Field label="Tone">
            <Select
              value={(props.tone as string) ?? "default"}
              options={["default", "muted"]}
              onChange={(v) => set({ tone: v })}
            />
          </Field>
        </div>
      </>,
      text,
    );
  }

  if (kind === "Eyebrow") {
    const text = (props.text as string) ?? "";
    return wrap(
      <>
        <Field label="Text">
          <Input
            value={text}
            onChange={(v) => set({ text: v })}
            error={err("text")}
          />
        </Field>
        <Field label="Tone">
          <Select
            value={(props.tone as string) ?? "default"}
            options={["default", "accent"]}
            onChange={(v) => set({ tone: v })}
          />
        </Field>
      </>,
      text,
    );
  }

  if (kind === "Caption") {
    const text = (props.text as string) ?? "";
    return wrap(
      <Field label="Text">
        <Input
          value={text}
          onChange={(v) => set({ text: v })}
          error={err("text")}
        />
      </Field>,
      text,
    );
  }

  /* ---- Answer primitives ---- */
  if (kind === "ChoiceList" || kind === "MultiChoice") {
    const field = (props.field as string) ?? "";
    const options = ((props.options as { value: string; label: string; description?: string }[]) ?? []);
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={field}
            onChange={(v) => set({ field: v })}
            error={err("field")}
            mono
          />
        </Field>
        <OptionsEditor
          options={options}
          onChange={(next) => set({ options: next })}
        />
        {kind === "MultiChoice" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min">
              <NumberField
                value={(props.min as number) ?? 0}
                onChange={(v) => set({ min: v })}
              />
            </Field>
            <Field label="Max (optional)">
              <NumberField
                value={(props.max as number | undefined) ?? null}
                onChange={(v) => set({ max: v ?? undefined })}
                allowNull
              />
            </Field>
          </div>
        )}
      </>,
      `${options.length} option${options.length === 1 ? "" : "s"}`,
    );
  }

  if (kind === "ImageChoiceGrid") {
    const field = (props.field as string) ?? "";
    const options = ((props.options as { value: string; label: string; image: string }[]) ?? []);
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={field}
            onChange={(v) => set({ field: v })}
            error={err("field")}
            mono
          />
        </Field>
        <Field label="Columns">
          <Select
            value={(props.cols as string) ?? "2"}
            options={["2", "3"]}
            onChange={(v) => set({ cols: v })}
          />
        </Field>
        <ImageOptionsEditor
          options={options}
          onChange={(next) => set({ options: next })}
        />
      </>,
      `${options.length} image option${options.length === 1 ? "" : "s"}`,
    );
  }

  if (kind === "ScalePicker") {
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={(props.field as string) ?? ""}
            onChange={(v) => set({ field: v })}
            mono
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min">
            <NumberField
              value={(props.min as number) ?? 1}
              onChange={(v) => set({ min: v })}
            />
          </Field>
          <Field label="Max">
            <NumberField
              value={(props.max as number) ?? 5}
              onChange={(v) => set({ max: v })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min label">
            <Input
              value={(props.minLabel as string) ?? ""}
              onChange={(v) => set({ minLabel: v || undefined })}
            />
          </Field>
          <Field label="Max label">
            <Input
              value={(props.maxLabel as string) ?? ""}
              onChange={(v) => set({ maxLabel: v || undefined })}
            />
          </Field>
        </div>
      </>,
      `${props.min ?? "?"}–${props.max ?? "?"}`,
    );
  }

  if (kind === "ShortText" || kind === "LongText") {
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={(props.field as string) ?? ""}
            onChange={(v) => set({ field: v })}
            mono
          />
        </Field>
        <Field label="Placeholder">
          <Input
            value={(props.placeholder as string) ?? ""}
            onChange={(v) => set({ placeholder: v || undefined })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          {kind === "LongText" && (
            <Field label="Rows">
              <NumberField
                value={(props.rows as number) ?? 4}
                onChange={(v) => set({ rows: v })}
              />
            </Field>
          )}
          <Field label="Max length">
            <NumberField
              value={(props.maxLength as number | undefined) ?? null}
              onChange={(v) => set({ maxLength: v ?? undefined })}
              allowNull
            />
          </Field>
        </div>
      </>,
    );
  }

  if (kind === "EmailInput") {
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={(props.field as string) ?? "email"}
            onChange={(v) => set({ field: v })}
            mono
          />
        </Field>
        <Field label="Placeholder">
          <Input
            value={(props.placeholder as string) ?? ""}
            onChange={(v) => set({ placeholder: v })}
          />
        </Field>
      </>,
    );
  }

  if (kind === "NumberInput") {
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={(props.field as string) ?? ""}
            onChange={(v) => set({ field: v })}
            mono
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Min">
            <NumberField
              value={(props.min as number | undefined) ?? null}
              onChange={(v) => set({ min: v ?? undefined })}
              allowNull
            />
          </Field>
          <Field label="Max">
            <NumberField
              value={(props.max as number | undefined) ?? null}
              onChange={(v) => set({ max: v ?? undefined })}
              allowNull
            />
          </Field>
          <Field label="Step">
            <NumberField
              value={(props.step as number) ?? 1}
              onChange={(v) => set({ step: v })}
            />
          </Field>
        </div>
        <Field label="Unit">
          <Input
            value={(props.unit as string) ?? ""}
            onChange={(v) => set({ unit: v || undefined })}
          />
        </Field>
      </>,
    );
  }

  if (kind === "ToggleRow") {
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={(props.field as string) ?? ""}
            onChange={(v) => set({ field: v })}
            mono
          />
        </Field>
        <Field label="Label">
          <Input
            value={(props.label as string) ?? ""}
            onChange={(v) => set({ label: v })}
            error={err("label")}
          />
        </Field>
        <Field label="Description">
          <Input
            value={(props.description as string) ?? ""}
            onChange={(v) => set({ description: v || undefined })}
          />
        </Field>
      </>,
      (props.label as string) ?? "",
    );
  }

  /* ---- CTA ---- */
  if (kind === "PrimaryCTA") {
    return wrap(
      <>
        <Field label="Label">
          <Input
            value={(props.label as string) ?? ""}
            onChange={(v) => set({ label: v })}
            error={err("label")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Action">
            <Select
              value={(props.action as string) ?? "next"}
              options={["next", "submit", "external"]}
              onChange={(v) => set({ action: v })}
            />
          </Field>
          <Field label="Href (external)">
            <Input
              value={(props.href as string) ?? ""}
              onChange={(v) => set({ href: v || undefined })}
            />
          </Field>
        </div>
      </>,
      (props.label as string) ?? "",
    );
  }

  if (kind === "SecondaryCTA") {
    return wrap(
      <>
        <Field label="Label">
          <Input
            value={(props.label as string) ?? ""}
            onChange={(v) => set({ label: v })}
            error={err("label")}
          />
        </Field>
        <Field label="Action">
          <Select
            value={(props.action as string) ?? "skip"}
            options={["skip", "back", "external", "share"]}
            onChange={(v) => set({ action: v })}
          />
        </Field>
        {(props.action as string) === "share" && (
          <>
            <Field label="Share text">
              <Input
                value={(props.shareText as string) ?? ""}
                onChange={(v) => set({ shareText: v || undefined })}
              />
            </Field>
            <Field label="Share URL">
              <Input
                value={(props.shareUrl as string) ?? ""}
                onChange={(v) => set({ shareUrl: v || undefined })}
              />
            </Field>
          </>
        )}
      </>,
      (props.label as string) ?? "",
    );
  }

  /* ---- Result + conversion ---- */
  if (kind === "ResultBadge") {
    return wrap(
      <Field label="Label">
        <Input
          value={(props.label as string) ?? ""}
          onChange={(v) => set({ label: v })}
          error={err("label")}
        />
      </Field>,
      (props.label as string) ?? "",
    );
  }

  if (kind === "ResultHero") {
    return wrap(
      <>
        <Field label="Result name">
          <Input
            value={(props.resultName as string) ?? ""}
            onChange={(v) => set({ resultName: v })}
            error={err("resultName")}
          />
        </Field>
        <Field label="Emphasis">
          <Input
            value={(props.emphasis as string) ?? ""}
            onChange={(v) => set({ emphasis: v || undefined })}
          />
        </Field>
        <Field label="Tagline">
          <Textarea
            value={(props.tagline as string) ?? ""}
            onChange={(v) => set({ tagline: v })}
            error={err("tagline")}
            rows={2}
          />
        </Field>
      </>,
      (props.resultName as string) ?? "",
    );
  }

  if (kind === "PriceCard") {
    const bullets = (props.bullets as string[] | undefined) ?? [];
    return wrap(
      <>
        <Field label="Title">
          <Input
            value={(props.title as string) ?? ""}
            onChange={(v) => set({ title: v })}
            error={err("title")}
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={(props.subtitle as string) ?? ""}
            onChange={(v) => set({ subtitle: v || undefined })}
          />
        </Field>
        <Field label="Variant">
          <Select
            value={(props.variant as string) ?? "default"}
            options={["default", "emphasis"]}
            onChange={(v) => set({ variant: v })}
          />
        </Field>
        <BulletsEditor
          bullets={bullets}
          onChange={(next) => set({ bullets: next })}
        />
      </>,
      (props.title as string) ?? "",
    );
  }

  if (kind === "EmailGate") {
    return wrap(
      <>
        <Field label="Field key">
          <Input
            value={(props.field as string) ?? "email"}
            onChange={(v) => set({ field: v })}
            mono
          />
        </Field>
        <Field label="CTA label">
          <Input
            value={(props.cta as string) ?? ""}
            onChange={(v) => set({ cta: v })}
          />
        </Field>
        <Field label="Privacy note">
          <Input
            value={(props.privacyNote as string) ?? ""}
            onChange={(v) => set({ privacyNote: v || undefined })}
          />
        </Field>
      </>,
    );
  }

  if (kind === "SocialProof") {
    const variant = (props.variant as string) ?? "stats";
    return wrap(
      <>
        <Field label="Variant">
          <Select
            value={variant}
            options={["stats", "testimonial"]}
            onChange={(v) => set({ variant: v })}
          />
        </Field>
        {variant === "stats" ? (
          <StatsEditor
            stats={(props.stats as { value: string; label: string }[] | undefined) ?? []}
            onChange={(next) => set({ stats: next })}
          />
        ) : (
          <>
            <Field label="Quote">
              <Textarea
                value={(props.testimonial as { quote?: string } | undefined)?.quote ?? ""}
                onChange={(v) =>
                  set({
                    testimonial: {
                      ...((props.testimonial as object | undefined) ?? {}),
                      quote: v,
                    },
                  })
                }
                rows={3}
              />
            </Field>
            <Field label="Author">
              <Input
                value={(props.testimonial as { author?: string } | undefined)?.author ?? ""}
                onChange={(v) =>
                  set({
                    testimonial: {
                      ...((props.testimonial as object | undefined) ?? {}),
                      author: v,
                    },
                  })
                }
              />
            </Field>
          </>
        )}
      </>,
    );
  }

  if (kind === "Disclosure") {
    return wrap(
      <>
        <Field label="Summary">
          <Input
            value={(props.summary as string) ?? ""}
            onChange={(v) => set({ summary: v })}
            error={err("summary")}
          />
        </Field>
        <Field label="Details">
          <Textarea
            value={(props.details as string) ?? ""}
            onChange={(v) => set({ details: v })}
            error={err("details")}
            rows={3}
          />
        </Field>
      </>,
      (props.summary as string) ?? "",
    );
  }

  if (kind === "IconBadge") {
    return wrap(
      <>
        <Field label="Lucide icon name">
          <Input
            value={(props.icon as string) ?? ""}
            onChange={(v) => set({ icon: v })}
            mono
          />
        </Field>
        <Field label="Tone">
          <Select
            value={(props.tone as string) ?? "olive"}
            options={["olive", "cream", "accent"]}
            onChange={(v) => set({ tone: v })}
          />
        </Field>
      </>,
    );
  }

  if (kind === "Avatar") {
    return wrap(
      <>
        <Field label="Image URL">
          <Input
            value={(props.src as string) ?? ""}
            onChange={(v) => set({ src: v })}
            error={err("src")}
            mono
          />
        </Field>
        <Field label="Size">
          <Select
            value={(props.size as string) ?? "md"}
            options={["sm", "md", "lg", "xl"]}
            onChange={(v) => set({ size: v })}
          />
        </Field>
        <Field label="Fallback initials">
          <Input
            value={(props.fallback as string) ?? ""}
            onChange={(v) => set({ fallback: v || undefined })}
          />
        </Field>
      </>,
    );
  }

  /* ---- Layout containers — visible but no fields ---- */
  if (kind === "Stack" || kind === "Group" || kind === "Spacer" || kind === "Divider" || kind === "ProgressBar" || kind === "BackButton" || kind === "PoweredFooter") {
    return wrap(<Empty>No editable fields. Use chat refinement to restructure.</Empty>);
  }

  return wrap(<Empty>Unknown kind &mdash; edits unavailable.</Empty>);
}

const SCHEMA_BY_KIND: Record<string, ZodTypeAny> = {
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
  ResultBadge: ResultBadgeSchema,
  ResultHero: ResultHeroSchema,
  PriceCard: PriceCardSchema,
  EmailGate: EmailGateSchema,
  SocialProof: SocialProofSchema,
  Disclosure: DisclosureSchema,
  Avatar: AvatarSchema,
  IconBadge: IconBadgeSchema,
};

/* ============================ Inputs ============================ */

function Input({
  value,
  onChange,
  error,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  mono?: boolean;
}) {
  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 ${
          mono ? "font-mono text-[12px]" : "font-sans text-[12.5px]"
        } text-[var(--text)] outline-none focus:border-[var(--olive-700)] ${
          error ? "border-[var(--error)]" : "border-[var(--border-c)]"
        }`}
      />
      {error && <ErrorLine>{error}</ErrorLine>}
    </>
  );
}

function Textarea({
  value,
  onChange,
  error,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
}) {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full resize-y rounded-[6px] border bg-[var(--surface)] px-2 py-1.5 font-sans text-[12.5px] leading-snug text-[var(--text)] outline-none focus:border-[var(--olive-700)] ${
          error ? "border-[var(--error)]" : "border-[var(--border-c)]"
        }`}
      />
      {error && <ErrorLine>{error}</ErrorLine>}
    </>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-sans text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function NumberField({
  value,
  onChange,
  allowNull,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  allowNull?: boolean;
}) {
  return (
    <input
      type="number"
      value={value === null || value === undefined ? "" : value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") {
          if (allowNull) onChange(null);
          return;
        }
        const n = Number(v);
        if (Number.isFinite(n)) onChange(n);
      }}
      className="w-full rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
    />
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] text-[var(--error)]">{children}</span>
  );
}

/* ============================ Composite editors ============================ */

function OptionsEditor({
  options,
  onChange,
}: {
  options: { value: string; label: string; description?: string }[];
  onChange: (
    next: { value: string; label: string; description?: string }[],
  ) => void;
}) {
  const update = (i: number, patch: Partial<(typeof options)[number]>) => {
    const out = options.slice();
    out[i] = { ...out[i]!, ...patch };
    onChange(out);
  };
  const remove = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const add = () => {
    const n = options.length + 1;
    onChange([
      ...options,
      { value: `option-${n}`, label: `Option ${n}` },
    ]);
  };
  return (
    <Section title="Options">
      {options.map((o, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_22px] items-center gap-1.5 rounded-[6px] bg-[var(--surface-2)] p-1.5"
        >
          <Input
            value={o.label}
            onChange={(v) => update(i, { label: v })}
          />
          <input
            value={o.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value"
            className="w-full rounded-[5px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="grid h-[22px] w-[22px] place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface)] hover:text-[var(--error)]"
            aria-label="Remove option"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 inline-flex items-center justify-center gap-1 rounded-[6px] border border-dashed border-[var(--border-strong)] bg-transparent px-2 py-1 text-[11.5px] text-[var(--text-mute)] hover:border-[var(--olive-700)] hover:text-[var(--olive-700)]"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
        Add option
      </button>
    </Section>
  );
}

function ImageOptionsEditor({
  options,
  onChange,
}: {
  options: { value: string; label: string; image: string }[];
  onChange: (next: { value: string; label: string; image: string }[]) => void;
}) {
  const update = (i: number, patch: Partial<(typeof options)[number]>) => {
    const out = options.slice();
    out[i] = { ...out[i]!, ...patch };
    onChange(out);
  };
  const remove = (i: number) => onChange(options.filter((_, idx) => idx !== i));
  const add = () => {
    const n = options.length + 1;
    onChange([
      ...options,
      { value: `option-${n}`, label: `Option ${n}`, image: "https://" },
    ]);
  };
  return (
    <Section title="Image options">
      {options.map((o, i) => (
        <div
          key={i}
          className="flex flex-col gap-1.5 rounded-[6px] bg-[var(--surface-2)] p-1.5"
        >
          <Input value={o.label} onChange={(v) => update(i, { label: v })} />
          <input
            value={o.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value"
            className="w-full rounded-[5px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
          />
          <input
            value={o.image}
            onChange={(e) => update(i, { image: e.target.value })}
            placeholder="https://image.url"
            className="w-full rounded-[5px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="self-start text-[11px] text-[var(--text-mute)] hover:text-[var(--error)]"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 inline-flex items-center justify-center gap-1 rounded-[6px] border border-dashed border-[var(--border-strong)] bg-transparent px-2 py-1 text-[11.5px] text-[var(--text-mute)] hover:border-[var(--olive-700)] hover:text-[var(--olive-700)]"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
        Add option
      </button>
    </Section>
  );
}

function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (next: string[]) => void;
}) {
  const update = (i: number, v: string) => {
    const out = bullets.slice();
    out[i] = v;
    onChange(out);
  };
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));
  const add = () => onChange([...bullets, ""]);
  return (
    <Section title="Bullets">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input value={b} onChange={(v) => update(i, v)} />
          <button
            type="button"
            onClick={() => remove(i)}
            className="grid h-[22px] w-[22px] place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface-2)] hover:text-[var(--error)]"
            aria-label="Remove bullet"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center justify-center gap-1 rounded-[6px] border border-dashed border-[var(--border-strong)] bg-transparent px-2 py-1 text-[11.5px] text-[var(--text-mute)] hover:border-[var(--olive-700)] hover:text-[var(--olive-700)]"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
        Add bullet
      </button>
    </Section>
  );
}

function StatsEditor({
  stats,
  onChange,
}: {
  stats: { value: string; label: string }[];
  onChange: (next: { value: string; label: string }[]) => void;
}) {
  const update = (i: number, patch: Partial<(typeof stats)[number]>) => {
    const out = stats.slice();
    out[i] = { ...out[i]!, ...patch };
    onChange(out);
  };
  const remove = (i: number) => onChange(stats.filter((_, idx) => idx !== i));
  const add = () => onChange([...stats, { value: "", label: "" }]);
  return (
    <Section title="Stats">
      {stats.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_1.5fr_22px] gap-1.5">
          <Input value={s.value} onChange={(v) => update(i, { value: v })} />
          <Input value={s.label} onChange={(v) => update(i, { label: v })} />
          <button
            type="button"
            onClick={() => remove(i)}
            className="grid h-[22px] w-[22px] place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface-2)] hover:text-[var(--error)]"
            aria-label="Remove stat"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center justify-center gap-1 rounded-[6px] border border-dashed border-[var(--border-strong)] bg-transparent px-2 py-1 text-[11.5px] text-[var(--text-mute)] hover:border-[var(--olive-700)] hover:text-[var(--olive-700)]"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
        Add stat
      </button>
    </Section>
  );
}
