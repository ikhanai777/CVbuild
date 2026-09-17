import type { CSSProperties } from 'react';
import type { Resume, SectionId } from '../types/resume';
import { FONT_STACKS, getTemplate, type TemplateDefinition } from './registry';
import { orderedSectionIds, renderSection } from './Sections';
import { Icon } from './icons';
import { initials, prettyUrl, readableOn, withAlpha } from '../lib/format';

/** Physical page geometry, in mm. */
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

interface ContactEntry {
  key: string;
  icon: string;
  text: string;
}

function contactEntries(resume: Resume): ContactEntry[] {
  const b = resume.basics;
  const out: ContactEntry[] = [];
  if (b.email) out.push({ key: 'email', icon: 'email', text: b.email });
  if (b.phone) out.push({ key: 'phone', icon: 'phone', text: b.phone });
  if (b.location) out.push({ key: 'location', icon: 'location', text: b.location });
  if (b.website) out.push({ key: 'website', icon: 'link', text: prettyUrl(b.website) });
  if (b.linkedin) out.push({ key: 'linkedin', icon: 'linkedin', text: prettyUrl(b.linkedin) });
  if (b.github) out.push({ key: 'github', icon: 'github', text: prettyUrl(b.github) });
  return out;
}

function ContactList({ resume }: { resume: Resume }) {
  const entries = contactEntries(resume);
  if (!entries.length) return null;
  return (
    <ul className="cv-contact">
      {entries.map((e) => (
        <li className="cv-contact__item" key={e.key}>
          {resume.settings.showIcons ? <Icon name={e.icon} /> : null}
          <span>{e.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Photo({ resume }: { resume: Resume }) {
  if (!resume.settings.showPhoto || !resume.basics.photo) return null;
  return (
    <div className="cv-photo">
      <img src={resume.basics.photo} alt="" />
    </div>
  );
}

function Header({ resume, template }: { resume: Resume; template: TemplateDefinition }) {
  const { fullName, headline } = resume.basics;
  const variant = template.header;

  const name = <h1 className="cv-name">{fullName || 'Your Name'}</h1>;
  const role = headline ? <div className="cv-headline">{headline}</div> : null;

  if (variant === 'monogram') {
    return (
      <header className="cv-header cv-header--monogram">
        <div className="cv-monogram" aria-hidden="true">
          {initials(fullName) || 'CV'}
        </div>
        <div className="cv-header__text">
          {name}
          {role}
          <ContactList resume={resume} />
        </div>
        <Photo resume={resume} />
      </header>
    );
  }

  if (variant === 'band') {
    return (
      <header className="cv-header cv-header--band">
        <Photo resume={resume} />
        <div className="cv-header__text">
          {name}
          {role}
          <ContactList resume={resume} />
        </div>
      </header>
    );
  }

  if (variant === 'split') {
    return (
      <header className="cv-header cv-header--split">
        <div className="cv-header__text">
          {name}
          {role}
        </div>
        <ContactList resume={resume} />
        <Photo resume={resume} />
      </header>
    );
  }

  if (variant === 'centered') {
    return (
      <header className="cv-header cv-header--centered">
        {name}
        {role}
        <ContactList resume={resume} />
      </header>
    );
  }

  if (variant === 'bold-left') {
    return (
      <header className="cv-header cv-header--bold-left">
        {name}
        <div className="cv-header__right">
          {role}
          <ContactList resume={resume} />
        </div>
      </header>
    );
  }

  if (variant === 'compact') {
    return (
      <header className="cv-header cv-header--compact">
        <div className="cv-header__text">
          {name}
          {role}
        </div>
        <ContactList resume={resume} />
      </header>
    );
  }

  return (
    <header className="cv-header cv-header--stacked">
      <Photo resume={resume} />
      <div className="cv-header__text">
        {name}
        {role}
        <ContactList resume={resume} />
      </div>
    </header>
  );
}

function splitSections(resume: Resume, template: TemplateDefinition) {
  const all = orderedSectionIds(resume);
  const sidebar = template.sidebarSections ?? [];
  const isTwoCol =
    template.layout === 'sidebar-left' ||
    template.layout === 'sidebar-right' ||
    template.layout === 'header-band';
  if (!isTwoCol) return { main: all, side: [] as SectionId[] };
  return {
    main: all.filter((id) => !sidebar.includes(id)),
    side: all.filter((id) => sidebar.includes(id)),
  };
}

export interface ResumeDocumentProps {
  resume: Resume;
  /** Render every page break marker and the paper shadow (off for print). */
  preview?: boolean;
  className?: string;
}

/**
 * Renders the CV at true physical size. The same component is used for the
 * on-screen preview and for printing, so what the user sees is what prints.
 */
export function ResumeDocument({ resume, preview = true, className = '' }: ResumeDocumentProps) {
  const template = getTemplate(resume.settings.templateId);
  const s = resume.settings;
  const page = PAGE_SIZES[s.paperSize];
  const { main, side } = splitSections(resume, template);

  const style = {
    '--cv-accent': s.accentColor,
    '--cv-accent-soft': withAlpha(s.accentColor, 0.12),
    '--cv-accent-line': withAlpha(s.accentColor, 0.35),
    '--cv-on-accent': readableOn(s.accentColor),
    '--cv-font': FONT_STACKS[s.fontFamily] ?? FONT_STACKS.Inter,
    '--cv-font-scale': s.fontScale,
    '--cv-line-height': s.lineHeight,
    '--cv-section-gap': `${s.sectionSpacing}pt`,
    '--cv-margin': `${s.margin}mm`,
    '--cv-page-width': `${page.width}mm`,
    '--cv-page-height': `${page.height}mm`,
    '--cv-sidebar-width': template.sidebarWidth ?? '32%',
    '--cv-heading-transform': s.uppercaseHeadings ? 'uppercase' : 'none',
  } as CSSProperties;

  const mainBlocks = main.map((id) => renderSection(resume, id)).filter(Boolean);
  const sideBlocks = side.map((id) => renderSection(resume, id)).filter(Boolean);

  const bodyClass = [
    'cv-body',
    `cv-body--${template.layout}`,
    sideBlocks.length ? 'cv-body--has-sidebar' : 'cv-body--single',
  ].join(' ');

  return (
    <article
      className={[
        'cv-page',
        template.className,
        preview ? 'cv-page--preview' : 'cv-page--print',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-template={template.id}
    >
      <Header resume={resume} template={template} />
      <div className={bodyClass}>
        {template.layout === 'sidebar-right' ? null : sideBlocks.length ? (
          <aside className="cv-side">{sideBlocks}</aside>
        ) : null}
        <main className="cv-main">{mainBlocks}</main>
        {template.layout === 'sidebar-right' && sideBlocks.length ? (
          <aside className="cv-side">{sideBlocks}</aside>
        ) : null}
      </div>
    </article>
  );
}
