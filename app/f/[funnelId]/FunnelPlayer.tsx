"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogNode } from "@/lib/catalog/types";
import { FunnelRenderer } from "@/lib/catalog/funnelRenderer";
import {
  FunnelRuntimeProvider,
  type FunnelRuntime,
} from "@/lib/funnel/runtime";
import {
  postIframeEvent,
  type CTAAction,
  type IframeToHostEvent,
} from "@/lib/funnel/postMessage";
import { DWELL_HELPER_THRESHOLD_MS } from "@/lib/funnel/constants";
import { FunnelPageFrame } from "./Frame";
import { CheckoutOverlay } from "./CheckoutOverlay";

type Props = {
  funnelId: string;
  variantId: string;
  variantName: string;
  spec: CatalogNode[];
  source: string | null;
  title?: string;
  preview?: boolean;
};

type FieldEntry = { value: unknown; label?: string };

/**
 * Drives a multi-screen funnel: session lifecycle, dwell tracking, advance/
 * retreat, postMessage emission, and CTA→checkout overlay. Hosts the
 * runtime context the catalog primitives bind to (see lib/funnel/runtime).
 */
export function FunnelPlayer({
  funnelId,
  variantId,
  variantName,
  spec,
  source,
  title,
  preview = false,
}: Props) {
  const screens = spec;
  const total = screens.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, FieldEntry>>({});
  const [overlay, setOverlay] = useState<{ href?: string } | null>(null);
  const [helperState, setHelperState] = useState<{
    screenId: string | null;
    visible: boolean;
  }>({ screenId: null, visible: false });

  // Refs initialized to 0 and stamped with `Date.now()` from the first
  // mount effect — calling `Date.now()` during render is impure.
  const dwellStartRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const completedRef = useRef(false);
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);
  useEffect(() => {
    const now = Date.now();
    dwellStartRef.current = now;
    startedAtRef.current = now;
  }, []);

  const currentScreen = screens[index];
  const currentProps = (currentScreen?.props ?? {}) as {
    id?: string;
    kind?: string;
  };
  const currentScreenId = currentProps.id ?? `screen-${index}`;
  const currentKind = currentProps.kind ?? "question";
  const isFirst = index === 0;
  const isLast = index === total - 1;

  /* ────────── postMessage emitter ────────── */
  const emit = useCallback((event: IframeToHostEvent) => {
    if (typeof window === "undefined") return;
    const target = window.parent ?? window;
    postIframeEvent(target, event);
  }, []);

  /* ────────── session bootstrap ────────── */
  useEffect(() => {
    let cancelled = false;
    // Studio preview must not create response rows.
    if (!preview) {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel_id: funnelId,
          variant_id: variantId,
          source,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((row) => {
          if (cancelled || !row?.id) return;
          setSessionId(row.id);
        })
        .catch(() => {});
    }
    emit({
      type: "funnel:loaded",
      payload: {
        funnelId,
        specVersion: 1,
        screenCount: total,
        locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
      },
    });
    return () => {
      cancelled = true;
    };
  }, [funnelId, variantId, source, total, emit, preview]);

  /* ────────── preview control listener (Studio iframe only) ────────── */
  useEffect(() => {
    if (!preview) return;
    const onMsg = (e: MessageEvent) => {
      const data = e.data as { type?: string; payload?: unknown } | null;
      if (!data) return;
      if (data.type === "preview:goto") {
        const idx = (data.payload as { index?: number } | undefined)?.index;
        if (typeof idx !== "number") return;
        const clamped = Math.max(0, Math.min(idx, total - 1));
        setDirection(clamped >= index ? "forward" : "backward");
        setIndex(clamped);
      } else if (data.type === "preview:restart") {
        setDirection("backward");
        setIndex(0);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [preview, total, index]);

  /* ────────── per-screen lifecycle: emit screen:shown + dwell timer ────────── */
  useEffect(() => {
    dwellStartRef.current = Date.now();
    emit({
      type: "screen:shown",
      payload: { index, screenId: currentScreenId, kind: currentKind },
    });
    const helper = (currentScreen?.props as { dwellHelper?: string } | undefined)
      ?.dwellHelper;
    if (!helper) return;
    const timer = setTimeout(() => {
      setHelperState({ screenId: currentScreenId, visible: true });
    }, DWELL_HELPER_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [index, currentScreenId, currentKind, currentScreen, emit]);

  const dwellHelperVisible =
    helperState.visible && helperState.screenId === currentScreenId;

  /* ────────── pagehide → funnel:abandoned ────────── */
  useEffect(() => {
    if (preview) return;
    const onHide = () => {
      if (completedRef.current) return;
      const partial: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fieldsRef.current)) {
        partial[k] = v.value;
      }
      emit({
        type: "funnel:abandoned",
        payload: {
          funnelId,
          variant: variantName,
          lastScreenId: currentScreenId,
          partialAnswers: partial,
          durationMs: Date.now() - startedAtRef.current,
        },
      });
      if (sessionId) {
        navigator.sendBeacon?.(
          `/api/sessions/${sessionId}/event`,
          new Blob(
            [JSON.stringify({ type: "abandoned", last_screen_id: currentScreenId })],
            { type: "application/json" },
          ),
        );
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [funnelId, variantName, currentScreenId, sessionId, emit, preview]);

  /* ────────── helpers used by runtime API ────────── */
  const setField = useCallback((field: string, value: unknown, label?: string) => {
    setFields((prev) => ({ ...prev, [field]: { value, label } }));
  }, []);

  const fieldsForScreen = useCallback(
    (screen: CatalogNode | undefined): Record<string, FieldEntry> => {
      if (!screen) return {};
      const fieldNames = new Set<string>();
      collectFieldsFromNode(screen, fieldNames);
      const out: Record<string, FieldEntry> = {};
      for (const f of fieldNames) {
        if (fieldsRef.current[f]) out[f] = fieldsRef.current[f];
      }
      return out;
    },
    [],
  );

  const submitAnswer = useCallback(
    async (screenIdx: number) => {
      const screen = screens[screenIdx];
      if (!screen) return;
      const screenProps = (screen.props ?? {}) as { id?: string };
      const sId = screenProps.id ?? `screen-${screenIdx}`;
      const dwellMs = Math.max(0, Date.now() - dwellStartRef.current);
      const screenAnswers = fieldsForScreen(screen);
      // emit screen:completed + answer:submitted (one per field)
      emit({
        type: "screen:completed",
        payload: { index: screenIdx, screenId: sId, dwellMs },
      });
      for (const entry of Object.values(screenAnswers)) {
        emit({
          type: "answer:submitted",
          payload: {
            screenId: sId,
            answer: { value: entry.value, label: entry.label },
          },
        });
      }
      if (!sessionId) return;
      // server-side persistence: one answer record per screen with the
      // collected fields blob (or a sentinel if the screen has none).
      const blob = Object.fromEntries(
        Object.entries(screenAnswers).map(([k, v]) => [k, v.value]),
      );
      await fetch(`/api/sessions/${sessionId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "answer",
          screen_id: sId,
          screen_index: screenIdx,
          answer: blob,
          dwell_ms: dwellMs,
        }),
      }).catch(() => {});
    },
    [screens, sessionId, emit, fieldsForScreen],
  );

  const advance = useCallback(async () => {
    await submitAnswer(index);
    if (index >= total - 1) return;
    setDirection("forward");
    setIndex((i) => i + 1);
  }, [submitAnswer, index, total]);

  const retreat = useCallback(() => {
    if (index === 0) return;
    setDirection("backward");
    setIndex((i) => i - 1);
  }, [index]);

  const fireCompletion = useCallback(async () => {
    if (completedRef.current || !sessionId) return;
    completedRef.current = true;
    const answers: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fieldsRef.current)) {
      answers[k] = v.value;
    }
    emit({
      type: "funnel:completed",
      payload: {
        funnelId,
        variant: variantName,
        answers,
        completedAt: new Date().toISOString(),
      },
    });
    await fetch(`/api/sessions/${sessionId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "completed" }),
    }).catch(() => {});
  }, [funnelId, variantName, sessionId, emit]);

  const onCTA = useCallback(
    async (payload: {
      screenId: string;
      label: string;
      action: CTAAction;
      href?: string;
    }) => {
      // log answer for the current screen (if non-final this also persists)
      if (!isLast) {
        await advance();
        return;
      }
      // final screen → cta:clicked + funnel:completed; stay put.
      emit({ type: "cta:clicked", payload });
      if (sessionId) {
        await fetch(`/api/sessions/${sessionId}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "cta_clicked", screen_id: payload.screenId }),
        }).catch(() => {});
      }
      await fireCompletion();
      if (payload.action === "external" && payload.href) {
        setOverlay({ href: payload.href });
        // In preview the iframe should not actually navigate away — the
        // overlay alone communicates the conversion intent.
        if (!preview) {
          setTimeout(() => {
            // Navigate after the overlay's settle window. In a real app the
            // native handler would route; for the web demo we fall back to
            // the href.
            if (typeof window !== "undefined") {
              window.location.assign(payload.href!);
            }
          }, 900);
        }
      }
    },
    [isLast, advance, emit, sessionId, fireCompletion, preview],
  );

  /* ────────── progress: question-aware ────────── */
  // Walk the spec once per render to find every question screen. Progress
  // reflects the user-facing journey, not the spec array index — intro
  // screens read 0, question N of M reads N/M, gate/result read 1, and
  // custom screens fall back to position-based.
  const progressFraction = useMemo(() => {
    const kindAt = (i: number) =>
      ((screens[i]?.props as { kind?: unknown } | undefined)?.kind as string) ??
      "question";
    const currentKind = kindAt(index);
    const questionIndices: number[] = [];
    for (let i = 0; i < screens.length; i++) {
      if (kindAt(i) === "question") questionIndices.push(i);
    }
    const totalQuestions = questionIndices.length;

    if (currentKind === "intro") return 0;
    if (currentKind === "result" || currentKind === "gate") return 1;
    if (currentKind === "question" && totalQuestions > 0) {
      const pos = questionIndices.indexOf(index);
      // 1-based position so the first question reads 1/N.
      return (pos + 1) / totalQuestions;
    }
    // Custom or unknown: fall back to position-based.
    return total > 0 ? (index + 1) / total : 0;
  }, [screens, index, total]);

  /* ────────── runtime context value ────────── */
  const runtime: FunnelRuntime = useMemo(
    () => ({
      funnelId,
      variantId,
      variantName,
      totalScreens: total,
      currentIndex: index,
      isFirst,
      isLast,
      currentScreenId,
      answers: Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [k, v.value]),
      ),
      setField,
      fieldValue: (f) => fields[f]?.value,
      fieldLabel: (f) => fields[f]?.label,
      onCTA,
      retreat,
      dwellHelperVisible,
      progressFraction,
    }),
    [
      funnelId,
      variantId,
      variantName,
      total,
      index,
      isFirst,
      isLast,
      currentScreenId,
      fields,
      setField,
      onCTA,
      retreat,
      dwellHelperVisible,
      progressFraction,
    ],
  );

  if (!currentScreen) {
    return (
      <FunnelPageFrame funnelId={funnelId}>
        <div className="flex flex-1 items-center justify-center font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--ftext-f)]">
          No screens to render
        </div>
      </FunnelPageFrame>
    );
  }

  return (
    <FunnelPageFrame funnelId={funnelId}>
      <FunnelRuntimeProvider value={runtime}>
        <div
          key={`${currentScreenId}-${index}-${direction}`}
          className="flex h-full w-full flex-col"
          style={{
            animation: `funnel-screen-${direction === "forward" ? "in" : "back"} var(--m-med) var(--ease-em)`,
          }}
        >
          <FunnelRenderer node={currentScreen} />
        </div>
      </FunnelRuntimeProvider>
      {overlay && <CheckoutOverlay href={overlay.href} />}
      <style>{screenAnim}</style>
      {/* keep title for SSR */}
      <span hidden>{title ?? ""}</span>
    </FunnelPageFrame>
  );
}

/** Walk a Screen node's body/footer/children and collect all `field`
 * names. Used to scope answer persistence to the current screen. */
function collectFieldsFromNode(node: CatalogNode, out: Set<string>) {
  const props = (node.props ?? {}) as Record<string, unknown>;
  if (typeof props.field === "string") out.add(props.field);
  for (const key of ["body", "footer", "children"] as const) {
    const arr = props[key];
    if (Array.isArray(arr)) {
      for (const child of arr) {
        if (child && typeof child === "object") {
          collectFieldsFromNode(child as CatalogNode, out);
        }
      }
    }
  }
}

const screenAnim = `
@keyframes funnel-screen-in {
  from { transform: translateX(24px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes funnel-screen-back {
  from { transform: translateX(-24px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
`;
