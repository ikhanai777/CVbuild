/** Short, collision-safe ids for list items. Works in browsers and in tests. */
export function uid(prefix = ''): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const raw =
    g.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw.slice(0, 12)}` : raw.slice(0, 12);
}
