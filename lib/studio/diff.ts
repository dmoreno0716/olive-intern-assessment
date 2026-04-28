import type { CatalogNode } from "@/lib/catalog/types";

export type DiffEntry = {
  summary: string;
  screenIds: string[];
};

const MAX_ENTRIES = 6;

/**
 * Build a short, human-readable summary of the changes between two
 * funnel specs. Used by the Studio chat refinement panel to show the
 * creator a "what's about to change" card before they click Accept.
 *
 * Output is intentionally lossy — the goal is to communicate intent
 * (added a question, tweaked a CTA, reordered screens), not to be a
 * faithful JSON diff. The card is capped at MAX_ENTRIES rows.
 */
export function summarizeDiff(
  before: CatalogNode[],
  after: CatalogNode[],
): DiffEntry[] {
  const beforeIds = before.map((s, i) => screenId(s, i));
  const afterIds = after.map((s, i) => screenId(s, i));
  const setBefore = new Set(beforeIds);
  const setAfter = new Set(afterIds);

  const added = afterIds.filter((id) => !setBefore.has(id));
  const removed = beforeIds.filter((id) => !setAfter.has(id));
  const kept = beforeIds.filter((id) => setAfter.has(id));

  const entries: DiffEntry[] = [];

  if (added.length) {
    entries.push({
      summary: `Added ${added.length} screen${added.length === 1 ? "" : "s"} (${
        added.join(", ")
      })`,
      screenIds: added,
    });
  }
  if (removed.length) {
    entries.push({
      summary: `Removed ${removed.length} screen${removed.length === 1 ? "" : "s"} (${
        removed.join(", ")
      })`,
      screenIds: removed,
    });
  }

  // Reorder check — only meaningful when add/remove didn't already
  // disturb the ordering.
  if (!added.length && !removed.length) {
    const reordered = beforeIds.some((id, i) => afterIds[i] !== id);
    if (reordered) {
      entries.push({
        summary: `Reordered screens (${afterIds.join(" → ")})`,
        screenIds: afterIds,
      });
    }
  }

  // Per-screen field changes for screens that survived the diff.
  for (const id of kept) {
    const b = findScreenById(before, id);
    const a = findScreenById(after, id);
    if (!b || !a) continue;
    for (const d of diffScreen(b, a)) {
      entries.push({ summary: d, screenIds: [id] });
      if (entries.length >= MAX_ENTRIES) break;
    }
    if (entries.length >= MAX_ENTRIES) break;
  }

  if (entries.length === 0) {
    entries.push({
      summary: "No structural change detected — minor whitespace or prop tweaks only.",
      screenIds: [],
    });
  }

  return entries.slice(0, MAX_ENTRIES);
}

function diffScreen(before: CatalogNode, after: CatalogNode): string[] {
  const bp = (before.props ?? {}) as Record<string, unknown>;
  const ap = (after.props ?? {}) as Record<string, unknown>;
  const out: string[] = [];

  if (bp.kind !== ap.kind) {
    out.push(`Changed kind ${quote(bp.kind)} → ${quote(ap.kind)}`);
  }

  const beforeBody = (bp.body as CatalogNode[] | undefined) ?? [];
  const afterBody = (ap.body as CatalogNode[] | undefined) ?? [];
  out.push(...diffSlot("Body", beforeBody, afterBody));

  const beforeFooter = (bp.footer as CatalogNode[] | undefined) ?? [];
  const afterFooter = (ap.footer as CatalogNode[] | undefined) ?? [];
  out.push(...diffSlot("Footer", beforeFooter, afterFooter));

  return out;
}

function diffSlot(
  label: "Body" | "Footer",
  before: CatalogNode[],
  after: CatalogNode[],
): string[] {
  const out: string[] = [];

  // Cheap counted comparison by kind.
  const beforeKinds = before.map((n) => n.kind);
  const afterKinds = after.map((n) => n.kind);
  const beforeBag = bag(beforeKinds);
  const afterBag = bag(afterKinds);
  for (const [kind, count] of afterBag) {
    const prev = beforeBag.get(kind) ?? 0;
    if (count > prev) {
      out.push(`Added ${count - prev} ${kind}${count - prev === 1 ? "" : "s"} in ${label.toLowerCase()}`);
    }
  }
  for (const [kind, count] of beforeBag) {
    const next = afterBag.get(kind) ?? 0;
    if (next < count) {
      out.push(`Removed ${count - next} ${kind}${count - next === 1 ? "" : "s"} from ${label.toLowerCase()}`);
    }
  }

  // Pairwise content edits — same index, same kind, different visible text.
  const minLen = Math.min(before.length, after.length);
  for (let i = 0; i < minLen; i++) {
    const b = before[i]!;
    const a = after[i]!;
    if (b.kind !== a.kind) continue;
    const change = describeContentChange(b, a);
    if (change) out.push(change);
  }

  return out;
}

function describeContentChange(before: CatalogNode, after: CatalogNode): string | null {
  const bp = (before.props ?? {}) as Record<string, unknown>;
  const ap = (after.props ?? {}) as Record<string, unknown>;

  const textKeys = ["text", "label", "tagline", "title", "summary"];
  for (const key of textKeys) {
    const bv = bp[key];
    const av = ap[key];
    if (typeof bv === "string" && typeof av === "string" && bv !== av) {
      return `Updated ${after.kind}: ${truncate(bv)} → ${truncate(av)}`;
    }
  }

  // Options array (ChoiceList / MultiChoice / ImageChoiceGrid).
  if (Array.isArray(bp.options) && Array.isArray(ap.options)) {
    const bo = bp.options as { label?: string }[];
    const ao = ap.options as { label?: string }[];
    if (bo.length !== ao.length) {
      const delta = ao.length - bo.length;
      return delta > 0
        ? `Added ${delta} option${delta === 1 ? "" : "s"} to ${after.kind}`
        : `Removed ${Math.abs(delta)} option${Math.abs(delta) === 1 ? "" : "s"} from ${after.kind}`;
    }
    const labelsChanged = bo.some((o, i) => (o.label ?? "") !== (ao[i]?.label ?? ""));
    if (labelsChanged) return `Updated option labels in ${after.kind}`;
  }

  // PrimaryCTA / SecondaryCTA action change.
  if (bp.action !== ap.action && (after.kind === "PrimaryCTA" || after.kind === "SecondaryCTA")) {
    return `Changed ${after.kind} action ${quote(bp.action)} → ${quote(ap.action)}`;
  }

  return null;
}

function findScreenById(spec: CatalogNode[], id: string): CatalogNode | undefined {
  return spec.find((s) => screenId(s, -1) === id);
}

function screenId(node: CatalogNode, fallbackIndex: number): string {
  const id = (node.props as { id?: unknown } | undefined)?.id;
  if (typeof id === "string" && id.length > 0) return id;
  return `screen-${fallbackIndex + 1}`;
}

function bag(arr: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function quote(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}

function truncate(s: string, n = 32): string {
  return s.length <= n ? `"${s}"` : `"${s.slice(0, n - 1)}…"`;
}
