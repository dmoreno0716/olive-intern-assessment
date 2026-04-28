"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { CatalogNode } from "@/lib/catalog/types";
import type { CTAAction } from "./postMessage";

/**
 * Runtime context bridging a multi-screen funnel player with the existing
 * single-node catalog renderer. When a catalog component renders inside
 * `<FunnelRuntimeProvider>`, it can call `useFunnelRuntime()` to wire
 * itself into the player (read current index, register a field value,
 * trigger advance/retreat). Outside the provider (Studio preview) the
 * components fall back to local state — that's the shared-rendering
 * contract the assessment requires.
 */
export type FunnelRuntime = {
  funnelId: string;
  variantId: string;
  variantName: string;
  totalScreens: number;
  currentIndex: number;
  isFirst: boolean;
  isLast: boolean;
  currentScreenId: string;
  answers: Record<string, unknown>;
  /** Input components push their current value here. */
  setField(field: string, value: unknown, label?: string): void;
  fieldValue(field: string): unknown;
  fieldLabel(field: string): string | undefined;
  /** PrimaryCTA invokes this on tap. */
  onCTA(payload: {
    screenId: string;
    label: string;
    action: CTAAction;
    href?: string;
  }): void;
  /** BackButton invokes this on tap. */
  retreat(): void;
  /** True once the current screen has dwelled past the helper threshold. */
  dwellHelperVisible: boolean;
};

const FunnelRuntimeContext = createContext<FunnelRuntime | null>(null);

export function FunnelRuntimeProvider({
  value,
  children,
}: {
  value: FunnelRuntime;
  children: ReactNode;
}) {
  return (
    <FunnelRuntimeContext.Provider value={value}>
      {children}
    </FunnelRuntimeContext.Provider>
  );
}

export function useFunnelRuntime(): FunnelRuntime | null {
  return useContext(FunnelRuntimeContext);
}

/**
 * Hook for input primitives. Returns a `value` and `setValue` that mirror
 * runtime state when present, otherwise local-component state. Components
 * call `useFunnelField('email', initial)` and treat the return like
 * useState.
 */
export function useFunnelField<T>(
  field: string | undefined,
  initial: T,
): { value: T; setValue: (v: T, label?: string) => void; bound: boolean } {
  const runtime = useFunnelRuntime();

  const value = useMemo(() => {
    if (!runtime || !field) return initial;
    const v = runtime.fieldValue(field);
    return (v === undefined ? initial : (v as T));
  }, [runtime, field, initial]);

  const setValue = useCallback(
    (v: T, label?: string) => {
      if (!runtime || !field) return;
      runtime.setField(field, v, label);
    },
    [runtime, field],
  );

  return { value, setValue, bound: Boolean(runtime && field) };
}

/** Convenience: pull only what Screen needs (chrome decisions). */
export function useScreenChrome(node: CatalogNode | undefined) {
  const runtime = useFunnelRuntime();
  if (!runtime) return null;
  const screenId = (node?.props as { id?: string } | undefined)?.id;
  return {
    currentIndex: runtime.currentIndex,
    totalScreens: runtime.totalScreens,
    isFirst: runtime.isFirst,
    isLast: runtime.isLast,
    /** True iff this Screen is the one currently mounted in the player. */
    isActive: !screenId || screenId === runtime.currentScreenId,
    retreat: runtime.retreat,
    dwellHelperVisible: runtime.dwellHelperVisible,
  };
}
