import type { CatalogNode } from "@/lib/catalog/types";

/**
 * Walk an in-flight JSON-array buffer (top-level `[ {Screen}, {Screen}, … ]`)
 * and extract every complete Screen object that has been received so far.
 *
 * Used by the Studio's State-2 filmstrip to materialize phone-frame cards
 * as the LLM streams the spec back. Tolerant of leading whitespace and a
 * markdown code fence (the system prompt forbids them, but the model
 * occasionally slips). Stops cleanly at the first incomplete object —
 * subsequent calls with more data will pick up where this one left off.
 */
export function extractCompleteScreens(buffer: string): CatalogNode[] {
  const screens: CatalogNode[] = [];
  let i = 0;

  while (i < buffer.length && /\s/.test(buffer[i]!)) i++;

  if (buffer.slice(i, i + 3) === "```") {
    const newlineIdx = buffer.indexOf("\n", i);
    if (newlineIdx === -1) return screens;
    i = newlineIdx + 1;
    while (i < buffer.length && /\s/.test(buffer[i]!)) i++;
  }

  if (buffer[i] !== "[") return screens;
  i++;

  while (i < buffer.length) {
    while (i < buffer.length && (/\s/.test(buffer[i]!) || buffer[i] === ",")) {
      i++;
    }
    if (i >= buffer.length) break;
    if (buffer[i] === "]") break;
    if (buffer[i] !== "{") break;

    const start = i;
    let depth = 0;
    let inString = false;
    let escape = false;
    let closed = false;

    for (; i < buffer.length; i++) {
      const c = buffer[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          i++;
          closed = true;
          break;
        }
      }
    }

    if (!closed) break;

    const slice = buffer.slice(start, i);
    try {
      const obj = JSON.parse(slice) as { kind?: unknown };
      if (obj && typeof obj === "object" && obj.kind === "Screen") {
        screens.push(obj as CatalogNode);
      }
    } catch {
      break;
    }
  }

  return screens;
}
