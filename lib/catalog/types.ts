/**
 * Catalog node — the nested spec format documented in design/CATALOG.md.
 * `kind` is the catalog component name; `props` matches that component's
 * Zod schema. Nested children live inside `props` (e.g. Screen.body,
 * Stack.children).
 */
export type CatalogNode = {
  kind: string;
  props?: Record<string, unknown>;
};
