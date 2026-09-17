/**
 * PDF export.
 *
 * The CV is printed through the browser's own print pipeline rather than being
 * rasterised by a canvas library. That keeps the text selectable and searchable
 * in the resulting PDF — an image-based PDF is unreadable to every applicant
 * tracking system, which would quietly undo the rest of the app's work.
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

export interface PrintOptions {
  /** Shown once before the dialog opens, if the caller wants to explain "Save as PDF". */
  onBeforePrint?: () => void;
}

export function printResume(resume: Resume, options: PrintOptions = {}): void {
  applyPageRule(resume);
  document.title = fileTitle(resume);
  options.onBeforePrint?.();
  // Let the style and title land before the (synchronous, blocking) dialog.
  window.setTimeout(() => window.print(), 60);
}

function fileTitle(resume: Resume): string {
  const name = resume.basics.fullName || resume.meta.name || 'CV';
  const role = resume.basics.headline ? ` — ${resume.basics.headline}` : '';
  return `${name}${role} — CV`;
}
