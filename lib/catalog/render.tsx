"use client";

import type { ComponentType } from "react";
import type { CatalogNode } from "./types";

/**
 * Component registry — populated by lib/catalog/index.ts after all
 * primitives are imported. Indirection via a mutable map avoids circular
 * imports (components → render helper → registry → components).
 */
const registry = new Map<string, ComponentType<{ node: CatalogNode }>>();

export function registerComponent(
  kind: string,
  component: ComponentType<{ node: CatalogNode }>
): void {
  registry.set(kind, component);
}

export function renderNode(node: CatalogNode | undefined, key?: string | number) {
  if (!node) return null;
  const Component = registry.get(node.kind);
  if (!Component) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[catalog] Unknown component kind: ${node.kind}`);
    }
    return null;
  }
  return <Component key={key} node={node} />;
}

export function Children({
  nodes,
  prefix,
}: {
  nodes: CatalogNode[] | undefined;
  prefix?: string;
}) {
  if (!nodes?.length) return null;
  return (
    <>
      {nodes.map((node, i) => renderNode(node, `${prefix ?? "child"}-${i}`))}
    </>
  );
}
