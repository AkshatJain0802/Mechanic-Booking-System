// Strips genuinely dangerous content (HTML tags, script/style blocks, and
// javascript:/data: protocol handlers) but preserves normal characters like
// &, ", ' so stored text stays human-readable. Output escaping for XSS is
// handled at render time by React, not by mangling the data at rest.
export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "") // drop script/style blocks
    .replace(/<[^>]*>/g, "") // strip any remaining HTML tags
    .replace(/\b(javascript|data|vbscript)\s*:/gi, "") // neutralize dangerous protocols
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  stringFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of stringFields) {
    if (field in result) {
      (result as Record<string, unknown>)[field as string] = sanitizeString(result[field]);
    }
  }
  return result;
}
