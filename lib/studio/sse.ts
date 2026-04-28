/**
 * Minimal text/event-stream reader for our /api/generate endpoint.
 * The server emits `data: <json>\n\n` per event. We parse each event JSON
 * blob and forward to a callback.
 */
export async function readSSEStream<E>(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: E) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (abortSignal?.aborted) {
        await reader.cancel();
        return;
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of block.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            onEvent(JSON.parse(json) as E);
          } catch {
            // Ignore malformed event JSON; the server is the source of truth.
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
