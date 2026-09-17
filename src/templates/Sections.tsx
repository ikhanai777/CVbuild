import type { ReactNode } from 'react';
import type { Resume, SectionId, SectionKey } from '../types/resume';
import { SECTION_LABELS } from '../types/resume';
import { dateRange, joinNonEmpty, prettyUrl } from '../lib/format';

/**
 * Every template renders the same section markup and differs only in CSS and
 * in how the layout engine arranges the blocks. That is what lets a CV move
 * between templates with no content changes.
 */

export function sectionTitle(resume: Resume, id: SectionId): string {
  const override = resume.settings.sectionTitles[id];
  if (override) return override;
  if (id.startsWith('custom:')) {
    const custom = resume.customSections.find((c) => `custom:${c.id}` === id);
    return custom?.title ?? 'Section';
  }
  return SECTION_LABELS[id as SectionKey] ?? id;
}

function Section({
  id,
  title,
  children,
}: {
  id: SectionId;
  title: string;
  children: ReactNode;
}) {
  const modifier = id.startsWith('custom:') ? 'custom' : id;
  return (
    <section className={`cv-section cv-section--${modifier}`} data-section={id}>
      <h2 className="cv-section__title">{title}</h2>
      <div className="cv-section__body">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (!clean.length) return null;
  return (
    <ul className="cv-bullets">
      {clean.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function EntryHead({
  title,
  subtitle,
  meta,
  metaSecondary,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  metaSecondary?: string;
}) {
  return (
    <div className="cv-entry__head">
      <div className="cv-entry__titles">
        <h3 className="cv-entry__title">{title}</h3>
        {subtitle ? <div className="cv-entry__subtitle">{subtitle}</div> : null}
      </div>
      {meta || metaSecondary ? (
        <div className="cv-entry__meta">
          {meta ? <div className="cv-entry__dates">{meta}</div> : null}
          {metaSecondary ? <div className="cv-entry__place">{metaSecondary}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Returns the rendered block for a section, or null when it has no content.
 * Empty sections never print — an empty heading looks like an oversight.
 */
export function renderSection(resume: Resume, id: SectionId): ReactNode | null {
  if (resume.settings.hiddenSections.includes(id)) return null;
  const title = sectionTitle(resume, id);

  if (id.startsWith('custom:')) {
    const custom = resume.customSections.find((c) => `custom:${c.id}` === id);
    if (!custom || !custom.entries.length) return null;
    return (
      <Section key={id} id={id} title={title}>
        {custom.entries.map((entry) => (
          <article className="cv-entry" key={entry.id}>
            <EntryHead title={entry.title} subtitle={entry.subtitle} meta={entry.date} />
            {entry.description ? (
              <p className="cv-entry__summary">{entry.description}</p>
            ) : null}
            <Bullets items={entry.highlights} />
          </article>
        ))}
      </Section>
    );
  }

  switch (id as SectionKey) {
    case 'summary': {
      if (!resume.basics.summary.trim()) return null;
      return (
        <Section key={id} id={id} title={title}>
          <p className="cv-summary">{resume.basics.summary}</p>
        </Section>
      );
    }

    case 'experience': {
      if (!resume.experience.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          {resume.experience.map((job) => (
            <article className="cv-entry" key={job.id}>
              <EntryHead
                title={job.position}
                subtitle={joinNonEmpty([job.company, job.location])}
                meta={dateRange(job.startDate, job.endDate, job.current)}
              />
              {job.summary ? <p className="cv-entry__summary">{job.summary}</p> : null}
              <Bullets items={job.highlights} />
            </article>
          ))}
        </Section>
      );
    }

    case 'education': {
      if (!resume.education.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          {resume.education.map((ed) => (
            <article className="cv-entry" key={ed.id}>
              <EntryHead
                title={joinNonEmpty([ed.degree, ed.field], ', ')}
                subtitle={joinNonEmpty([ed.institution, ed.location])}
                meta={dateRange(ed.startDate, ed.endDate)}
              />
              {ed.grade ? <p className="cv-entry__summary">{ed.grade}</p> : null}
              <Bullets items={ed.highlights} />
            </article>
          ))}
        </Section>
      );
    }

    case 'skills': {
      const groups = resume.skills.filter((g) => g.items.filter(Boolean).length);
      if (!groups.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          <div className="cv-skills">
            {groups.map((group) => (
              <div className="cv-skill-group" key={group.id}>
                {group.category ? (
                  <span className="cv-skill-group__label">{group.category}</span>
                ) : null}
                <span className="cv-skill-group__items">
                  {group.items.filter(Boolean).map((item, i) => (
                    <span className="cv-skill" key={i}>
                      {item}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case 'projects': {
      if (!resume.projects.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          {resume.projects.map((p) => (
            <article className="cv-entry" key={p.id}>
              <EntryHead
                title={joinNonEmpty([p.name, p.role], ' — ')}
                subtitle={p.link ? prettyUrl(p.link) : ''}
                meta={dateRange(p.startDate, p.endDate)}
              />
              {p.description ? <p className="cv-entry__summary">{p.description}</p> : null}
              <Bullets items={p.highlights} />
            </article>
          ))}
        </Section>
      );
    }

    case 'certifications': {
      if (!resume.certifications.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          <ul className="cv-list">
            {resume.certifications.map((c) => (
              <li key={c.id}>
                <span className="cv-list__main">{c.name}</span>
                {c.issuer ? <span className="cv-list__sub"> — {c.issuer}</span> : null}
                {c.date ? <span className="cv-list__meta">{c.date}</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case 'awards': {
      if (!resume.awards.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          {resume.awards.map((a) => (
            <article className="cv-entry cv-entry--tight" key={a.id}>
              <EntryHead title={a.title} subtitle={a.issuer} meta={a.date} />
              {a.description ? <p className="cv-entry__summary">{a.description}</p> : null}
            </article>
          ))}
        </Section>
      );
    }

    case 'publications': {
      if (!resume.publications.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          <ol className="cv-publications">
            {resume.publications.map((p) => (
              <li key={p.id}>
                {p.authors ? <span className="cv-pub__authors">{p.authors}. </span> : null}
                <span className="cv-pub__title">{p.title}.</span>
                {p.publisher ? <em className="cv-pub__venue"> {p.publisher}</em> : null}
                {p.date ? <span className="cv-pub__date">, {p.date}</span> : null}
                {p.link ? <span className="cv-pub__link"> · {prettyUrl(p.link)}</span> : null}
              </li>
            ))}
          </ol>
        </Section>
      );
    }

    case 'languages': {
      if (!resume.languages.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          <ul className="cv-list cv-list--inline">
            {resume.languages.map((l) => (
              <li key={l.id}>
                <span className="cv-list__main">{l.name}</span>
                {l.level ? <span className="cv-list__sub"> — {l.level}</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case 'volunteer': {
      if (!resume.volunteer.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          {resume.volunteer.map((v) => (
            <article className="cv-entry" key={v.id}>
              <EntryHead
                title={v.role}
                subtitle={v.organization}
                meta={dateRange(v.startDate, v.endDate)}
              />
              {v.description ? <p className="cv-entry__summary">{v.description}</p> : null}
              <Bullets items={v.highlights} />
            </article>
          ))}
        </Section>
      );
    }

    case 'interests': {
      const items = resume.interests.filter(Boolean);
      if (!items.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          <p className="cv-inline-list">{items.join(' · ')}</p>
        </Section>
      );
    }

    case 'references': {
      if (!resume.references.length) return null;
      return (
        <Section key={id} id={id} title={title}>
          <div className="cv-references">
            {resume.references.map((r) => (
              <div className="cv-reference" key={r.id}>
                <div className="cv-reference__name">{r.name}</div>
                <div className="cv-reference__meta">
                  {joinNonEmpty([r.title, r.company], ', ')}
                </div>
                {r.contact ? <div className="cv-reference__contact">{r.contact}</div> : null}
              </div>
            ))}
          </div>
        </Section>
      );
    }

    default:
      return null;
  }
}

/** All section ids in render order, including custom sections appended at the end. */
export function orderedSectionIds(resume: Resume): SectionId[] {
  const customIds: SectionId[] = resume.customSections.map((c) => `custom:${c.id}` as SectionId);
  const ordered = resume.settings.sectionOrder.filter(
    (id) => !id.startsWith('custom:') || customIds.includes(id),
  );
  const missing = customIds.filter((id) => !ordered.includes(id));
  return [...ordered, ...missing];
}
