"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { SessionAnalytics } from "@/app/api/funnels/[id]/analytics/route";

const RESULT_COLORS = ["var(--r1)", "var(--r2)", "var(--r3)", "var(--r4)", "var(--r5)"];

const SOURCE_DOT: Record<string, string> = {
  tiktok: "oklch(0.62 0.13 320)",
  instagram: "oklch(0.62 0.13 30)",
  facebook: "oklch(0.55 0.13 245)",
  direct: "oklch(0.55 0.04 130)",
};

type Props = {
  rows: SessionAnalytics[];
  showVariantColumn: boolean;
  showResultColumn: boolean;
};

type SortKey =
  | "started_at"
  | "variant"
  | "source"
  | "screens"
  | "result"
  | "dwell"
  | "cta";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

/**
 * Sortable, filterable session table with row expansion. Filters: source,
 * variant (when shown), CTA-clicked, search by session id. Sorting is
 * single-key. Pagination is 50/page. Each row expands to show per-screen
 * answers + dwell breakdown + session metadata.
 */
export function ResponsesTable({
  rows,
  showVariantColumn,
  showResultColumn,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [variantFilter, setVariantFilter] = useState<string | null>(null);
  const [ctaFilter, setCtaFilter] = useState<"yes" | "no" | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("started_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows;
    if (sourceFilter) {
      out = out.filter((r) => (r.source ?? "direct") === sourceFilter);
    }
    if (variantFilter) {
      out = out.filter((r) => r.variant_id === variantFilter);
    }
    if (ctaFilter) {
      out = out.filter((r) =>
        ctaFilter === "yes" ? r.cta_clicked : !r.cta_clicked,
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.session_id.toLowerCase().includes(q) ||
          (r.result?.label?.toLowerCase().includes(q) ?? false),
      );
    }
    return [...out].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "started_at":
          return dir * (a.started_at < b.started_at ? -1 : 1);
        case "variant":
          return dir * a.variant_name.localeCompare(b.variant_name);
        case "source":
          return dir * (a.source ?? "direct").localeCompare(b.source ?? "direct");
        case "screens":
          return dir * (a.screens_completed - b.screens_completed);
        case "result":
          return dir * (a.result?.label ?? "").localeCompare(b.result?.label ?? "");
        case "dwell":
          return dir * (a.total_dwell_ms - b.total_dwell_ms);
        case "cta":
          return dir * (Number(a.cta_clicked) - Number(b.cta_clicked));
      }
    });
  }, [rows, sourceFilter, variantFilter, ctaFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const variantOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.variant_id, r.variant_name);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.source ?? "direct");
    return [...set];
  }, [rows]);

  const onSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const anyFilter =
    sourceFilter || variantFilter || ctaFilter || search.trim().length > 0;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border-c)] bg-[var(--surface)]">
      {/* ────── toolbar ────── */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border-c)] bg-[var(--surface)] px-5 py-3">
        <FilterChip
          label="Source"
          value={sourceFilter}
          options={sourceOptions.map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
          onChange={(v) => {
            setSourceFilter(v);
            setPage(0);
          }}
        />
        {showVariantColumn ? (
          <FilterChip
            label="Variant"
            value={variantFilter}
            options={variantOptions.map((v) => ({
              value: v.id,
              label: `Variant ${v.name}`,
            }))}
            onChange={(v) => {
              setVariantFilter(v);
              setPage(0);
            }}
          />
        ) : null}
        <FilterChip
          label="CTA"
          value={ctaFilter}
          options={[
            { value: "yes", label: "Clicked" },
            { value: "no", label: "Not clicked" },
          ]}
          onChange={(v) => {
            setCtaFilter(v as "yes" | "no" | null);
            setPage(0);
          }}
        />
        {anyFilter ? (
          <button
            type="button"
            onClick={() => {
              setSourceFilter(null);
              setVariantFilter(null);
              setCtaFilter(null);
              setSearch("");
              setPage(0);
            }}
            className="font-sans text-[11.5px] text-[var(--text-faint)] underline underline-offset-[2px] hover:text-[var(--text-mute)]"
          >
            Clear
          </button>
        ) : null}
        <div className="flex-1" />
        <div className="flex h-[30px] w-[200px] items-center gap-1.5 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface-2)] px-2.5">
          <Search className="h-3.5 w-3.5 text-[var(--text-faint)]" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search session id"
            className="flex-1 border-0 bg-transparent font-sans text-[12.5px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
          <span className="font-serif text-[20px] italic text-[var(--text-mute)]">
            No matching responses
          </span>
          <span className="font-sans text-[12.5px] text-[var(--text-faint)]">
            Try clearing your filters.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <Th sortable active={sortKey === "started_at"} dir={sortDir} onClick={() => onSort("started_at")}>
                  Timestamp
                </Th>
                {showVariantColumn ? (
                  <Th sortable active={sortKey === "variant"} dir={sortDir} onClick={() => onSort("variant")}>
                    Variant
                  </Th>
                ) : null}
                <Th sortable active={sortKey === "source"} dir={sortDir} onClick={() => onSort("source")}>
                  Source
                </Th>
                <Th sortable active={sortKey === "screens"} dir={sortDir} onClick={() => onSort("screens")} align="right">
                  Screens
                </Th>
                {showResultColumn ? (
                  <Th sortable active={sortKey === "result"} dir={sortDir} onClick={() => onSort("result")}>
                    Result
                  </Th>
                ) : null}
                <Th sortable active={sortKey === "dwell"} dir={sortDir} onClick={() => onSort("dwell")} align="right">
                  Dwell
                </Th>
                <Th sortable active={sortKey === "cta"} dir={sortDir} onClick={() => onSort("cta")}>
                  CTA
                </Th>
                <Th>{" "}</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const expanded = expandedId === r.session_id;
                return (
                  <RowGroup key={r.session_id}>
                    <tr
                      onClick={() =>
                        setExpandedId((cur) =>
                          cur === r.session_id ? null : r.session_id,
                        )
                      }
                      className={`cursor-pointer transition-colors hover:bg-[var(--surface-2)] ${
                        expanded ? "bg-[var(--surface-2)]" : ""
                      }`}
                    >
                      <Td className="font-mono text-[12px] text-[var(--text-mute)]">
                        {formatTimestamp(r.started_at)}
                      </Td>
                      {showVariantColumn ? (
                        <Td>
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text)]">
                            <span
                              className="h-1.5 w-1.5 rounded-[2px]"
                              style={{ background: "var(--olive-500)" }}
                            />
                            {r.variant_name}
                          </span>
                        </Td>
                      ) : null}
                      <Td>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--text-mute)]"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-[2px]"
                            style={{
                              background:
                                SOURCE_DOT[r.source ?? "direct"] ??
                                "var(--text-faint)",
                            }}
                          />
                          {r.source ?? "direct"}
                        </span>
                      </Td>
                      <Td align="right" className="font-mono tabular-nums text-[12.5px] text-[var(--text)]">
                        {r.screens_completed} / {r.total_screens}
                      </Td>
                      {showResultColumn ? (
                        <Td>
                          {r.result ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-[3px]"
                                style={{
                                  background: RESULT_COLORS[r.result.color_index],
                                }}
                              />
                              <span className="font-serif text-[14px] italic text-[var(--text)]">
                                {r.result.label}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-faint)]">—</span>
                          )}
                        </Td>
                      ) : null}
                      <Td align="right" className="font-mono tabular-nums text-[12.5px] text-[var(--text)]">
                        {formatDwell(r.total_dwell_ms)}
                      </Td>
                      <Td>
                        {r.cta_clicked ? (
                          <span className="inline-flex items-center gap-1 text-[12.5px] text-[var(--success)]">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12.5px] text-[var(--text-faint)]">
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                            No
                          </span>
                        )}
                      </Td>
                      <Td align="right">
                        <span
                          className="inline-grid h-[18px] w-[18px] place-items-center rounded-[4px] border border-[var(--border-c)] bg-[var(--surface)] text-[var(--text-mute)] transition-transform"
                          style={{
                            transform: expanded ? "rotate(90deg)" : undefined,
                            background: expanded
                              ? "var(--olive-700)"
                              : undefined,
                            color: expanded ? "var(--cream-50)" : undefined,
                            borderColor: expanded
                              ? "var(--olive-700)"
                              : undefined,
                          }}
                        >
                          <ChevronRight className="h-2.5 w-2.5" strokeWidth={2} />
                        </span>
                      </Td>
                    </tr>
                    {expanded ? (
                      <tr>
                        <td
                          colSpan={
                            3 +
                            (showVariantColumn ? 1 : 0) +
                            (showResultColumn ? 1 : 0) +
                            3
                          }
                          className="border-b border-[var(--border-c)] bg-[var(--surface-2)] p-0"
                        >
                          <DetailPane row={r} />
                        </td>
                      </tr>
                    ) : null}
                  </RowGroup>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ────── pagination ────── */}
      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between border-t border-[var(--border-c)] px-5 py-3 font-mono text-[11.5px] text-[var(--text-mute)]">
          <span className="tabular-nums">
            {filtered.length} sessions · page {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <PageBtn
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous"
            >
              <ChevronLeft className="h-3 w-3" strokeWidth={2} />
            </PageBtn>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PageBtn
                key={i}
                active={i === safePage}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </PageBtn>
            ))}
            <PageBtn
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next"
            >
              <ChevronRight className="h-3 w-3" strokeWidth={2} />
            </PageBtn>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============================== Pieces ============================== */

function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Th({
  children,
  align,
  sortable,
  active,
  dir,
  onClick,
}: {
  children: React.ReactNode;
  align?: "right";
  sortable?: boolean;
  active?: boolean;
  dir?: SortDir;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={`sticky top-0 border-b border-[var(--border-c)] bg-[var(--surface-2)] px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)] ${
        align === "right" ? "text-right" : "text-left"
      } ${sortable ? "cursor-pointer hover:text-[var(--text)]" : ""}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && active ? (
          dir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-[var(--text)]" strokeWidth={2} />
          ) : (
            <ChevronDown className="h-3 w-3 text-[var(--text)]" strokeWidth={2} />
          )
        ) : null}
      </span>
    </th>
  );
}

function Td({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-[var(--border-c)] px-3.5 py-2.5 align-middle ${
        align === "right" ? "text-right" : ""
      } ${className ?? ""}`}
    >
      {children}
    </td>
  );
}

function FilterChip<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T | null) => void;
}) {
  const active = value !== null;
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        className={`appearance-none rounded-full border bg-[var(--surface-2)] py-[5px] pl-3 pr-8 font-sans text-[12px] cursor-pointer ${
          active
            ? "border-[color-mix(in_oklch,var(--olive-500)_35%,transparent)] bg-[var(--accent-soft)] text-[var(--olive-700)]"
            : "border-[var(--border-c)] text-[var(--text-mute)] hover:text-[var(--text)]"
        }`}
      >
        <option value="">{label}: all</option>
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {label}: {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...rest}
      className={`grid h-[26px] min-w-[26px] place-items-center rounded-[5px] px-2 font-mono text-[11.5px] tabular-nums ${
        active
          ? "border border-[var(--olive-700)] bg-[var(--olive-700)] text-[var(--cream-50)]"
          : "text-[var(--text-mute)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function DetailPane({ row }: { row: SessionAnalytics }) {
  const totalDwell =
    row.answers.reduce((s, a) => s + a.dwell_ms, 0) || 1;
  return (
    <div
      className="grid grid-cols-1 gap-6 px-6 pb-5 pt-4 md:grid-cols-[1.4fr_1fr]"
      style={{
        background:
          "linear-gradient(to bottom, color-mix(in oklch, var(--accent-soft) 60%, var(--surface-2)), var(--surface-2) 12px)",
        borderTop:
          "1px solid color-mix(in oklch, var(--olive-500) 25%, var(--border-c))",
      }}
    >
      <div className="flex flex-col gap-2.5">
        <Sub>Answers</Sub>
        {row.answers.length === 0 ? (
          <div className="rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-2.5 font-sans text-[12px] text-[var(--text-faint)]">
            No questions answered.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {row.answers.map((a, i) => (
              <div
                key={a.screen_id + i}
                className="grid grid-cols-[auto_1fr] items-start gap-2.5 rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-3 py-2.5"
              >
                <span className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] leading-[1.3] text-[var(--text-mute)]">
                    {a.screen_label}
                  </span>
                  <span className="text-[13px] font-medium leading-[1.3] text-[var(--text)]">
                    {a.fields.length === 0 ? (
                      <span className="text-[var(--text-faint)]">—</span>
                    ) : (
                      a.fields.map((f, fi) => (
                        <span
                          key={f.field}
                          className="mr-1 inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--olive-700)]"
                        >
                          {f.label ?? formatValue(f.value)}
                          {fi < a.fields.length - 1 ? "" : ""}
                        </span>
                      ))
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <Sub>Dwell breakdown</Sub>
        <div className="flex flex-col gap-1.5">
          {row.answers.map((a, i) => (
            <div
              key={a.screen_id + i}
              className="grid grid-cols-[18px_1fr_auto] items-center gap-2"
            >
              <span className="font-mono text-[10px] text-[var(--text-faint)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="truncate font-sans text-[12px] text-[var(--text)]">
                  {a.screen_label}
                </span>
                <span
                  className="h-[5px] overflow-hidden rounded-full"
                  style={{ background: "var(--surface)" }}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(a.dwell_ms / totalDwell) * 100}%`,
                      background: "var(--olive-500)",
                    }}
                  />
                </span>
              </div>
              <span className="min-w-[42px] text-right font-mono text-[11.5px] tabular-nums text-[var(--text)]">
                {formatDwell(a.dwell_ms)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-col gap-1.5 rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] p-3 font-mono text-[11px] text-[var(--text-mute)]">
          <Meta k="Session ID" v={row.session_id} />
          <Meta
            k="Started"
            v={new Date(row.started_at).toLocaleString()}
          />
          <Meta
            k="Outcome"
            v={
              row.completed_at
                ? "Completed"
                : row.abandoned_at
                  ? "Abandoned"
                  : "In progress"
            }
          />
          <Meta k="Total dwell" v={formatDwell(row.total_dwell_ms)} />
        </div>
      </div>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="m-0 mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
      {children}
    </h4>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2.5">
      <span className="text-[10px] uppercase tracking-[0.04em] text-[var(--text-faint)]">
        {k}
      </span>
      <span className="text-[var(--text)] tabular-nums">{v}</span>
    </div>
  );
}

/* ============================== utils ============================== */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDwell(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
