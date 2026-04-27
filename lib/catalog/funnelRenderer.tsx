"use client";

import { JSONUIProvider, Renderer, type ComponentRegistry } from "@json-render/react";
import type { ComponentRenderProps, Spec } from "@json-render/react";
import { renderNode } from "./render";
import type { CatalogNode } from "./types";
import "./index";

/**
 * Adapter component mounted as the json-render root. It accepts the
 * design/CATALOG.md nested spec format via `props.node` and delegates to
 * our recursive `renderNode`. This keeps the LLM-facing spec format
 * (nested children-in-props) intact while still routing every render
 * through @json-render/react's `Renderer`.
 */
function FunnelRoot({ element }: ComponentRenderProps<{ node: CatalogNode }>) {
  const node = (element.props ?? {}).node;
  return <>{renderNode(node, "root")}</>;
}

const registry: ComponentRegistry = { FunnelRoot };

export function FunnelRenderer({ node }: { node: CatalogNode }) {
  const spec: Spec = {
    root: "root",
    elements: {
      root: {
        type: "FunnelRoot",
        props: { node },
        children: [],
      },
    },
  };
  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
