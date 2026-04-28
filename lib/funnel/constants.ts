/**
 * Runtime constants for the public funnel page. Tunable so QA can shorten
 * the dwell-helper window without touching component code.
 */

export const DWELL_HELPER_THRESHOLD_MS = 8000;

/** Postmessage emitted to `window.parent` from the funnel iframe. */
export const POST_MESSAGE_TARGET = "*";

/** The host origin we accept inbound `message` events from when the funnel
 * runs inside a webview iframe. In dev we accept any origin so the local
 * harness works. */
export const HOST_ORIGIN_ALLOWLIST = ["*"] as const;
