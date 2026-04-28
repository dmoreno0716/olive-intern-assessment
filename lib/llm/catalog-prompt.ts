import type { z } from "zod";
import { catalogComponents } from "@/lib/catalog/registry-data";

/**
 * Generates the catalog reference section of the system prompt directly
 * from the registered Zod schemas + descriptions in lib/catalog. The
 * output is plugged into prompts/system.md at the `{{CATALOG}}` marker.
 *
 * Why programmatic instead of hand-written: if a catalog primitive's
 * schema changes (a new enum option on Heading.size, a new prop, an
 * added/removed primitive), the system prompt updates on the next
 * generation instead of silently drifting. The hand-written prose for
 * intro / composition rules / hard rules / examples lives in the
 * markdown template above and below this section.
 *
 * NOTE on grouping: the registered catalog is a flat keyed map, so the
 * "Layout / Typography / Answers / CTA / Result / Decorative" buckets
 * are derived from a static list here. If a new primitive is added,
 * either add its name to a bucket below or it will land in the
 * "Other" bucket at the bottom — still surfaced to the LLM, just
 * without an editorial group label.
 */

const GROUPS: { title: string; kinds: string[]; lead?: string }[] = [
  {
    title: "Layout & structural",
    kinds: ["Screen", "Stack", "Group", "Spacer", "Divider"],
  },
  {
    title: "Typography",
    kinds: ["Heading", "Body", "Eyebrow", "Caption"],
  },
  {
    title: "Answer primitives (interactive — bind to a `field` key)",
    kinds: [
      "ChoiceList",
      "MultiChoice",
      "ImageChoiceGrid",
      "ScalePicker",
      "ShortText",
      "LongText",
      "EmailInput",
      "NumberInput",
      "ToggleRow",
    ],
    lead: "All of these bind to a `field` key (camelCase, unique per funnel) that becomes part of the captured answer set.",
  },
  {
    title: "CTA & navigation",
    kinds: ["PrimaryCTA", "SecondaryCTA", "ProgressBar", "BackButton"],
  },
  {
    title: "Result, conversion, gate",
    kinds: ["ResultBadge", "ResultHero", "PriceCard", "EmailGate", "SocialProof", "Disclosure"],
  },
  {
    title: "Decorative",
    kinds: ["Avatar", "IconBadge", "PoweredFooter"],
  },
];

const AUTO_RENDERED = new Set(["ProgressBar", "BackButton", "PoweredFooter"]);

export function buildCatalogSection(): string {
  const components = catalogComponents as unknown as Record<
    string,
    { props: z.ZodType; description: string }
  >;

  const grouped = new Set<string>();
  const lines: string[] = [];

  lines.push(`The catalog has ${Object.keys(components).length} primitives. Every node has the shape \`{ "kind": "<Name>", "props": { ... } }\`. Children live inside \`props\` (\`Screen.body\`, \`Screen.footer\`, \`Stack.children\`, \`Group.children\`).`);
  lines.push("");

  for (const group of GROUPS) {
    lines.push(`### ${group.title}`);
    lines.push("");
    if (group.lead) {
      lines.push(group.lead);
      lines.push("");
    }
    for (const kind of group.kinds) {
      const entry = components[kind];
      if (!entry) continue;
      grouped.add(kind);
      lines.push(renderPrimitive(kind, entry.props, entry.description));
    }
    lines.push("");
  }

  const ungrouped = Object.keys(components).filter((k) => !grouped.has(k));
  if (ungrouped.length) {
    lines.push("### Other");
    lines.push("");
    for (const kind of ungrouped) {
      const entry = components[kind];
      lines.push(renderPrimitive(kind, entry.props, entry.description));
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function renderPrimitive(kind: string, schema: z.ZodType, description: string): string {
  const propsLine = describeProps(schema);
  const lead = AUTO_RENDERED.has(kind) ? `${description} **Do NOT include in spec.**` : description;
  if (!propsLine) {
    return `- **${kind}** — ${lead}`;
  }
  return `- **${kind}** — ${lead}\n  Props: ${propsLine}.`;
}

/**
 * Render a ZodObject's shape as a comma-separated prop list.
 * Returns "" for non-object schemas (we only register ZodObjects).
 */
function describeProps(schema: z.ZodType): string {
  const def = (schema as unknown as { def: { type: string; shape?: Record<string, z.ZodType> } }).def;
  if (def.type !== "object" || !def.shape) return "";
  const entries = Object.entries(def.shape);
  if (entries.length === 0) return "none";
  return entries.map(([name, child]) => describeProp(name, child)).join(", ");
}

type ZodDef = {
  type: string;
  innerType?: z.ZodType;
  element?: z.ZodType;
  shape?: Record<string, z.ZodType>;
  entries?: Record<string, string | number>;
  values?: (string | number | boolean | null)[];
  defaultValue?: unknown;
};

function getDef(schema: z.ZodType): ZodDef {
  return (schema as unknown as { def: ZodDef }).def;
}

function describeProp(name: string, schema: z.ZodType): string {
  const annotated = annotate(schema);
  return `\`${name}\` (${annotated.type}${annotated.suffix})`;
}

/**
 * Render the type information for a single Zod schema:
 *  string                                       → "string"
 *  z.string().optional()                        → "string", suffix " optional"
 *  z.boolean().default(true)                    → "boolean", suffix " default true"
 *  z.enum(["a","b"])                            → "\"a\" | \"b\""
 *  z.array(z.string())                          → "string[]"
 *  z.array(z.object({...}))                     → "Array<{ k: type, ... }>"
 *  z.object({...})                              → "{ k: type, ... }"
 *  z.string().url()                             → "url"  (string format)
 */
function annotate(schema: z.ZodType): { type: string; suffix: string } {
  const def = getDef(schema);

  switch (def.type) {
    case "optional":
    case "nonoptional": {
      const inner = annotate(def.innerType!);
      return { type: inner.type, suffix: appendSuffix(inner.suffix, "optional") };
    }
    case "default":
    case "prefault": {
      const inner = annotate(def.innerType!);
      return {
        type: inner.type,
        suffix: appendSuffix(inner.suffix, `default ${formatLiteral(def.defaultValue)}`),
      };
    }
    case "nullable": {
      const inner = annotate(def.innerType!);
      return { type: `${inner.type} | null`, suffix: inner.suffix };
    }
    case "array": {
      const inner = annotate(def.element!);
      const innerType = inner.type;
      const wrapped = needsArrayWrap(innerType) ? `Array<${innerType}>` : `${innerType}[]`;
      return { type: wrapped, suffix: "" };
    }
    case "object": {
      const entries = Object.entries(def.shape ?? {});
      const fields = entries.map(([k, child]) => {
        const a = annotate(child);
        const optMark = a.suffix.includes("optional") ? "?" : "";
        return `${k}${optMark}: ${a.type}`;
      });
      return { type: `{ ${fields.join(", ")} }`, suffix: "" };
    }
    case "enum": {
      const opts = Object.values(def.entries ?? {}).map((v) => formatLiteral(v));
      return { type: opts.join(" | "), suffix: "" };
    }
    case "literal": {
      const opts = (def.values ?? []).map(formatLiteral);
      return { type: opts.join(" | "), suffix: "" };
    }
    case "string":
      return { type: "string", suffix: "" };
    case "int":
      return { type: "int", suffix: "" };
    case "number":
      return { type: "number", suffix: "" };
    case "boolean":
      return { type: "boolean", suffix: "" };
    case "null":
      return { type: "null", suffix: "" };
    case "undefined":
      return { type: "undefined", suffix: "" };
    case "any":
      return { type: "any", suffix: "" };
    case "unknown":
      return { type: "unknown", suffix: "" };
    case "union": {
      const opts = (def as unknown as { options: z.ZodType[] }).options ?? [];
      return { type: opts.map((o) => annotate(o).type).join(" | "), suffix: "" };
    }
    default:
      return { type: def.type, suffix: "" };
  }
}

function appendSuffix(prev: string, addition: string): string {
  return prev ? `${prev}, ${addition}` : `, ${addition}`;
}

function needsArrayWrap(inner: string): boolean {
  // Wrap with Array<...> only when the element type contains punctuation
  // that would make `T[]` ambiguous to a reader.
  return /[{}|,]/.test(inner);
}

function formatLiteral(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
