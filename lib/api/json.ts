import { ZodError, type ZodType } from "zod";

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function created<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function badRequest(message: string, details?: unknown): Response {
  return Response.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: message }, { status: 404 });
}

export function serverError(message: string, details?: unknown): Response {
  return Response.json({ error: message, details }, { status: 500 });
}

export async function readJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: badRequest("Validation failed", flattenZodError(parsed.error)),
    };
  }
  return { data: parsed.data };
}

export function flattenZodError(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}
