"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogNode } from "@/lib/catalog/types";
import type { RoutingRules } from "@/lib/api/routing";
import { RoutingRulesSchema } from "@/lib/api/routing";
import type { FunnelRecord, VariantRecord } from "@/lib/studio/types";
import { useDebouncedSaver } from "@/lib/studio/saver";
import { SpecEditor } from "./SpecEditor";
import { PreviewPanel, type PreviewHandle } from "./PreviewPanel";
import { ChatBar } from "./ChatBar";
import { TopBar } from "./TopBar";
import { PublishedModal } from "./PublishedModal";

type Props = {
  funnel: FunnelRecord;
  variants: VariantRecord[];
};

type LocalVariant = {
  id: string;
  name: string;
  spec: CatalogNode[];
  routing_rules: RoutingRules;
};

type PublishedData = {
  url: string;
  source_urls: { source: string; url: string }[];
};

/**
 * State 3 host. Owns per-variant spec/routing state, debounced
 * persistence, the active variant + expanded screen + preview index,
 * and funnel-level concerns (title, status, publish).
 */
export function StudioWorkbench({ funnel, variants }: Props) {
  const [localVariants, setLocalVariants] = useState<LocalVariant[]>(() =>
    variants.map((v) => ({
      id: v.id,
      name: v.name,
      spec: v.spec,
      routing_rules: v.routing_rules,
    })),
  );
  const [funnelTitle, setFunnelTitle] = useState(funnel.title);
  const [funnelStatus, setFunnelStatus] = useState<"draft" | "published">(
    funnel.status,
  );
  const [hasUnpublishedEdits, setHasUnpublishedEdits] = useState(false);
  const [activeId, setActiveId] = useState<string>(variants[0]?.id ?? "");
  const [expandedScreenId, setExpandedScreenId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedData, setPublishedData] = useState<PublishedData | null>(null);
  const saver = useDebouncedSaver();
  const previewRef = useRef<PreviewHandle>(null);

  const active = useMemo(
    () => localVariants.find((v) => v.id === activeId) ?? localVariants[0],
    [localVariants, activeId],
  );

  const updateActive = useCallback(
    (patch: Partial<LocalVariant>) => {
      if (!active) return;
      setLocalVariants((prev) =>
        prev.map((v) => (v.id === active.id ? { ...v, ...patch } : v)),
      );
      saver.schedule(active.id, {
        spec: patch.spec,
        routing_rules: patch.routing_rules,
        name: patch.name,
      });
      // Any spec/routing/name edit on a published funnel flips the
      // status pill to "draft" and Publish to "Republish".
      if (funnelStatus === "published") setHasUnpublishedEdits(true);
    },
    [active, saver, funnelStatus],
  );

  /* ────────── funnel-level mutations ────────── */

  const onTitleChange = useCallback(
    async (next: string) => {
      const prev = funnelTitle;
      setFunnelTitle(next);
      if (funnelStatus === "published") setHasUnpublishedEdits(true);
      try {
        const res = await fetch(`/api/funnels/${funnel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        // Revert on failure.
        setFunnelTitle(prev);
        console.error("Title save failed", err);
      }
    },
    [funnel.id, funnelTitle, funnelStatus],
  );

  const onRenameVariant = useCallback(
    async (id: string, next: string) => {
      const prev = localVariants.find((v) => v.id === id)?.name ?? "";
      if (next === prev) return;
      setLocalVariants((vs) =>
        vs.map((v) => (v.id === id ? { ...v, name: next } : v)),
      );
      saver.schedule(id, { name: next });
      if (funnelStatus === "published") setHasUnpublishedEdits(true);
    },
    [localVariants, saver, funnelStatus],
  );

  const onAddVariant = useCallback(async () => {
    if (!active) return;
    if (localVariants.length >= 4) return;
    const sourceId = active.id;
    try {
      const res = await fetch(`/api/funnels/${funnel.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "duplicate",
          source_variant_id: sourceId,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Duplicate variant failed", text);
        return;
      }
      const created = (await res.json()) as VariantRecord;
      setLocalVariants((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          spec: created.spec,
          routing_rules: RoutingRulesSchema.parse(created.routing_rules ?? {}),
        },
      ]);
      setActiveId(created.id);
      if (funnelStatus === "published") setHasUnpublishedEdits(true);
    } catch (err) {
      console.error("Duplicate variant failed", err);
    }
  }, [active, funnel.id, localVariants.length, funnelStatus]);

  const onPublish = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/funnels/${funnel.id}/publish`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as
        | { funnel?: FunnelRecord; url?: string; source_urls?: { source: string; url: string }[]; error?: string }
        | null;
      if (!res.ok || !data?.url) {
        setPublishError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setFunnelStatus("published");
      setHasUnpublishedEdits(false);
      setPublishedData({ url: data.url, source_urls: data.source_urls ?? [] });
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPublishing(false);
    }
  }, [funnel.id]);

  /* ────────── pagination sync ────────── */

  const screenIdAt = useCallback(
    (i: number) => {
      const node = active?.spec[i];
      if (!node) return null;
      const id = (node.props as { id?: unknown } | undefined)?.id;
      return typeof id === "string" ? id : null;
    },
    [active],
  );

  const onExpand = useCallback(
    (id: string | null) => {
      setExpandedScreenId(id);
      if (!id || !active) return;
      const idx = active.spec.findIndex(
        (s) => (s.props as { id?: unknown } | undefined)?.id === id,
      );
      if (idx >= 0 && idx !== previewIndex) {
        previewRef.current?.goto(idx);
        setPreviewIndex(idx);
      }
    },
    [active, previewIndex],
  );

  const onScreenShown = useCallback(
    (index: number, screenId: string) => {
      setPreviewIndex(index);
      setExpandedScreenId((prev) => (prev ? screenId : prev));
    },
    [],
  );

  useEffect(() => {
    setPreviewIndex(0);
    setExpandedScreenId(null);
  }, [activeId]);

  if (!active) {
    return (
      <main className="studio flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-5 py-4 text-[var(--text)]">
          This funnel has no variants. Open it in the SQL studio to inspect.
        </div>
      </main>
    );
  }

  return (
    <main className="studio flex h-dvh flex-col overflow-hidden bg-[var(--bg)]">
      <TopBar
        funnelId={funnel.id}
        funnelTitle={funnelTitle}
        funnelStatus={funnelStatus}
        hasUnpublishedEdits={hasUnpublishedEdits}
        onTitleChange={onTitleChange}
        variants={localVariants.map((v) => ({ id: v.id, name: v.name }))}
        activeVariantId={active.id}
        onSwitchVariant={setActiveId}
        onRenameVariant={onRenameVariant}
        onAddVariant={onAddVariant}
        saveStatus={saver.status}
        savedAt={saver.savedAt}
        saveError={saver.error}
        onPublish={onPublish}
        publishing={publishing}
        publishError={publishError}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[38%_62%]">
        <SpecEditor
          spec={active.spec}
          onSpecChange={(next) => updateActive({ spec: next })}
          routingRules={active.routing_rules}
          onRoutingChange={(next) => updateActive({ routing_rules: next })}
          expandedScreenId={expandedScreenId}
          onExpand={onExpand}
          currentPreviewIndex={previewIndex}
        />
        <PreviewPanel
          ref={previewRef}
          funnelId={funnel.id}
          variantId={active.id}
          screenCount={active.spec.length}
          currentIndex={previewIndex}
          screenIdAt={screenIdAt}
          onScreenShown={onScreenShown}
        />
      </div>
      <ChatBar
        variantId={active.id}
        spec={active.spec}
        scopeScreenId={expandedScreenId}
        onApply={(next) => updateActive({ spec: next })}
      />
      {publishedData && (
        <PublishedModal
          funnelId={funnel.id}
          funnelTitle={funnelTitle}
          url={publishedData.url}
          sourceUrls={publishedData.source_urls}
          onClose={() => setPublishedData(null)}
        />
      )}
    </main>
  );
}
