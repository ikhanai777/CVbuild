/**
 * PDF export.
 *
 * The CV is printed through the browser's own print pipeline rather than being
 * rasterised by a canvas library. That keeps the text selectable and searchable
 * in the resulting PDF — an image-based PDF is unreadable to every applicant
 * tracking system, which would quietly undo the rest of the app's work.
 *
 * When the app is embedded in an iframe (as it is when hosted on a page that
 * frames it), `window.print()` is commonly blocked by the frame sandbox. In
 * that case the CV is written into a new top-level window, which carries no
 * such restriction, and printed from there.
 */
import type { Resume } from '../../types/resume';

const PAGE_STYLE_ID = 'cvbuild-page-rule';

const PAGE_DIMENSIONS = {
  A4: '210mm 297mm',
  Letter: '215.9mm 279.4mm',
} as const;

/**
 * The @page rule has to be written at print time because the paper size is a
 * user setting and @page cannot read CSS custom properties.
 */
export function applyPageRule(resume: Resume): void {
  let style = document.getElementById(PAGE_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = PAGE_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${PAGE_DIMENSIONS[resume.settings.paperSize]}; margin: 0; }`;
}

function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // A cross-origin parent throws on access, which itself means we are framed.
    return true;
  }
}

/** Same-origin stylesheet rules, inlined so the new window needs no network. */
function collectStyles(): { css: string; externalHrefs: string[] } {
  let css = '';
  const externalHrefs: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += `${rule.cssText}\n`;
    } catch {
      // Cross-origin (the webfont stylesheet) — re-link it by href instead.
      if (sheet.href) externalHrefs.push(sheet.href);
    }
  }
  return { css, externalHrefs };
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * Writes the CV into a fresh top-level window and prints from there.
 * Returns false when the window could not be opened (popup blocker), so the
 * caller can fall back to printing in place.
 */
function printInNewWindow(resume: Resume): boolean {
  const source = document.querySelector('.print-root');
  if (!source) return false;

  // Opened synchronously from the originating click so popup blockers allow it.
  const win = window.open('', '_blank');
  if (!win) return false;

  const { css, externalHrefs } = collectStyles();
  const title = fileTitle(resume);

  win.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeAttr(title)}</title>
${externalHrefs.map((href) => `<link rel="stylesheet" href="${escapeAttr(href)}" />`).join('\n')}
<style>${css}</style>
<style>
  /* The CV is the whole document here, so undo the on-screen framing. */
  @page { size: ${PAGE_DIMENSIONS[resume.settings.paperSize]}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; height: auto; }
  .cv-page { box-shadow: none; border-radius: 0; margin: 0 auto; }
  @media print { .cv-page { margin: 0; } }
</style>
</head>
<body>${source.innerHTML}</body>
</html>`);
  win.document.close();

  // Wait for the webfont and layout before opening the dialog, or the first
  // page can be measured against fallback metrics and break in the wrong place.
  const print = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === 'complete') window.setTimeout(print, 250);
  else win.addEventListener('load', () => window.setTimeout(print, 250));

  return true;
}

export interface PrintOptions {
  /** Shown once before the dialog opens, if the caller wants to explain "Save as PDF". */
  onBeforePrint?: () => void;
}

export function printResume(resume: Resume, options: PrintOptions = {}): void {
  applyPageRule(resume);
  document.title = fileTitle(resume);
  options.onBeforePrint?.();

  if (isEmbedded() && printInNewWindow(resume)) return;

  // Let the style and title land before the (synchronous, blocking) dialog.
  window.setTimeout(() => window.print(), 60);
}

function fileTitle(resume: Resume): string {
  const name = resume.basics.fullName || resume.meta.name || 'CV';
  const role = resume.basics.headline ? ` — ${resume.basics.headline}` : '';
  return `${name}${role} — CV`;
}
