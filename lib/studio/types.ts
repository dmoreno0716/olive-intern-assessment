import type { CatalogNode } from "@/lib/catalog/types";
import type { StreamEvent } from "@/lib/llm/types";

export type PersistedEvent = {
  type: "persisted";
  funnel_id: string;
  variant_id: string;
  model: string;
  attempts: number;
  usage: { input_tokens: number; output_tokens: number };
  cost: { input_usd: number; output_usd: number; total_usd: number };
};

export type DoneEvent = { type: "done"; ok: boolean };

export type GenerateEvent = StreamEvent | PersistedEvent | DoneEvent;

export type FunnelRecord = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export type VariantRecord = {
  id: string;
  funnel_id: string;
  name: string;
  spec: CatalogNode[];
  routing_rules: {
    sources: string[];
    dwell_threshold_ms: number | null;
    is_default: boolean;
  };
  created_at: string;
  updated_at: string;
};
