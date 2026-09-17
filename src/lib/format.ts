/** Presentation helpers shared by the on-screen templates and both exporters. */

export function dateRange(start: string, end: string, current = false): string {
  const from = start.trim();
  const to = current ? 'Present' : end.trim();
  if (!from && !to) return '';
  if (!from) return to;
  if (!to) return from;
  return `${from} – ${to}`;
}

/** Strips the protocol so links print as "amaraosei.dev", not "https://amaraosei.dev/". */
export function prettyUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function absoluteUrl(url: string): string {
  const v = url.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes('@') && !v.includes('/')) return `mailto:${v}`;
  return `https://${v}`;
}

export function joinNonEmpty(parts: Array<string | undefined | null>, sep = ' · '): string {
  return parts.map((p) => (p ?? '').trim()).filter(Boolean).join(sep);
}

/** Hex -> rgba(), used for tinted rules and sidebar washes. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Relative luminance test so text placed on the accent colour stays readable
 * when the user picks a pale accent.
 */
export function readableOn(hex: string): '#ffffff' | '#111111' {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return l > 0.5 ? '#111111' : '#ffffff';
}

export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
