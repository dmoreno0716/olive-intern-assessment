"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogNode } from "@/lib/catalog/types";
import type { RoutingRules } from "@/lib/api/routing";

export type VariantPatch = {
  spec?: CatalogNode[];
  routing_rules?: RoutingRules;
  name?: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 500;

/**
 * Debounced PATCH /api/variants/:id saver. Coalesces rapid edits per
 * variant and exposes a single status flag for the top-bar indicator.
 * Latest wins: if a second edit lands while the first is in flight, we
 * fire another PATCH after the response.
 */
export function useDebouncedSaver() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendingRef = useRef(new Map<string, VariantPatch>());
  const inFlightRef = useRef(new Set<string>());

  const flush = useCallback(async (variantId: string) => {
    if (inFlightRef.current.has(variantId)) {
      // Another save is in progress; the post-response hook below will
      // re-flush whatever is still pending.
      return;
    }
    const payload = pendingRef.current.get(variantId);
    if (!payload || Object.keys(payload).length === 0) return;
    pendingRef.current.delete(variantId);

    inFlightRef.current.add(variantId);
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setStatus("error");
        setError(text || `HTTP ${res.status}`);
        // Put the payload back so the caller can retry by editing again.
        pendingRef.current.set(variantId, {
          ...payload,
          ...(pendingRef.current.get(variantId) ?? {}),
        });
        return;
      }
      setStatus("saved");
      setSavedAt(Date.now());
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      inFlightRef.current.delete(variantId);
      // If more edits arrived during the request, flush them now.
      if (pendingRef.current.has(variantId)) {
        void flush(variantId);
      }
    }
  }, []);

  const schedule = useCallback(
    (variantId: string, patch: VariantPatch) => {
      // Drop undefined keys before merging — otherwise an edit that only
      // touches `spec` will clobber any pending `routing_rules` / `name`
      // already queued for the same variant.
      const cleanPatch: VariantPatch = {};
      if (patch.spec !== undefined) cleanPatch.spec = patch.spec;
      if (patch.routing_rules !== undefined) {
        cleanPatch.routing_rules = patch.routing_rules;
      }
      if (patch.name !== undefined) cleanPatch.name = patch.name;
      if (Object.keys(cleanPatch).length === 0) return;

      const merged = {
        ...(pendingRef.current.get(variantId) ?? {}),
        ...cleanPatch,
      };
      pendingRef.current.set(variantId, merged);
      setStatus("saving");

      const existing = timersRef.current.get(variantId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        timersRef.current.delete(variantId);
        void flush(variantId);
      }, DEBOUNCE_MS);
      timersRef.current.set(variantId, timer);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, []);

  return { schedule, status, error, savedAt };
}
