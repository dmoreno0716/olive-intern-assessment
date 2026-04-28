import type { CatalogNode } from "@/lib/catalog/types";

export type ScreenKind = "intro" | "question" | "gate" | "result" | "custom";

type ScreenProps = {
  id: string;
  kind: ScreenKind;
  body: CatalogNode[];
  footer?: CatalogNode[];
  showProgress?: boolean;
  showBack?: boolean;
};

/** Read screen.props with safe defaults. */
export function getScreenProps(node: CatalogNode): ScreenProps {
  const p = (node.props ?? {}) as Partial<ScreenProps>;
  return {
    id: p.id ?? "",
    kind: (p.kind ?? "question") as ScreenKind,
    body: Array.isArray(p.body) ? p.body : [],
    footer: Array.isArray(p.footer) ? p.footer : [],
    showProgress: p.showProgress ?? true,
    showBack: p.showBack ?? true,
  };
}

/** Title shown on collapsed screen cards. Pulled from the first Heading
 * in the body, falling back to "Screen N". */
export function deriveScreenTitle(node: CatalogNode, index: number): string {
  const { body } = getScreenProps(node);
  const found = findFirstHeadingText(body);
  if (found && found.trim().length > 0) return found.trim();
  return `Screen ${index + 1}`;
}

function findFirstHeadingText(nodes: CatalogNode[]): string | null {
  for (const n of nodes) {
    if (n.kind === "Heading") {
      const t = (n.props as { text?: unknown } | undefined)?.text;
      if (typeof t === "string") return t;
    }
    const props = (n.props ?? {}) as { children?: unknown; body?: unknown };
    for (const childKey of ["children", "body"] as const) {
      const arr = props[childKey];
      if (Array.isArray(arr)) {
        const recurse = findFirstHeadingText(arr as CatalogNode[]);
        if (recurse) return recurse;
      }
    }
  }
  return null;
}

/** Replace the screen at `index` and return a new spec array. */
export function replaceScreen(
  spec: CatalogNode[],
  index: number,
  next: CatalogNode,
): CatalogNode[] {
  if (index < 0 || index >= spec.length) return spec;
  const out = spec.slice();
  out[index] = next;
  return out;
}

/** Update fields on a screen's props immutably. */
export function patchScreenProps(
  node: CatalogNode,
  patch: Partial<ScreenProps>,
): CatalogNode {
  return {
    ...node,
    props: {
      ...(node.props ?? {}),
      ...patch,
    },
  };
}

/** Replace a child node (in body or footer) by index. */
export function replaceChild(
  screen: CatalogNode,
  slot: "body" | "footer",
  childIndex: number,
  next: CatalogNode,
): CatalogNode {
  const props = (screen.props ?? {}) as Record<string, unknown>;
  const arr = (Array.isArray(props[slot]) ? props[slot] : []) as CatalogNode[];
  if (childIndex < 0 || childIndex >= arr.length) return screen;
  const nextArr = arr.slice();
  nextArr[childIndex] = next;
  return { ...screen, props: { ...props, [slot]: nextArr } };
}

/** Patch a primitive's props (the `node.props` shallow merge). */
export function patchPrimitiveProps(
  node: CatalogNode,
  patch: Record<string, unknown>,
): CatalogNode {
  return { ...node, props: { ...(node.props ?? {}), ...patch } };
}

/** Insert a screen at a given index. */
export function insertScreen(
  spec: CatalogNode[],
  index: number,
  screen: CatalogNode,
): CatalogNode[] {
  const out = spec.slice();
  out.splice(Math.max(0, Math.min(index, out.length)), 0, screen);
  return out;
}

export function removeScreen(spec: CatalogNode[], index: number): CatalogNode[] {
  const out = spec.slice();
  out.splice(index, 1);
  return out;
}

export function moveScreen(
  spec: CatalogNode[],
  from: number,
  to: number,
): CatalogNode[] {
  if (from === to || from < 0 || from >= spec.length) return spec;
  const out = spec.slice();
  const [moved] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(to, out.length)), 0, moved);
  return out;
}

/** Duplicate the screen at `index`, with a fresh id suffix. */
export function duplicateScreen(
  spec: CatalogNode[],
  index: number,
): CatalogNode[] {
  if (index < 0 || index >= spec.length) return spec;
  const original = spec[index]!;
  const props = (original.props ?? {}) as { id?: string };
  const baseId = props.id ?? `screen-${index + 1}`;
  const newId = uniqueId(spec, `${baseId}-copy`);
  const copy: CatalogNode = {
    ...original,
    props: { ...(original.props ?? {}), id: newId },
  };
  const out = spec.slice();
  out.splice(index + 1, 0, copy);
  return out;
}

/** Find an id that isn't already used among Screens. */
export function uniqueId(spec: CatalogNode[], base: string): string {
  const used = new Set(
    spec
      .map((s) => (s.props as { id?: unknown } | undefined)?.id)
      .filter((v): v is string => typeof v === "string"),
  );
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
