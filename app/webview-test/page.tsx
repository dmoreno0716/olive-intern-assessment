"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  RotateCw,
  Send,
  Smartphone,
} from "lucide-react";
import {
  HOST_TO_IFRAME_EVENT_TYPES,
  HOST_TO_IFRAME_SAMPLE_PAYLOADS,
  IFRAME_TO_HOST_EVENT_TYPES,
  type HostToIframeEvent,
  type HostToIframeType,
  type IframeToHostType,
} from "@/lib/funnel/postMessage";

type LogRow = {
  id: number;
  ts: string;
  type: IframeToHostType;
  payload: unknown;
};

type Device = "iphone14" | "pixel7";
const DEVICE_DIMS: Record<Device, { label: string; w: number; h: number; ua: string }> =
  {
    iphone14: { label: "iPhone 14", w: 375, h: 812, ua: "iOS WKWebView" },
    pixel7: { label: "Pixel 7", w: 412, h: 915, ua: "Android Chrome WebView" },
  };

const MAX_ROWS = 200;

/**
 * Internal QA harness. Mounts the public funnel inside an iframe and
 * captures the postMessage protocol both ways. Spec:
 * design/WEBVIEW_HARNESS.md and design/designs/05_Public_Harness.html.
 */
export default function WebviewTestHarness() {
  const [urlInput, setUrlInput] = useState("");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("iphone14");
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [filter, setFilter] = useState<IframeToHostType | "all">("all");
  const [rows, setRows] = useState<LogRow[]>([]);
  const [sendType, setSendType] = useState<HostToIframeType>("user:auth");
  const [sendPayload, setSendPayload] = useState<string>(
    () => JSON.stringify(HOST_TO_IFRAME_SAMPLE_PAYLOADS["user:auth"], null, 2),
  );
  const [sendError, setSendError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const idRef = useRef(0);

  /* ────────── inbound postMessage capture ────────── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as { type?: string; payload?: unknown } | null;
      if (!data || typeof data.type !== "string") return;
      if (!IFRAME_TO_HOST_EVENT_TYPES.includes(data.type as IframeToHostType)) {
        return;
      }
      idRef.current += 1;
      const row: LogRow = {
        id: idRef.current,
        ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
        type: data.type as IframeToHostType,
        payload: data.payload ?? {},
      };
      setRows((prev) => {
        const next = [...prev, row];
        return next.length > MAX_ROWS ? next.slice(next.length - MAX_ROWS) : next;
      });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  /* ────────── load button ────────── */
  const loadIframe = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const finalUrl = trimmed.startsWith("http") ? trimmed : `http://${trimmed}`;
    setIframeUrl(finalUrl);
    setIframeKey((k) => k + 1);
    setIframeLoaded(false);
    setRows([]);
  }, [urlInput]);

  const reloadIframe = useCallback(() => {
    if (!iframeUrl) return;
    setIframeKey((k) => k + 1);
    setIframeLoaded(false);
  }, [iframeUrl]);

  /* ────────── send to iframe ────────── */
  const onSend = useCallback(() => {
    setSendError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(sendPayload);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "JSON parse error");
      return;
    }
    const event = { type: sendType, payload: parsed } as HostToIframeEvent;
    iframeRef.current?.contentWindow?.postMessage(event, "*");
  }, [sendPayload, sendType]);

  const onSendTypeChange = (t: HostToIframeType) => {
    setSendType(t);
    setSendPayload(JSON.stringify(HOST_TO_IFRAME_SAMPLE_PAYLOADS[t], null, 2));
    setSendError(null);
  };

  /* ────────── filter + counts ────────── */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const t of IFRAME_TO_HOST_EVENT_TYPES) c[t] = 0;
    for (const r of rows) c[r.type] = (c[r.type] ?? 0) + 1;
    return c;
  }, [rows]);

  const visibleRows = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.type === filter)),
    [rows, filter],
  );

  const dims = DEVICE_DIMS[device];

  return (
    <div className="min-h-dvh bg-[var(--n-50)]">
      <Topbar
        urlInput={urlInput}
        onUrlInput={setUrlInput}
        onLoad={loadIframe}
        onReload={reloadIframe}
        canReload={Boolean(iframeUrl)}
        iframeLoaded={iframeLoaded}
      />
      <div className="grid grid-cols-2 gap-5 px-6 py-5">
        <PhonePanel
          device={device}
          onDeviceChange={setDevice}
          dims={dims}
          iframeUrl={iframeUrl}
          iframeKey={iframeKey}
          iframeRef={iframeRef}
          onLoaded={() => setIframeLoaded(true)}
        />
        <div className="flex min-h-0 flex-col gap-5">
          <ConsolePanel
            rows={visibleRows}
            counts={counts}
            filter={filter}
            onFilterChange={setFilter}
          />
          <SendPanel
            sendType={sendType}
            onSendTypeChange={onSendTypeChange}
            sendPayload={sendPayload}
            onSendPayloadChange={setSendPayload}
            sendError={sendError}
            onSend={onSend}
            disabled={!iframeUrl}
          />
        </div>
      </div>
      <Simulators rows={rows} />
    </div>
  );
}

/* ============================ Topbar ============================ */

function Topbar({
  urlInput,
  onUrlInput,
  onLoad,
  onReload,
  canReload,
  iframeLoaded,
}: {
  urlInput: string;
  onUrlInput: (v: string) => void;
  onLoad: () => void;
  onReload: () => void;
  canReload: boolean;
  iframeLoaded: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3.5 border-b border-[var(--n-200)] bg-white px-6 py-3.5">
      <div className="mr-auto flex flex-col gap-px">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--n-500)]">
          Studio › Tools › Webview Test Harness
        </span>
        <h1 className="m-0 font-serif text-[24px] italic tracking-tight text-[var(--n-900)]">
          Webview Test Harness
        </h1>
      </div>
      <div className="flex max-w-[560px] flex-1 items-center">
        <div className="flex h-[34px] flex-1 items-center gap-1.5 rounded-l-md border border-r-0 border-[var(--n-200)] bg-[var(--n-100)] px-3 font-mono text-[12.5px] text-[var(--n-900)]">
          <span className="text-[var(--n-500)]">http(s)://</span>
          <input
            value={urlInput}
            onChange={(e) => onUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onLoad();
            }}
            placeholder="localhost:3000/f/<funnel-id>"
            className="flex-1 border-none bg-transparent text-[12.5px] text-[var(--n-900)] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onLoad}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-r-md border border-[var(--olive-700)] bg-[var(--olive-700)] px-4 font-sans text-[12.5px] font-medium text-[var(--cream-50)]"
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          Load
        </button>
      </div>
      <button
        type="button"
        onClick={onReload}
        disabled={!canReload}
        title="Reload iframe"
        className="grid h-[34px] w-[34px] place-items-center rounded-md border border-[var(--n-200)] bg-white text-[var(--n-600)] disabled:opacity-50"
      >
        <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      {iframeLoaded && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--success)]"
          style={{
            background: "color-mix(in oklch, var(--success) 12%, transparent)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--success)",
              boxShadow: "0 0 0 3px color-mix(in oklch, var(--success) 22%, transparent)",
            }}
          />
          Iframe live
        </span>
      )}
    </header>
  );
}

/* ============================ Phone panel ============================ */

function PhonePanel({
  device,
  onDeviceChange,
  dims,
  iframeUrl,
  iframeKey,
  iframeRef,
  onLoaded,
}: {
  device: Device;
  onDeviceChange: (d: Device) => void;
  dims: { label: string; w: number; h: number; ua: string };
  iframeUrl: string | null;
  iframeKey: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onLoaded: () => void;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--n-200)] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--n-200)] px-4 py-3">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--n-500)]">
          Funnel iframe · slow-burn
        </span>
        <DeviceToggle device={device} onChange={onDeviceChange} />
      </header>
      <div
        className="relative flex min-h-[780px] flex-1 items-center justify-center overflow-auto px-5 py-8"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, color-mix(in oklch, var(--olive-500) 5%, transparent), transparent 70%), var(--n-100)",
        }}
      >
        <div
          className="relative flex shrink-0 flex-col bg-[#0a0a0a] p-1.5"
          style={{
            width: dims.w,
            height: dims.h,
            borderRadius: 42,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.18)",
          }}
        >
          <span
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2"
            style={{
              width: 118,
              height: 30,
              background: "#0a0a0a",
              borderRadius: 999,
            }}
            aria-hidden
          />
          <div
            className="relative h-full w-full overflow-hidden bg-[var(--cream-100)]"
            style={{ borderRadius: 36 }}
          >
            {iframeUrl ? (
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={iframeUrl}
                onLoad={onLoaded}
                title="Funnel preview"
                className="h-full w-full border-0"
                allow="clipboard-write"
              />
            ) : (
              <div className="grid h-full w-full place-items-center px-8 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ftext-f)]">
                Enter a funnel URL above and tap Load
              </div>
            )}
          </div>
        </div>
        <div
          className="absolute bottom-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--n-200)] bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--n-500)] shadow-1"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--success)",
              boxShadow:
                "0 0 0 2px color-mix(in oklch, var(--success) 25%, transparent)",
            }}
          />
          {dims.label} · {dims.w}×{dims.h} · Portrait · {dims.ua}
        </div>
      </div>
    </section>
  );
}

function DeviceToggle({
  device,
  onChange,
}: {
  device: Device;
  onChange: (d: Device) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-[var(--n-200)] bg-[var(--n-100)] p-0.5">
      {(["iphone14", "pixel7"] as Device[]).map((d) => {
        const active = device === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-sans text-[12px] font-medium ${
              active
                ? "bg-white text-[var(--n-900)] shadow-1"
                : "bg-transparent text-[var(--n-600)]"
            }`}
          >
            <Smartphone className="h-3 w-3" strokeWidth={2} />
            {DEVICE_DIMS[d].label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================ Console panel ============================ */

function ConsolePanel({
  rows,
  counts,
  filter,
  onFilterChange,
}: {
  rows: LogRow[];
  counts: Record<string, number>;
  filter: IframeToHostType | "all";
  onFilterChange: (f: IframeToHostType | "all") => void;
}) {
  const screenIds = new Set<string>();
  for (const r of rows) {
    const p = r.payload as { screenId?: string } | null;
    if (p?.screenId) screenIds.add(p.screenId);
  }
  return (
    <section className="flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--n-200)] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--n-200)] px-4 py-3">
        <h3 className="m-0 font-serif text-[18px] italic tracking-tight text-[var(--n-900)]">
          postMessage console
        </h3>
        <span className="rounded bg-[var(--n-100)] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--n-600)]">
          {rows.length} events · {screenIds.size} screens
        </span>
      </header>
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--n-200)] bg-[var(--n-50)] px-3.5 py-2.5">
        <FilterChip
          active={filter === "all"}
          label="All"
          count={counts.all ?? 0}
          onClick={() => onFilterChange("all")}
        />
        {IFRAME_TO_HOST_EVENT_TYPES.map((t) => (
          <FilterChip
            key={t}
            active={filter === t}
            label={t}
            count={counts[t] ?? 0}
            onClick={() => onFilterChange(t)}
          />
        ))}
      </div>
      <div className="max-h-[560px] min-h-[340px] flex-1 overflow-auto bg-[var(--n-900)] font-mono text-[12px] text-[var(--n-200)]">
        {rows.length === 0 ? (
          <div className="px-4 py-6 font-mono text-[11px] uppercase tracking-[0.08em] text-[color-mix(in_oklch,var(--cream-50)_45%,transparent)]">
            (no events yet — load a funnel to start capturing)
          </div>
        ) : (
          rows.map((r) => <LogRowView key={r.id} row={r} />)
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.04em] ${
        active
          ? "border-[color-mix(in_oklch,var(--olive-500)_30%,transparent)] bg-[color-mix(in_oklch,var(--olive-500)_12%,white)] text-[var(--olive-700)]"
          : "border-[var(--n-200)] bg-white text-[var(--n-600)]"
      }`}
    >
      {label}
      <span
        className={`inline-block rounded-[3px] px-1 text-[10px] ${
          active
            ? "bg-[color-mix(in_oklch,var(--olive-500)_22%,transparent)] text-[var(--olive-700)]"
            : "bg-[var(--n-100)] text-[var(--n-600)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function LogRowView({ row }: { row: LogRow }) {
  const [open, setOpen] = useState(false);
  const summary = summarize(row);
  const tagClass = tagClassFor(row.type);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="grid w-full cursor-pointer grid-cols-[74px_1fr] gap-3 border-b border-[color-mix(in_oklch,var(--n-700)_60%,transparent)] px-3.5 py-2 text-left transition-colors hover:bg-[color-mix(in_oklch,var(--n-700)_35%,transparent)]"
    >
      <span className="font-mono text-[11px] tabular-nums text-[color-mix(in_oklch,var(--cream-50)_50%,transparent)]">
        {row.ts}
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-px text-[11.5px] tracking-[0.02em] ${tagClass}`}
          >
            {row.type}
          </span>
          <span className="text-[11.5px] text-[color-mix(in_oklch,var(--cream-50)_70%,transparent)]">
            {summary}
          </span>
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 shrink-0 text-[color-mix(in_oklch,var(--cream-50)_50%,transparent)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
        {open && (
          <pre
            className="overflow-auto rounded-[5px] border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] leading-[1.5] text-[var(--cream-50)]"
            style={{ whiteSpace: "pre" }}
          >
            {JSON.stringify(row.payload, null, 2)}
          </pre>
        )}
      </div>
    </button>
  );
}

function tagClassFor(t: IframeToHostType) {
  if (t === "cta:clicked")
    return "bg-[color-mix(in_oklch,var(--r1)_26%,transparent)] text-[var(--r1)]";
  if (t === "funnel:completed")
    return "bg-[color-mix(in_oklch,var(--success)_22%,transparent)] text-[color-mix(in_oklch,var(--success)_65%,var(--cream-50))]";
  if (t === "funnel:abandoned")
    return "bg-[color-mix(in_oklch,var(--error)_22%,transparent)] text-[color-mix(in_oklch,var(--error)_65%,var(--cream-50))]";
  return "bg-[color-mix(in_oklch,var(--olive-500)_22%,transparent)] text-[var(--olive-300)]";
}

function summarize(row: LogRow): string {
  const p = row.payload as Record<string, unknown> | null;
  if (!p) return "";
  switch (row.type) {
    case "screen:shown":
      return `screenId=${p.screenId} · index=${p.index}`;
    case "screen:completed":
      return `screenId=${p.screenId} · dwell=${p.dwellMs}ms`;
    case "answer:submitted": {
      const a = p.answer as { value?: unknown } | undefined;
      return `screenId=${p.screenId} · value=${JSON.stringify(a?.value)}`;
    }
    case "cta:clicked":
      return `${p.label} · action=${p.action}${p.href ? ` · href=${p.href}` : ""}`;
    case "funnel:loaded":
      return `${p.screenCount} screens · locale=${p.locale}`;
    case "funnel:completed":
      return `variant=${p.variant} · answers=${
        Object.keys((p.answers ?? {}) as Record<string, unknown>).length
      }`;
    case "funnel:abandoned":
      return `lastScreen=${p.lastScreenId} · ${p.durationMs}ms`;
    default:
      return "";
  }
}

/* ============================ Send panel ============================ */

function SendPanel({
  sendType,
  onSendTypeChange,
  sendPayload,
  onSendPayloadChange,
  sendError,
  onSend,
  disabled,
}: {
  sendType: HostToIframeType;
  onSendTypeChange: (t: HostToIframeType) => void;
  sendPayload: string;
  onSendPayloadChange: (v: string) => void;
  sendError: string | null;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--n-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--n-200)] px-4 py-3">
        <h3 className="m-0 font-serif text-[16px] italic tracking-tight text-[var(--n-900)]">
          Send to funnel
        </h3>
        <span className="font-mono text-[10.5px] tracking-[0.04em] text-[var(--n-500)]">
          Simulates native → webview postMessage
        </span>
      </header>
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <label className="grid grid-cols-[130px_1fr] items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--n-500)]">
            Event type
          </span>
          <select
            value={sendType}
            onChange={(e) => onSendTypeChange(e.target.value as HostToIframeType)}
            className="rounded-[5px] border border-[var(--n-200)] bg-[var(--n-50)] px-2.5 py-1.5 font-mono text-[12px] text-[var(--n-900)] outline-none"
          >
            {HOST_TO_IFRAME_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="grid grid-cols-[130px_1fr] items-start gap-2">
          <span className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--n-500)]">
            Payload (JSON)
          </span>
          <textarea
            value={sendPayload}
            onChange={(e) => onSendPayloadChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
            }}
            spellCheck={false}
            className={`min-h-[90px] resize-y rounded-[5px] border bg-[var(--n-900)] px-2.5 py-1.5 font-mono text-[11.5px] leading-[1.5] text-[var(--cream-50)] outline-none ${
              sendError ? "border-[var(--error)]" : "border-[var(--n-800)]"
            }`}
          />
        </label>
      </div>
      <footer className="flex items-center justify-between gap-2.5 border-t border-[var(--n-200)] bg-[var(--n-50)] px-4 py-2.5">
        <span className="font-mono text-[10.5px] tracking-[0.04em] text-[var(--n-500)]">
          {sendError ? `parse error: ${sendError}` : "⌘↵ to post"}
        </span>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[var(--olive-700)] bg-[var(--olive-700)] px-3.5 py-1.5 font-sans text-[12.5px] font-medium text-[var(--cream-50)] disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          Post to iframe
        </button>
      </footer>
    </section>
  );
}

/* ============================ Simulators ============================ */

const SIMULATORS = [
  {
    type: "cta:clicked" as IframeToHostType,
    title: "StoreKit / Play Billing",
    desc: "Routes the conversion event to the in-app purchase handler.",
    response: (p: Record<string, unknown>) =>
      `→ StoreKit.purchase(${JSON.stringify(p.label)}) → txn ${randomTxn()}`,
    tag: "cta",
  },
  {
    type: "funnel:completed" as IframeToHostType,
    title: "Analytics",
    desc: "POSTs the answers blob to the analytics ingestion endpoint.",
    response: (p: Record<string, unknown>) =>
      `→ analytics.track('funnel_completed', { variant: ${JSON.stringify(p.variant)}, answers: ${
        Object.keys((p.answers ?? {}) as Record<string, unknown>).length
      } keys })`,
    tag: "completed",
  },
  {
    type: "funnel:abandoned" as IframeToHostType,
    title: "UserDefaults / SharedPrefs",
    desc: "Persists partial answers so the user can resume on next launch.",
    response: (p: Record<string, unknown>) =>
      `→ UserDefaults.setObject({ lastScreenId: ${JSON.stringify(p.lastScreenId)}, durationMs: ${p.durationMs} })`,
    tag: "abandoned",
  },
  {
    type: "answer:submitted" as IframeToHostType,
    title: "POST /v1/answers",
    desc: "Forwards each answer to the backend for downstream personalization.",
    response: (p: Record<string, unknown>) => {
      const a = p.answer as { value?: unknown };
      return `→ POST /v1/answers { screenId: ${JSON.stringify(p.screenId)}, value: ${JSON.stringify(a?.value)} } → 200`;
    },
    tag: "answer",
  },
];

function Simulators({ rows }: { rows: LogRow[] }) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const onSimulate = (type: IframeToHostType) => {
    const matching = [...rows].reverse().find((r) => r.type === type);
    if (!matching) {
      setResponses((prev) => ({
        ...prev,
        [type]: `(no ${type} event captured yet — take the funnel first)`,
      }));
      return;
    }
    const sim = SIMULATORS.find((s) => s.type === type)!;
    setResponses((prev) => ({
      ...prev,
      [type]: sim.response(matching.payload as Record<string, unknown>),
    }));
  };
  return (
    <section className="mx-6 mb-8 overflow-hidden rounded-[var(--r-lg)] border border-[var(--n-200)] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3.5 border-b border-[var(--n-200)] px-5 py-3.5">
        <h3 className="m-0 font-serif text-[20px] italic tracking-tight text-[var(--n-900)]">
          Native handler simulators
        </h3>
        <p className="m-0 max-w-[520px] text-[12px] leading-snug text-[var(--n-600)]">
          Each card pretends to be the iOS/Android handler the app would
          mount. Click to read the most recent matching event from the log
          and render a mock response.
        </p>
        <div className="inline-flex rounded-md border border-[var(--n-200)] bg-[var(--n-100)] p-0.5">
          {(["ios", "android"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-sans text-[12px] font-medium ${
                platform === p
                  ? "bg-white text-[var(--n-900)] shadow-1"
                  : "bg-transparent text-[var(--n-600)]"
              }`}
            >
              {p === "ios" ? "iOS" : "Android"}
            </button>
          ))}
        </div>
      </header>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
        {SIMULATORS.map((s) => (
          <div
            key={s.type}
            className="flex flex-col gap-2 border-b border-r border-[var(--n-200)] px-4 py-3 last:border-r-0"
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-px font-mono text-[10.5px] tracking-[0.02em] ${
                  s.tag === "cta"
                    ? "bg-[color-mix(in_oklch,var(--r1)_14%,white)] text-[var(--r1)]"
                    : s.tag === "completed"
                      ? "bg-[color-mix(in_oklch,var(--success)_14%,white)] text-[var(--success)]"
                      : "bg-[color-mix(in_oklch,var(--olive-500)_12%,white)] text-[var(--olive-700)]"
                }`}
              >
                {s.type}
              </span>
              <span className="font-sans text-[14px] font-medium text-[var(--n-900)]">
                {s.title}
              </span>
            </div>
            <p className="m-0 text-[12px] leading-snug text-[var(--n-600)]">
              {s.desc}
            </p>
            <button
              type="button"
              onClick={() => onSimulate(s.type)}
              className="inline-flex items-center gap-2 self-start rounded-md border border-[var(--n-300)] bg-white px-2.5 py-1.5 font-sans text-[12.5px] font-medium text-[var(--n-900)]"
            >
              <Check className="h-3 w-3 text-[var(--n-700)]" strokeWidth={2.4} />
              Simulate {platform === "ios" ? "iOS" : "Android"}
            </button>
            {responses[s.type] && (
              <div className="rounded-md bg-[var(--n-900)] px-2.5 py-2 font-mono text-[11px] leading-[1.5] text-[var(--cream-50)]">
                <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: "color-mix(in oklch, var(--cream-50) 55%, transparent)" }}>
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: "var(--success)",
                      boxShadow:
                        "0 0 0 3px color-mix(in oklch, var(--success) 25%, transparent)",
                    }}
                  />
                  Response
                </div>
                {responses[s.type]}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function randomTxn(): string {
  return `txn_${Math.random().toString(36).slice(2, 10)}`;
}
