"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Smartphone,
} from "lucide-react";

type Device = "mobile" | "desktop";
const DEVICE_DIMS: Record<Device, { label: string; w: number; h: number }> = {
  mobile: { label: "Mobile", w: 375, h: 700 },
  desktop: { label: "Desktop", w: 480, h: 780 },
};

export type PreviewHandle = {
  goto(index: number): void;
  restart(): void;
};

type Props = {
  funnelId: string;
  variantId: string;
  screenCount: number;
  /** Index of the screen the iframe is currently showing (0-based). */
  currentIndex: number;
  /** Map screen index → screen-id, used to sync into the left panel. */
  screenIdAt: (index: number) => string | null;
  /** Called when the iframe emits screen:shown. */
  onScreenShown: (index: number, screenId: string) => void;
};

/**
 * Right panel of the Studio. Mounts the public funnel page in an iframe
 * with `?preview=1&variant=...`, exposes pagination + a restart button +
 * a device toggle, and bridges screen:shown / preview:goto / preview:restart
 * messages between the iframe and the workbench.
 *
 * The iframe is the SAME route end users see — we never duplicate the
 * rendering pipeline. Iframe key reload is keyed on (variant, devicePx)
 * so a variant switch or device change reboots cleanly.
 */
export const PreviewPanel = forwardRef<PreviewHandle, Props>(function PreviewPanel(
  {
    funnelId,
    variantId,
    screenCount,
    currentIndex,
    screenIdAt,
    onScreenShown,
  },
  ref,
) {
  const [device, setDevice] = useState<Device>("mobile");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const dims = DEVICE_DIMS[device];
  const src = `/f/${funnelId}?variant=${variantId}&preview=1`;
  const iframeKey = `${variantId}-${device}`;

  /* Inbound: iframe → host. */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as { type?: string; payload?: unknown } | null;
      if (!data?.type) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (data.type === "funnel:loaded") {
        setIframeReady(true);
      } else if (data.type === "screen:shown") {
        const p = data.payload as { index?: number; screenId?: string } | undefined;
        if (typeof p?.index === "number" && typeof p?.screenId === "string") {
          onScreenShown(p.index, p.screenId);
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onScreenShown]);

  /* Outbound: parent → iframe. */
  const post = useCallback(
    (event: { type: string; payload?: unknown }) => {
      iframeRef.current?.contentWindow?.postMessage(event, "*");
    },
    [],
  );

  const goto = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, screenCount - 1));
      post({ type: "preview:goto", payload: { index: clamped } });
    },
    [post, screenCount],
  );
  const restart = useCallback(() => {
    post({ type: "preview:restart", payload: {} });
  }, [post]);

  useImperativeHandle(ref, () => ({ goto, restart }), [goto, restart]);

  const reset = () => {
    setIframeReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = src;
    }
  };

  const onPrev = () => goto(currentIndex - 1);
  const onNext = () => goto(currentIndex + 1);

  return (
    <section
      className="flex min-h-0 flex-col"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 50% 50%, color-mix(in oklch, var(--olive-500) 4%, transparent), transparent 70%), var(--bg)",
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <DeviceToggle device={device} onChange={setDevice} />
          <button
            type="button"
            onClick={() => {
              restart();
              reset();
            }}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--border-c)] bg-[var(--surface)] px-2.5 py-1.5 font-sans text-[12px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
            title="Restart from screen 1"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            Restart
          </button>
        </div>
        <Pagination
          current={currentIndex}
          total={screenCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </header>
      <div className="flex flex-1 items-center justify-center overflow-auto px-6 py-6">
        <div
          className="relative shrink-0 overflow-hidden bg-[#0a0a0a]"
          style={{
            width: dims.w + 16,
            height: dims.h + 16,
            padding: 8,
            borderRadius: 44,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06), 0 24px 56px rgba(0,0,0,0.10)",
            // Force a stacking context so the rounded mask actually clips the
            // iframe child — Safari sometimes lets iframe corners bleed
            // past `overflow: hidden` without this.
            isolation: "isolate",
          }}
        >
          <span
            aria-hidden
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2"
            style={{ width: 110, height: 26, background: "#0a0a0a", borderRadius: 999 }}
          />
          <div
            className="relative h-full w-full overflow-hidden bg-[var(--cream-100)]"
            style={{
              borderRadius: 36,
              // Same trick on the inner — guarantees the iframe is
              // composited inside the rounded layer.
              transform: "translateZ(0)",
              WebkitMaskImage:
                "radial-gradient(white, black)" /* enables corner clipping in older Safari */,
            }}
          >
            {!iframeReady && <PreviewLoading />}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={src}
              title="Funnel preview"
              className="h-full w-full border-0"
              style={{ borderRadius: 36 }}
              allow="clipboard-write"
              onLoad={() => setIframeReady(true)}
            />
          </div>
        </div>
      </div>
      <footer className="flex items-center justify-center gap-2 border-t border-[var(--border-c)] bg-[var(--surface)] px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--text-faint)]">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--olive-500)" }}
        />
        Preview · {dims.label} · {dims.w}×{dims.h} · interactive
        {screenIdAt(currentIndex) && (
          <>
            <span className="text-[var(--border-strong)]">·</span>
            <span>id={screenIdAt(currentIndex)}</span>
          </>
        )}
      </footer>
    </section>
  );
});

function DeviceToggle({
  device,
  onChange,
}: {
  device: Device;
  onChange: (d: Device) => void;
}) {
  return (
    <div className="inline-flex rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface-2)] p-[3px]">
      {(["mobile", "desktop"] as Device[]).map((d) => {
        const active = device === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-sans text-[12px] font-medium ${
              active
                ? "bg-[var(--surface)] text-[var(--text)] shadow-1"
                : "bg-transparent text-[var(--text-mute)]"
            }`}
          >
            <Smartphone className="h-3 w-3" strokeWidth={2} />
            {DEVICE_DIMS[d].label} · {DEVICE_DIMS[d].w}px
          </button>
        );
      })}
    </div>
  );
}

function Pagination({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const display = Math.min(current + 1, Math.max(total, 1));
  return (
    <div className="inline-flex items-center gap-1.5 rounded-[var(--r-md)] border border-[var(--border-c)] bg-[var(--surface)] px-1 py-0.5">
      <button
        type="button"
        onClick={onPrev}
        disabled={current <= 0}
        className="grid h-6 w-6 place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface-2)] disabled:opacity-30"
        aria-label="Previous screen"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span className="font-mono text-[11.5px] tabular-nums text-[var(--text)]">
        Screen {display} of {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={current >= total - 1}
        className="grid h-6 w-6 place-items-center rounded text-[var(--text-mute)] hover:bg-[var(--surface-2)] disabled:opacity-30"
        aria-label="Next screen"
      >
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

function PreviewLoading() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--cream-100)] font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ftext-f)]">
      Loading preview…
    </div>
  );
}
