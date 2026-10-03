/** Only allow same-origin relative paths as post-sign-in destinations. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
