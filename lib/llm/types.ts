import type { CatalogNode } from "@/lib/catalog/types";

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

export type GenerationCost = {
  input_usd: number;
  output_usd: number;
  total_usd: number;
};

export type ValidationIssue = { path: string; message: string };

export type GenerationSuccess = {
  ok: true;
  spec: CatalogNode[];
  usage: TokenUsage;
  cost: GenerationCost;
  model: string;
  attempts: number;
};

export type GenerationFailure = {
  ok: false;
  error: string;
  issues?: ValidationIssue[];
  rawText?: string;
  usage: TokenUsage;
  cost: GenerationCost;
  model: string;
  attempts: number;
};

export type GenerationResult = GenerationSuccess | GenerationFailure;

export type StreamEvent =
  | { type: "start"; model: string }
  | { type: "delta"; text: string }
  | { type: "validation_error"; attempt: number; issues: ValidationIssue[] }
  | { type: "retry"; attempt: number }
  | { type: "final"; spec: CatalogNode[]; usage: TokenUsage; cost: GenerationCost; model: string; attempts: number }
  | { type: "error"; message: string; issues?: ValidationIssue[]; rawText?: string };
