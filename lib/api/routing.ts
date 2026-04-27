import { z } from "zod";

export const RoutingRulesSchema = z.object({
  sources: z.array(z.string()).default([]),
  dwell_threshold_ms: z.number().int().nonnegative().nullable().default(null),
  is_default: z.boolean().default(false),
});

export type RoutingRules = z.infer<typeof RoutingRulesSchema>;

export type ResolverVariant = {
  id: string;
  name: string;
  routing_rules: RoutingRules;
};

/**
 * Pick a variant for a given session.
 *
 * Priority:
 *   1. A variant whose `sources` contains the request's source AND whose
 *      dwell_threshold_ms (if set) is met by the candidate's dwellMs.
 *   2. A variant whose `sources` contains the source (no dwell rule).
 *   3. The variant marked `is_default`.
 *   4. The first variant in the list (last-resort fallback).
 *
 * Dwell-time routing is a forward-looking hook for the "slow-burn vs.
 * skim" split; for cold sessions dwellMs is 0 so only sources + default
 * matter on first impression.
 */
export function resolveVariant(
  variants: ResolverVariant[],
  ctx: { source: string | null; dwellMs: number },
): ResolverVariant | null {
  if (variants.length === 0) return null;
  const source = (ctx.source ?? "").toLowerCase();

  if (source) {
    const sourceMatches = variants.filter((v) =>
      v.routing_rules.sources.some((s) => s.toLowerCase() === source),
    );

    const withDwell = sourceMatches.find(
      (v) =>
        v.routing_rules.dwell_threshold_ms != null &&
        ctx.dwellMs >= v.routing_rules.dwell_threshold_ms,
    );
    if (withDwell) return withDwell;

    const sourceOnly = sourceMatches.find(
      (v) => v.routing_rules.dwell_threshold_ms == null,
    );
    if (sourceOnly) return sourceOnly;
  }

  const defaultVariant = variants.find((v) => v.routing_rules.is_default);
  if (defaultVariant) return defaultVariant;

  return variants[0];
}
