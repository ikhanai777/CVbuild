/**
 * Word (.docx) export.
 *
 * The file is built as a real Word document — styled paragraphs, tab stops and
 * bullet lists — not an HTML blob renamed to .docx. That matters because most
 * employers who ask for Word want to edit it, and because applicant tracking
 * systems parse genuine paragraph structure far more reliably.
 *
 * The exporter deliberately does *not* try to reproduce decorative layouts
 * pixel for pixel. It reproduces the template's typography, accent colour and
 * section order, and flattens two-column designs into a borderless table so the
 * text still comes out in reading order.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  WidthType,
  convertMillimetersToTwip,
} from 'docx';
import type { Resume, SectionId, SectionKey } from '../../types/resume';
import { getTemplate } from '../../templates/registry';
import { orderedSectionIds, sectionTitle } from '../../templates/Sections';
import { dateRange, joinNonEmpty, prettyUrl } from '../format';

const PAGE_TWIPS = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
} as const;

const DOCX_FONTS: Record<string, string> = {
  Inter: 'Calibri',
  Arial: 'Arial',
  Calibri: 'Calibri',
  Georgia: 'Georgia',
  'Times New Roman': 'Times New Roman',
  Garamond: 'Garamond',
  'Source Sans': 'Calibri',
  Lato: 'Calibri',
};

/** docx wants bare hex; the app stores CSS hex. */
function hex(color: string): string {
  return color.replace('#', '').toUpperCase() || '000000';
}

interface Ctx {
  resume: Resume;
  accent: string;
  font: string;
  /** Body size in half-points. */
  size: number;
  caps: boolean;
  /** Narrower text column when rendering inside the sidebar table cell. */
  narrow: boolean;
}

function body(ctx: Ctx, text: string, opts: { italics?: boolean; color?: string } = {}) {
  return new TextRun({
    text,
    font: ctx.font,
    size: ctx.size,
    italics: opts.italics,
    color: opts.color,
  });
}

function heading(ctx: Ctx, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 220, after: 90 },
    border: {
      bottom: {
        color: ctx.accent,
        style: BorderStyle.SINGLE,
        size: 6,
        space: 2,
      },
    },
    children: [
      new TextRun({
        text: ctx.caps ? text.toUpperCase() : text,
        bold: true,
        color: ctx.accent,
        font: ctx.font,
        size: ctx.size,
        characterSpacing: 20,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
  });
}

/** Title on the left, dates flush right on the same line via a right tab stop. */
function entryTitle(ctx: Ctx, title: string, meta: string): Paragraph {
  const children = [new TextRun({ text: title, bold: true, font: ctx.font, size: ctx.size })];
  if (meta) {
    children.push(
      new TextRun({ text: `\t${meta}`, font: ctx.font, size: ctx.size - 2, color: '4B5563' }),
    );
  }
  return new Paragraph({
    spacing: { before: 140, after: 0 },
    tabStops: meta
      ? [{ type: TabStopType.RIGHT, position: ctx.narrow ? 4200 : TabStopPosition.MAX }]
      : undefined,
    children,
  });
}

function subtitle(ctx: Ctx, text: string): Paragraph[] {
  if (!text) return [];
  return [
    new Paragraph({
      spacing: { after: 20 },
      children: [body(ctx, text, { italics: true, color: '4B5563' })],
    }),
  ];
}

function paragraph(ctx: Ctx, text: string, opts: { italics?: boolean } = {}): Paragraph[] {
  if (!text.trim()) return [];
  return [
    new Paragraph({
      spacing: { after: 60, line: Math.round(ctx.resume.settings.lineHeight * 240) },
      children: [body(ctx, text, opts)],
    }),
  ];
}

function bullets(ctx: Ctx, items: string[]): Paragraph[] {
  return items
    .map((i) => i.trim())
    .filter(Boolean)
    .map(
      (text) =>
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 30, line: Math.round(ctx.resume.settings.lineHeight * 240) },
          indent: { left: 280, hanging: 180 },
          children: [body(ctx, text)],
        }),
    );
}

function sectionParagraphs(ctx: Ctx, id: SectionId): Paragraph[] {
  const r = ctx.resume;
  if (r.settings.hiddenSections.includes(id)) return [];
  const title = sectionTitle(r, id);

  if (id.startsWith('custom:')) {
    const custom = r.customSections.find((c) => `custom:${c.id}` === id);
    if (!custom?.entries.length) return [];
    return [
      heading(ctx, title),
      ...custom.entries.flatMap((e) => [
        entryTitle(ctx, e.title, e.date),
        ...subtitle(ctx, e.subtitle),
        ...paragraph(ctx, e.description),
        ...bullets(ctx, e.highlights),
      ]),
    ];
  }

  switch (id as SectionKey) {
    case 'summary':
      if (!r.basics.summary.trim()) return [];
      return [heading(ctx, title), ...paragraph(ctx, r.basics.summary)];

    case 'experience':
      if (!r.experience.length) return [];
      return [
        heading(ctx, title),
        ...r.experience.flatMap((job) => [
          entryTitle(ctx, job.position, dateRange(job.startDate, job.endDate, job.current)),
          ...subtitle(ctx, joinNonEmpty([job.company, job.location], ' · ')),
          ...paragraph(ctx, job.summary),
          ...bullets(ctx, job.highlights),
        ]),
      ];

    case 'education':
      if (!r.education.length) return [];
      return [
        heading(ctx, title),
        ...r.education.flatMap((ed) => [
          entryTitle(ctx, joinNonEmpty([ed.degree, ed.field], ', '), dateRange(ed.startDate, ed.endDate)),
          ...subtitle(ctx, joinNonEmpty([ed.institution, ed.location], ' · ')),
          ...paragraph(ctx, ed.grade),
          ...bullets(ctx, ed.highlights),
        ]),
      ];

    case 'skills': {
      const groups = r.skills.filter((g) => g.items.filter(Boolean).length);
      if (!groups.length) return [];
      return [
        heading(ctx, title),
        ...groups.map(
          (g) =>
            new Paragraph({
              spacing: { after: 50 },
              children: [
                ...(g.category
                  ? [new TextRun({ text: `${g.category}: `, bold: true, font: ctx.font, size: ctx.size })]
                  : []),
                body(ctx, g.items.filter(Boolean).join(', ')),
              ],
            }),
        ),
      ];
    }

    case 'projects':
      if (!r.projects.length) return [];
      return [
        heading(ctx, title),
        ...r.projects.flatMap((p) => [
          entryTitle(ctx, joinNonEmpty([p.name, p.role], ' — '), dateRange(p.startDate, p.endDate)),
          ...subtitle(ctx, p.link ? prettyUrl(p.link) : ''),
          ...paragraph(ctx, p.description),
          ...bullets(ctx, p.highlights),
        ]),
      ];

    case 'certifications':
      if (!r.certifications.length) return [];
      return [
        heading(ctx, title),
        ...r.certifications.map(
          (c) =>
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: c.name, bold: true, font: ctx.font, size: ctx.size }),
                body(ctx, joinNonEmpty([c.issuer, c.date], ' · ') ? ` — ${joinNonEmpty([c.issuer, c.date], ' · ')}` : ''),
              ],
            }),
        ),
      ];

    case 'awards':
      if (!r.awards.length) return [];
      return [
        heading(ctx, title),
        ...r.awards.flatMap((a) => [
          entryTitle(ctx, a.title, a.date),
          ...subtitle(ctx, a.issuer),
          ...paragraph(ctx, a.description),
        ]),
      ];

    case 'publications':
      if (!r.publications.length) return [];
      return [
        heading(ctx, title),
        ...r.publications.map(
          (p) =>
            new Paragraph({
              spacing: { after: 60 },
              children: [
                body(ctx, p.authors ? `${p.authors}. ` : ''),
                new TextRun({ text: `${p.title}.`, font: ctx.font, size: ctx.size, bold: true }),
                body(ctx, joinNonEmpty([p.publisher, p.date], ', ') ? ` ${joinNonEmpty([p.publisher, p.date], ', ')}` : '', {
                  italics: true,
                }),
              ],
            }),
        ),
      ];

    case 'languages':
      if (!r.languages.length) return [];
      return [
        heading(ctx, title),
        ...paragraph(
          ctx,
          r.languages.map((l) => joinNonEmpty([l.name, l.level], ' — ')).join(' · '),
        ),
      ];

    case 'volunteer':
      if (!r.volunteer.length) return [];
      return [
        heading(ctx, title),
        ...r.volunteer.flatMap((v) => [
          entryTitle(ctx, v.role, dateRange(v.startDate, v.endDate)),
          ...subtitle(ctx, v.organization),
          ...paragraph(ctx, v.description),
          ...bullets(ctx, v.highlights),
        ]),
      ];

    case 'interests': {
      const items = r.interests.filter(Boolean);
      if (!items.length) return [];
      return [heading(ctx, title), ...paragraph(ctx, items.join(' · '))];
    }

    case 'references':
      if (!r.references.length) return [];
      return [
        heading(ctx, title),
        ...r.references.flatMap((ref) => [
          entryTitle(ctx, ref.name, ''),
          ...subtitle(ctx, joinNonEmpty([ref.title, ref.company], ', ')),
          ...paragraph(ctx, ref.contact),
        ]),
      ];

    default:
      return [];
  }
}

function headerParagraphs(ctx: Ctx): Paragraph[] {
  const r = ctx.resume;
  const template = getTemplate(r.settings.templateId);
  const centred = template.header === 'centered';
  const alignment = centred ? AlignmentType.CENTER : AlignmentType.LEFT;

  const contactLine = [
    r.basics.email,
    r.basics.phone,
    r.basics.location,
    r.basics.website ? prettyUrl(r.basics.website) : '',
    r.basics.linkedin ? prettyUrl(r.basics.linkedin) : '',
    r.basics.github ? prettyUrl(r.basics.github) : '',
  ]
    .filter(Boolean)
    .join('  |  ');

  const out: Paragraph[] = [
    new Paragraph({
      alignment,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: r.basics.fullName || 'Your Name',
          bold: true,
          size: Math.round(ctx.size * 1.85),
          color: ctx.accent,
          font: ctx.font,
        }),
      ],
    }),
  ];

  if (r.basics.headline) {
    out.push(
      new Paragraph({
        alignment,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: r.basics.headline,
            size: Math.round(ctx.size * 1.08),
            color: '4B5563',
            font: ctx.font,
          }),
        ],
      }),
    );
  }

  if (contactLine) {
    out.push(
      new Paragraph({
        alignment,
        spacing: { after: 120 },
        border: {
          bottom: { color: ctx.accent, style: BorderStyle.SINGLE, size: 8, space: 6 },
        },
        children: [
          new TextRun({ text: contactLine, size: ctx.size - 2, color: '4B5563', font: ctx.font }),
        ],
      }),
    );
  }

  return out;
}

/**
 * Two-column templates become a single borderless table row so Word keeps the
 * rail beside the main column instead of dropping it to the bottom.
 */
function twoColumnBody(ctx: Ctx, mainIds: SectionId[], sideIds: SectionId[], sidebarFirst: boolean) {
  const mainCtx = { ...ctx, narrow: false };
  const sideCtx = { ...ctx, narrow: true, size: Math.max(16, ctx.size - 1) };

  const mainCell = new TableCell({
    width: { size: 66, type: WidthType.PERCENTAGE },
    margins: { right: 220, left: sidebarFirst ? 220 : 0 },
    children: mainIds.flatMap((id) => sectionParagraphs(mainCtx, id)),
  });
  const sideCell = new TableCell({
    width: { size: 34, type: WidthType.PERCENTAGE },
    margins: { left: sidebarFirst ? 0 : 220, right: sidebarFirst ? 220 : 0 },
    children: sideIds.flatMap((id) => sectionParagraphs(sideCtx, id)),
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [new TableRow({ children: sidebarFirst ? [sideCell, mainCell] : [mainCell, sideCell] })],
  });
}

export function buildDocument(resume: Resume): Document {
  const template = getTemplate(resume.settings.templateId);
  const ctx: Ctx = {
    resume,
    accent: hex(resume.settings.accentColor),
    font: DOCX_FONTS[resume.settings.fontFamily] ?? 'Calibri',
    size: Math.round(21 * (resume.settings.fontScale || 1)), // half-points ≈ 10.5pt
    caps: resume.settings.uppercaseHeadings,
    narrow: false,
  };

  const all = orderedSectionIds(resume);
  const sidebarIds = template.sidebarSections ?? [];
  const isTwoCol =
    template.layout === 'sidebar-left' ||
    template.layout === 'sidebar-right' ||
    template.layout === 'header-band';

  const children: Array<Paragraph | Table> = [...headerParagraphs(ctx)];

  if (isTwoCol && all.some((id) => sidebarIds.includes(id))) {
    children.push(
      twoColumnBody(
        ctx,
        all.filter((id) => !sidebarIds.includes(id)),
        all.filter((id) => sidebarIds.includes(id)),
        template.layout !== 'sidebar-right',
      ),
    );
  } else {
    children.push(...all.flatMap((id) => sectionParagraphs(ctx, id)));
  }

  const page = PAGE_TWIPS[resume.settings.paperSize];
  const margin = convertMillimetersToTwip(Math.max(10, resume.settings.margin));

  return new Document({
    creator: resume.basics.fullName || 'CVBuild',
    title: resume.meta.name,
    description: 'Created with CVBuild',
    styles: {
      default: {
        document: { run: { font: ctx.font, size: ctx.size } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: page.width, height: page.height },
            margin: { top: margin, bottom: margin, left: margin, right: margin },
          },
        },
        children,
      },
    ],
  });
}

export async function exportDocxBlob(resume: Resume): Promise<Blob> {
  return Packer.toBlob(buildDocument(resume));
}

export function suggestedFileName(resume: Resume, extension: string): string {
  const name = (resume.basics.fullName || resume.meta.name || 'CV')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  const role = resume.basics.headline
    ? `-${resume.basics.headline.split(/[—–-]/)[0].trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}`
    : '';
  return `${name}${role}-CV.${extension}`.replace(/-{2,}/g, '-');
}

export async function downloadDocx(resume: Resume): Promise<void> {
  const blob = await exportDocxBlob(resume);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedFileName(resume, 'docx');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
