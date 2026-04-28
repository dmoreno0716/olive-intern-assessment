"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  HelpCircle,
  Lock,
  Plus,
  Sparkle,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { CatalogNode } from "@/lib/catalog/types";
import type { RoutingRules } from "@/lib/api/routing";
import { renderNode } from "@/lib/catalog/render";
import "@/lib/catalog";
import {
  deriveScreenTitle,
  duplicateScreen,
  getScreenProps,
  insertScreen,
  moveScreen,
  patchScreenProps,
  removeScreen,
  replaceChild,
  replaceScreen,
  uniqueId,
} from "@/lib/studio/specOps";
import { SCREEN_TEMPLATES } from "@/lib/studio/templates";
import { PrimitiveEditor } from "./PrimitiveEditor";

type Props = {
  spec: CatalogNode[];
  onSpecChange: (next: CatalogNode[]) => void;
  routingRules: RoutingRules;
  onRoutingChange: (next: RoutingRules) => void;
  expandedScreenId: string | null;
  onExpand: (id: string | null) => void;
  /** Index of the screen currently mounted in the preview iframe. */
  currentPreviewIndex?: number;
};

const SOURCE_OPTIONS: { id: string; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "IG" },
  { id: "facebook", label: "FB" },
  { id: "direct", label: "Direct" },
];

const KIND_ICON: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  intro: Sparkle,
  question: HelpCircle,
  gate: Lock,
  result: Star,
  custom: ChevronRight,
};

/**
 * Left panel of the Studio (State 3). Routing chips → ordered screen list
 * (drag to reorder, click to expand and edit primitives) → Add-screen
 * picker. All edits propagate up via `onSpecChange` / `onRoutingChange`;
 * persistence is the parent's responsibility.
 */
export function SpecEditor({
  spec,
  onSpecChange,
  routingRules,
  onRoutingChange,
  expandedScreenId,
  onExpand,
  currentPreviewIndex,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const onToggleSource = (id: string) => {
    const has = routingRules.sources.includes(id);
    onRoutingChange({
      ...routingRules,
      sources: has
        ? routingRules.sources.filter((s) => s !== id)
        : [...routingRules.sources, id],
    });
  };

  const onToggleDefault = () => {
    onRoutingChange({ ...routingRules, is_default: !routingRules.is_default });
  };

  const screenIdAt = (i: number): string | null => {
    const node = spec[i];
    if (!node) return null;
    const id = (node.props as { id?: unknown } | undefined)?.id;
    return typeof id === "string" ? id : null;
  };

  const onAddScreen = (templateId: string) => {
    const t = SCREEN_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    const tpl = t.build();
    const baseId =
      ((tpl.props as { id?: string } | undefined)?.id ?? t.id) || "screen";
    const id = uniqueId(spec, baseId);
    const next: CatalogNode = {
      ...tpl,
      props: { ...(tpl.props ?? {}), id },
    };
    onSpecChange(insertScreen(spec, spec.length, next));
    onExpand(id);
  };

  const onDuplicate = (i: number) => {
    onSpecChange(duplicateScreen(spec, i));
  };

  const onDelete = (i: number) => {
    if (spec.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      !confirm("Delete this screen? This can't be undone.")
    ) {
      return;
    }
    onSpecChange(removeScreen(spec, i));
  };

  const onScreenPropsChange = (i: number, patch: Partial<ReturnType<typeof getScreenProps>>) => {
    const node = spec[i];
    if (!node) return;
    onSpecChange(replaceScreen(spec, i, patchScreenProps(node, patch)));
  };

  const onChildChange = (
    screenIndex: number,
    slot: "body" | "footer",
    childIndex: number,
    nextChild: CatalogNode,
  ) => {
    const node = spec[screenIndex];
    if (!node) return;
    onSpecChange(
      replaceScreen(spec, screenIndex, replaceChild(node, slot, childIndex, nextChild)),
    );
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-[var(--border-c)] bg-[var(--surface)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border-c)] px-4 py-2.5">
        <h2 className="m-0 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Spec editor · {spec.length} screen{spec.length === 1 ? "" : "s"}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        <RoutingSection
          rules={routingRules}
          onToggleSource={onToggleSource}
          onToggleDefault={onToggleDefault}
        />

        <ol className="flex flex-col gap-1.5 px-3 py-3">
          {spec.map((node, i) => {
            const id = screenIdAt(i) ?? `screen-${i}`;
            const isExpanded = expandedScreenId === id;
            const isDropTarget = dropIndex === i && dragIndex !== null && dragIndex !== i;
            return (
              <li
                key={id}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  setDropIndex(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== i) {
                    onSpecChange(moveScreen(spec, dragIndex, i));
                  }
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onDragLeave={() => {
                  if (dropIndex === i) setDropIndex(null);
                }}
                className="relative"
              >
                {isDropTarget && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-[3px] left-2 right-2 h-[2px] rounded-full bg-[var(--olive-700)]"
                  />
                )}
                <ScreenRow
                  node={node}
                  index={i}
                  expanded={isExpanded}
                  isCurrent={currentPreviewIndex === i}
                  onClick={() => onExpand(isExpanded ? null : id)}
                  onDuplicate={() => onDuplicate(i)}
                  onDelete={spec.length > 1 ? () => onDelete(i) : undefined}
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                />
                {isExpanded && (
                  <ScreenDetail
                    node={node}
                    index={i}
                    onScreenPropsChange={(p) => onScreenPropsChange(i, p)}
                    onChildChange={(slot, ci, next) =>
                      onChildChange(i, slot, ci, next)
                    }
                  />
                )}
              </li>
            );
          })}
        </ol>

        <AddScreenMenu onSelect={onAddScreen} />
      </div>
    </aside>
  );
}

/* ============================ Routing chips ============================ */

function RoutingSection({
  rules,
  onToggleSource,
  onToggleDefault,
}: {
  rules: RoutingRules;
  onToggleSource: (id: string) => void;
  onToggleDefault: () => void;
}) {
  return (
    <section className="border-b border-[var(--border-c)] px-4 py-3.5">
      <h3 className="m-0 mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
        Variant routing
      </h3>
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--text-mute)]">
        <span className="font-mono text-[11px] text-[var(--text-faint)]">
          Serves:
        </span>
        {SOURCE_OPTIONS.map((s) => {
          const on = rules.sources.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggleSource(s.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] font-mono text-[11px] transition-colors ${
                on
                  ? "border-[var(--olive-700)] bg-[var(--olive-700)] text-[var(--cream-50)]"
                  : "border-[var(--border-c)] bg-[var(--surface)] text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {on && <Check className="h-3 w-3" strokeWidth={2.4} />}
              {s.label}
            </button>
          );
        })}
        <span aria-hidden className="px-1 text-[var(--border-strong)]">
          |
        </span>
        <span className="font-mono text-[11px] text-[var(--text-faint)]">
          Default:
        </span>
        <button
          type="button"
          onClick={onToggleDefault}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] font-mono text-[11px] transition-colors ${
            rules.is_default
              ? "border-[var(--olive-700)] bg-[var(--olive-700)] text-[var(--cream-50)]"
              : "border-[var(--border-c)] bg-[var(--surface)] text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {rules.is_default ? "Yes" : "No"}
        </button>
      </div>
    </section>
  );
}

/* ============================ Screen row ============================ */

function ScreenRow({
  node,
  index,
  expanded,
  isCurrent,
  onClick,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  node: CatalogNode;
  index: number;
  expanded: boolean;
  isCurrent: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { kind } = getScreenProps(node);
  const Icon = KIND_ICON[kind] ?? ChevronRight;
  const title = deriveScreenTitle(node, index);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center gap-2 rounded-[var(--r-md)] border px-2 py-2 transition-colors ${
        expanded
          ? "border-[var(--olive-700)] bg-[color-mix(in_oklch,var(--olive-500)_6%,var(--surface))]"
          : isCurrent
            ? "border-[var(--border-strong)] bg-[var(--surface-2)]"
            : "border-[var(--border-c)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
      }`}
    >
      {isCurrent && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--olive-700)]"
          title="Currently in preview"
        />
      )}
      <span
        className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-[var(--text-faint)] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        title="Drag to reorder"
        aria-label="Drag handle"
      >
        <GripVertical className="h-3.5 w-3.5" strokeWidth={1.6} />
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className="flex flex-1 cursor-pointer items-center gap-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--olive-700)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
      >
        <ScreenThumbnail node={node} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
            <Icon className="h-[11px] w-[11px]" strokeWidth={2} />
            {kind} · {index + 1}
          </div>
          <div className="truncate text-[13px] font-medium text-[var(--text)]">
            {title}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-faint)]" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-faint)]" strokeWidth={2} />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate screen"
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
        >
          <Copy className="h-3 w-3" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          disabled={!onDelete}
          title={onDelete ? "Delete screen" : "Cannot delete the only screen"}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--text-mute)] hover:bg-[var(--surface-2)] disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

const THUMB_W = 44;
const THUMB_H = 64;
const THUMB_SCREEN_W = 480;
const THUMB_SCREEN_H = 760;

function ScreenThumbnail({ node }: { node: CatalogNode }) {
  const scale = THUMB_W / THUMB_SCREEN_W;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[6px] border border-[var(--border-c)] bg-[var(--cream-100)]"
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      <div
        style={{
          width: THUMB_SCREEN_W,
          height: THUMB_SCREEN_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        {renderNode(node, "thumb")}
      </div>
    </div>
  );
}

/* ============================ Expanded detail ============================ */

function ScreenDetail({
  node,
  index,
  onScreenPropsChange,
  onChildChange,
}: {
  node: CatalogNode;
  index: number;
  onScreenPropsChange: (
    patch: Partial<ReturnType<typeof getScreenProps>>,
  ) => void;
  onChildChange: (
    slot: "body" | "footer",
    childIndex: number,
    next: CatalogNode,
  ) => void;
}) {
  const { id, kind, body, footer, showProgress, showBack } = getScreenProps(node);
  return (
    <div className="mb-2 flex flex-col gap-3.5 rounded-b-[var(--r-md)] border border-t-0 border-[var(--olive-700)] bg-[var(--surface)] px-3 py-3">
      <ScreenSettings
        id={id}
        kind={kind}
        showProgress={showProgress ?? true}
        showBack={showBack ?? true}
        onChange={onScreenPropsChange}
      />

      <Section title="Body">
        {body.length === 0 ? (
          <Empty>No body items.</Empty>
        ) : (
          body.map((child, ci) => (
            <PrimitiveEditor
              key={`b-${ci}`}
              node={child}
              onChange={(next) => onChildChange("body", ci, next)}
            />
          ))
        )}
      </Section>

      {footer && footer.length > 0 && (
        <Section title="Footer">
          {footer.map((child, ci) => (
            <PrimitiveEditor
              key={`f-${ci}`}
              node={child}
              onChange={(next) => onChildChange("footer", ci, next)}
            />
          ))}
        </Section>
      )}

      <p className="m-0 px-1 text-[11px] leading-snug text-[var(--text-faint)]">
        Inline edits save automatically. Use the chat at the bottom to add or
        rephrase whole primitives.
      </p>
      <span hidden>{index}</span>
    </div>
  );
}

function ScreenSettings({
  id,
  kind,
  showProgress,
  showBack,
  onChange,
}: {
  id: string;
  kind: string;
  showProgress: boolean;
  showBack: boolean;
  onChange: (
    patch: Partial<ReturnType<typeof getScreenProps>>,
  ) => void;
}) {
  return (
    <Section title="Screen">
      <div className="grid grid-cols-2 gap-2">
        <Field label="ID">
          <input
            value={id}
            onChange={(e) => onChange({ id: e.target.value })}
            className="w-full rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[12px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
          />
        </Field>
        <Field label="Kind">
          <select
            value={kind}
            onChange={(e) =>
              onChange({
                kind: e.target.value as ReturnType<typeof getScreenProps>["kind"],
              })
            }
            className="w-full rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-2 py-1.5 font-sans text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--olive-700)]"
          >
            {(["intro", "question", "gate", "result", "custom"] as const).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-4 pt-1">
        <Toggle
          label="Show progress"
          on={showProgress}
          onToggle={() => onChange({ showProgress: !showProgress })}
        />
        <Toggle
          label="Show back"
          on={showBack}
          onToggle={() => onChange({ showBack: !showBack })}
        />
      </div>
    </Section>
  );
}

/* ============================ Add screen menu ============================ */

function AddScreenMenu({ onSelect }: { onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-3 pb-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] border border-dashed border-[var(--border-strong)] bg-transparent px-3 py-3 font-sans text-[13px] font-medium text-[var(--text-mute)] hover:border-[var(--olive-700)] hover:text-[var(--olive-700)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add screen
        </button>
      ) : (
        <div className="rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] p-3 shadow-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Pick a starter
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-5 w-5 place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface-2)]"
              aria-label="Close picker"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {SCREEN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                className="flex items-start gap-2.5 rounded-[8px] border border-[var(--border-c)] bg-[var(--surface)] px-2.5 py-2 text-left hover:border-[var(--olive-700)] hover:bg-[var(--surface-2)]"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--olive-700)]"
                  style={{ background: "var(--accent-soft)" }}
                >
                  {(() => {
                    const Icon = KIND_ICON[t.kind] ?? ChevronRight;
                    return <Icon className="h-3.5 w-3.5" strokeWidth={2} />;
                  })()}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[13px] font-medium text-[var(--text)]">
                    {t.label}
                  </span>
                  <span className="text-[11.5px] leading-snug text-[var(--text-mute)]">
                    {t.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <p className="mx-1 mt-3 text-[11px] leading-snug text-[var(--text-faint)]">
            For a new screen described in plain English, use the chat
            refinement bar at the bottom.
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================ Building blocks ============================ */

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h4 className="m-0 px-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
        {title}
      </h4>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="px-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 rounded-[6px] bg-[var(--surface-2)] px-2 py-1.5 text-[11.5px] text-[var(--text-faint)]">
      {children}
    </p>
  );
}

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[12px] text-[var(--text-mute)]"
    >
      <span
        className={`relative inline-block h-[14px] w-[24px] rounded-full transition-colors ${
          on ? "bg-[var(--olive-700)]" : "bg-[var(--border-strong)]"
        }`}
        aria-hidden
      >
        <span
          className="absolute top-[1px] h-[12px] w-[12px] rounded-full bg-white transition-transform"
          style={{ left: 1, transform: on ? "translateX(10px)" : "translateX(0)" }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

