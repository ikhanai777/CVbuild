import { useRef, useState } from 'react';
import { useResume, useStore } from '../state/store';
import {
  AutoTextarea,
  BulletEditor,
  Checkbox,
  EntryCard,
  Field,
  TagInput,
  TextInput,
} from './fields';
import { askConfirm, askNotice, askText } from './dialogs';
import { SUMMARY_TEMPLATES } from '../data/playbook';
import { hasMetric, wordCount } from '../lib/analysis/language';
import { dateRange } from '../lib/format';

function Group({
  id,
  title,
  count,
  description,
  children,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  count?: number;
  description?: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className={`group${open ? ' group--open' : ''}`} id={`group-${id}`}>
      <button type="button" className="group__head" onClick={onToggle} aria-expanded={open}>
        <span className="group__chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        <span className="group__title">{title}</span>
        {count !== undefined ? <span className="group__count">{count}</span> : null}
      </button>
      {open ? (
        <div className="group__body">
          {description ? <p className="muted small group__desc">{description}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}

function PhotoField() {
  const resume = useResume();
  const setBasics = useStore((s) => s.setBasics);
  const setSettings = useStore((s) => s.setSettings);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="photo-field">
      {resume.basics.photo ? (
        <img className="photo-field__preview" src={resume.basics.photo} alt="" />
      ) : (
        <div className="photo-field__placeholder">No photo</div>
      )}
      <div className="photo-field__controls">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 1_500_000) {
              void askNotice(
                'Please use an image under 1.5MB — larger photos bloat the PDF and can overflow the browser store.',
              );
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              setBasics({ photo: String(reader.result) });
              setSettings({ showPhoto: true });
            };
            reader.readAsDataURL(file);
          }}
        />
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => inputRef.current?.click()}>
          {resume.basics.photo ? 'Replace' : 'Upload photo'}
        </button>
        {resume.basics.photo ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setBasics({ photo: '' });
              setSettings({ showPhoto: false });
            }}
          >
            Remove
          </button>
        ) : null}
        <p className="muted small">
          Standard in much of Europe; in the UK, US, Canada and Australia leave it off — it invites
          bias screening and some systems reject it.
        </p>
      </div>
    </div>
  );
}

export function ContentEditor() {
  const resume = useResume();
  const store = useStore();
  const [open, setOpen] = useState<Record<string, boolean>>({ basics: true, experience: true });
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const summaryWords = wordCount(resume.basics.summary);

  return (
    <div className="editor">
      <Group id="basics" title="Personal details" open={!!open.basics} onToggle={() => toggle('basics')}>
        <div className="grid grid--2">
          <Field label="Full name">
            <TextInput
              value={resume.basics.fullName}
              onChange={(v) => store.setBasics({ fullName: v })}
              placeholder="Amara Osei"
            />
          </Field>
          <Field label="Target job title">
            <TextInput
              value={resume.basics.headline}
              onChange={(v) => store.setBasics({ headline: v })}
              placeholder="Senior Product Manager — Payments"
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={resume.basics.email}
              onChange={(v) => store.setBasics({ email: v })}
              placeholder="first.last@example.com"
            />
          </Field>
          <Field label="Phone">
            <TextInput
              value={resume.basics.phone}
              onChange={(v) => store.setBasics({ phone: v })}
              placeholder="+44 7700 900142"
            />
          </Field>
          <Field label="Location">
            <TextInput
              value={resume.basics.location}
              onChange={(v) => store.setBasics({ location: v })}
              placeholder="London, UK"
            />
          </Field>
          <Field label="Website / portfolio">
            <TextInput
              value={resume.basics.website}
              onChange={(v) => store.setBasics({ website: v })}
              placeholder="yourname.dev"
            />
          </Field>
          <Field label="LinkedIn">
            <TextInput
              value={resume.basics.linkedin}
              onChange={(v) => store.setBasics({ linkedin: v })}
              placeholder="linkedin.com/in/yourname"
            />
          </Field>
          <Field label="GitHub">
            <TextInput
              value={resume.basics.github}
              onChange={(v) => store.setBasics({ github: v })}
              placeholder="github.com/yourname"
            />
          </Field>
        </div>
        <p className="muted small">
          City and country is enough — a full street address, date of birth or marital status is
          never asked for in most English-speaking markets and is a needless privacy exposure.
        </p>
        <PhotoField />
      </Group>

      <Group
        id="summary"
        title="Professional summary"
        description="Two to four sentences: your title and years of experience, your strongest result with a number, and what you are looking for. This is the most-read block on the page."
        open={!!open.summary}
        onToggle={() => toggle('summary')}
      >
        <AutoTextarea
          value={resume.basics.summary}
          minRows={5}
          onChange={(v) => store.setBasics({ summary: v })}
          placeholder="Senior product manager with 8 years in payments…"
        />
        <div className="row row--between">
          <span className={`chip ${summaryWords > 110 || (summaryWords > 0 && summaryWords < 25) ? 'chip--warn' : 'chip--muted'}`}>
            {summaryWords} words {summaryWords ? '(aim for 40–80)' : ''}
          </span>
          <span className={`chip ${hasMetric(resume.basics.summary) ? 'chip--ok' : 'chip--warn'}`}>
            {hasMetric(resume.basics.summary) ? 'has a number' : 'no number yet'}
          </span>
        </div>
        <div className="starter-row">
          <span className="muted small">Start from a scaffold:</span>
          {SUMMARY_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              className="pill pill--ghost"
              onClick={() => store.setBasics({ summary: t.text })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Group>

      <Group
        id="experience"
        title="Experience"
        count={resume.experience.length}
        description="Most recent first. Three to six bullets on current roles, one or two on roles over ten years old."
        open={!!open.experience}
        onToggle={() => toggle('experience')}
      >
        {resume.experience.map((job, index) => (
          <EntryCard
            key={job.id}
            index={index}
            total={resume.experience.length}
            title={job.position || 'New role'}
            subtitle={[job.company, dateRange(job.startDate, job.endDate, job.current)]
              .filter(Boolean)
              .join(' · ')}
            defaultOpen={!job.position}
            onMove={(d) => store.moveItem('experience', job.id, d)}
            onDuplicate={() => store.duplicateItem('experience', job.id)}
            onRemove={() => store.removeItem('experience', job.id)}
          >
            <div className="grid grid--2">
              <Field label="Job title">
                <TextInput
                  value={job.position}
                  onChange={(v) => store.updateItem('experience', job.id, { position: v })}
                  placeholder="Senior Product Manager"
                />
              </Field>
              <Field label="Company">
                <TextInput
                  value={job.company}
                  onChange={(v) => store.updateItem('experience', job.id, { company: v })}
                  placeholder="Northwind Payments"
                />
              </Field>
              <Field label="Location">
                <TextInput
                  value={job.location}
                  onChange={(v) => store.updateItem('experience', job.id, { location: v })}
                  placeholder="London, UK"
                />
              </Field>
              <div className="grid grid--2 grid--nested">
                <Field label="Start">
                  <TextInput
                    value={job.startDate}
                    onChange={(v) => store.updateItem('experience', job.id, { startDate: v })}
                    placeholder="Mar 2021"
                  />
                </Field>
                <Field label="End">
                  <TextInput
                    value={job.current ? '' : job.endDate}
                    onChange={(v) => store.updateItem('experience', job.id, { endDate: v })}
                    placeholder={job.current ? 'Present' : 'Feb 2024'}
                  />
                </Field>
              </div>
            </div>
            <Checkbox
              label="I currently work here"
              checked={job.current}
              onChange={(v) => store.updateItem('experience', job.id, { current: v })}
            />
            <Field label="Scope line (optional)" wide>
              <AutoTextarea
                value={job.summary}
                minRows={2}
                placeholder="Own the checkout roadmap for 2.4M monthly transactions across 14 markets."
                onChange={(v) => store.updateItem('experience', job.id, { summary: v })}
              />
            </Field>
            <BulletEditor
              items={job.highlights}
              onChange={(items) => store.updateItem('experience', job.id, { highlights: items })}
            />
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('experience')}>
          + Add role
        </button>
      </Group>

      <Group
        id="education"
        title="Education"
        count={resume.education.length}
        open={!!open.education}
        onToggle={() => toggle('education')}
      >
        {resume.education.map((ed, index) => (
          <EntryCard
            key={ed.id}
            index={index}
            total={resume.education.length}
            title={[ed.degree, ed.field].filter(Boolean).join(' ') || 'New qualification'}
            subtitle={ed.institution}
            defaultOpen={!ed.institution}
            onMove={(d) => store.moveItem('education', ed.id, d)}
            onRemove={() => store.removeItem('education', ed.id)}
          >
            <div className="grid grid--2">
              <Field label="Institution">
                <TextInput
                  value={ed.institution}
                  onChange={(v) => store.updateItem('education', ed.id, { institution: v })}
                />
              </Field>
              <Field label="Qualification">
                <TextInput
                  value={ed.degree}
                  onChange={(v) => store.updateItem('education', ed.id, { degree: v })}
                  placeholder="BSc (Hons)"
                />
              </Field>
              <Field label="Subject">
                <TextInput
                  value={ed.field}
                  onChange={(v) => store.updateItem('education', ed.id, { field: v })}
                  placeholder="Economics"
                />
              </Field>
              <Field label="Location">
                <TextInput
                  value={ed.location}
                  onChange={(v) => store.updateItem('education', ed.id, { location: v })}
                />
              </Field>
              <Field label="Start">
                <TextInput
                  value={ed.startDate}
                  onChange={(v) => store.updateItem('education', ed.id, { startDate: v })}
                  placeholder="2013"
                />
              </Field>
              <Field label="End">
                <TextInput
                  value={ed.endDate}
                  onChange={(v) => store.updateItem('education', ed.id, { endDate: v })}
                  placeholder="2016"
                />
              </Field>
            </div>
            <Field label="Grade" hint="Include only when strong and recent." wide>
              <TextInput
                value={ed.grade}
                onChange={(v) => store.updateItem('education', ed.id, { grade: v })}
                placeholder="First Class Honours"
              />
            </Field>
            <BulletEditor
              label="Highlights (optional)"
              items={ed.highlights}
              onChange={(items) => store.updateItem('education', ed.id, { highlights: items })}
            />
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('education')}>
          + Add qualification
        </button>
      </Group>

      <Group
        id="skills"
        title="Skills"
        count={resume.skills.length}
        description="Group by theme and use the advert's own words. This is the section keyword filters read first."
        open={!!open.skills}
        onToggle={() => toggle('skills')}
      >
        {resume.skills.map((group, index) => (
          <div className="skill-group" key={group.id}>
            <div className="row row--between">
              <Field label="Group name">
                <TextInput
                  value={group.category}
                  onChange={(v) => store.updateItem('skills', group.id, { category: v })}
                  placeholder="Technical"
                />
              </Field>
              <div className="entry-card__actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => store.moveItem('skills', group.id, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Move down"
                  disabled={index === resume.skills.length - 1}
                  onClick={() => store.moveItem('skills', group.id, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  title="Delete group"
                  onClick={() => store.removeItem('skills', group.id)}
                >
                  ×
                </button>
              </div>
            </div>
            <TagInput
              values={group.items}
              onChange={(items) => store.updateItem('skills', group.id, { items })}
              placeholder="Add a skill and press Enter"
            />
          </div>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('skills')}>
          + Add skill group
        </button>
      </Group>

      <Group
        id="projects"
        title="Projects"
        count={resume.projects.length}
        description="Strong evidence when your job history is short, or when the work is closer to the target role than your day job."
        open={!!open.projects}
        onToggle={() => toggle('projects')}
      >
        {resume.projects.map((p, index) => (
          <EntryCard
            key={p.id}
            index={index}
            total={resume.projects.length}
            title={p.name || 'New project'}
            subtitle={p.role}
            defaultOpen={!p.name}
            onMove={(d) => store.moveItem('projects', p.id, d)}
            onRemove={() => store.removeItem('projects', p.id)}
          >
            <div className="grid grid--2">
              <Field label="Name">
                <TextInput value={p.name} onChange={(v) => store.updateItem('projects', p.id, { name: v })} />
              </Field>
              <Field label="Your role">
                <TextInput value={p.role} onChange={(v) => store.updateItem('projects', p.id, { role: v })} />
              </Field>
              <Field label="Link">
                <TextInput value={p.link} onChange={(v) => store.updateItem('projects', p.id, { link: v })} />
              </Field>
              <div className="grid grid--2 grid--nested">
                <Field label="Start">
                  <TextInput
                    value={p.startDate}
                    onChange={(v) => store.updateItem('projects', p.id, { startDate: v })}
                  />
                </Field>
                <Field label="End">
                  <TextInput
                    value={p.endDate}
                    onChange={(v) => store.updateItem('projects', p.id, { endDate: v })}
                  />
                </Field>
              </div>
            </div>
            <Field label="Description" wide>
              <AutoTextarea
                value={p.description}
                minRows={2}
                onChange={(v) => store.updateItem('projects', p.id, { description: v })}
              />
            </Field>
            <BulletEditor
              items={p.highlights}
              onChange={(items) => store.updateItem('projects', p.id, { highlights: items })}
            />
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('projects')}>
          + Add project
        </button>
      </Group>

      <Group
        id="certifications"
        title="Certifications"
        count={resume.certifications.length}
        open={!!open.certifications}
        onToggle={() => toggle('certifications')}
      >
        {resume.certifications.map((c, index) => (
          <EntryCard
            key={c.id}
            index={index}
            total={resume.certifications.length}
            title={c.name || 'New certification'}
            subtitle={c.issuer}
            defaultOpen={!c.name}
            onMove={(d) => store.moveItem('certifications', c.id, d)}
            onRemove={() => store.removeItem('certifications', c.id)}
          >
            <div className="grid grid--2">
              <Field label="Name">
                <TextInput
                  value={c.name}
                  onChange={(v) => store.updateItem('certifications', c.id, { name: v })}
                />
              </Field>
              <Field label="Issuer">
                <TextInput
                  value={c.issuer}
                  onChange={(v) => store.updateItem('certifications', c.id, { issuer: v })}
                />
              </Field>
              <Field label="Date">
                <TextInput
                  value={c.date}
                  onChange={(v) => store.updateItem('certifications', c.id, { date: v })}
                />
              </Field>
              <Field label="Credential ID">
                <TextInput
                  value={c.credentialId}
                  onChange={(v) => store.updateItem('certifications', c.id, { credentialId: v })}
                />
              </Field>
            </div>
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('certifications')}>
          + Add certification
        </button>
      </Group>

      <Group
        id="awards"
        title="Awards & honours"
        count={resume.awards.length}
        open={!!open.awards}
        onToggle={() => toggle('awards')}
      >
        {resume.awards.map((a, index) => (
          <EntryCard
            key={a.id}
            index={index}
            total={resume.awards.length}
            title={a.title || 'New award'}
            subtitle={a.issuer}
            defaultOpen={!a.title}
            onMove={(d) => store.moveItem('awards', a.id, d)}
            onRemove={() => store.removeItem('awards', a.id)}
          >
            <div className="grid grid--2">
              <Field label="Title">
                <TextInput value={a.title} onChange={(v) => store.updateItem('awards', a.id, { title: v })} />
              </Field>
              <Field label="Issuer">
                <TextInput value={a.issuer} onChange={(v) => store.updateItem('awards', a.id, { issuer: v })} />
              </Field>
              <Field label="Date">
                <TextInput value={a.date} onChange={(v) => store.updateItem('awards', a.id, { date: v })} />
              </Field>
            </div>
            <Field label="Description" wide>
              <AutoTextarea
                value={a.description}
                minRows={2}
                onChange={(v) => store.updateItem('awards', a.id, { description: v })}
              />
            </Field>
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('awards')}>
          + Add award
        </button>
      </Group>

      <Group
        id="publications"
        title="Publications"
        count={resume.publications.length}
        open={!!open.publications}
        onToggle={() => toggle('publications')}
      >
        {resume.publications.map((p, index) => (
          <EntryCard
            key={p.id}
            index={index}
            total={resume.publications.length}
            title={p.title || 'New publication'}
            subtitle={p.publisher}
            defaultOpen={!p.title}
            onMove={(d) => store.moveItem('publications', p.id, d)}
            onRemove={() => store.removeItem('publications', p.id)}
          >
            <Field label="Title" wide>
              <AutoTextarea
                value={p.title}
                minRows={2}
                onChange={(v) => store.updateItem('publications', p.id, { title: v })}
              />
            </Field>
            <div className="grid grid--2">
              <Field label="Authors">
                <TextInput
                  value={p.authors}
                  onChange={(v) => store.updateItem('publications', p.id, { authors: v })}
                  placeholder="Osei, A., García, L."
                />
              </Field>
              <Field label="Venue / publisher">
                <TextInput
                  value={p.publisher}
                  onChange={(v) => store.updateItem('publications', p.id, { publisher: v })}
                />
              </Field>
              <Field label="Year">
                <TextInput value={p.date} onChange={(v) => store.updateItem('publications', p.id, { date: v })} />
              </Field>
              <Field label="Link / DOI">
                <TextInput value={p.link} onChange={(v) => store.updateItem('publications', p.id, { link: v })} />
              </Field>
            </div>
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('publications')}>
          + Add publication
        </button>
      </Group>

      <Group
        id="languages"
        title="Languages"
        count={resume.languages.length}
        open={!!open.languages}
        onToggle={() => toggle('languages')}
      >
        {resume.languages.map((l) => (
          <div className="row row--gap" key={l.id}>
            <Field label="Language">
              <TextInput value={l.name} onChange={(v) => store.updateItem('languages', l.id, { name: v })} />
            </Field>
            <Field label="Level">
              <TextInput
                value={l.level}
                onChange={(v) => store.updateItem('languages', l.id, { level: v })}
                placeholder="Native / Fluent / B2"
              />
            </Field>
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              title="Delete"
              onClick={() => store.removeItem('languages', l.id)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('languages')}>
          + Add language
        </button>
      </Group>

      <Group
        id="volunteer"
        title="Volunteering"
        count={resume.volunteer.length}
        open={!!open.volunteer}
        onToggle={() => toggle('volunteer')}
      >
        {resume.volunteer.map((v, index) => (
          <EntryCard
            key={v.id}
            index={index}
            total={resume.volunteer.length}
            title={v.role || 'New entry'}
            subtitle={v.organization}
            defaultOpen={!v.role}
            onMove={(d) => store.moveItem('volunteer', v.id, d)}
            onRemove={() => store.removeItem('volunteer', v.id)}
          >
            <div className="grid grid--2">
              <Field label="Role">
                <TextInput value={v.role} onChange={(x) => store.updateItem('volunteer', v.id, { role: x })} />
              </Field>
              <Field label="Organisation">
                <TextInput
                  value={v.organization}
                  onChange={(x) => store.updateItem('volunteer', v.id, { organization: x })}
                />
              </Field>
              <Field label="Start">
                <TextInput
                  value={v.startDate}
                  onChange={(x) => store.updateItem('volunteer', v.id, { startDate: x })}
                />
              </Field>
              <Field label="End">
                <TextInput
                  value={v.endDate}
                  onChange={(x) => store.updateItem('volunteer', v.id, { endDate: x })}
                />
              </Field>
            </div>
            <BulletEditor
              items={v.highlights}
              onChange={(items) => store.updateItem('volunteer', v.id, { highlights: items })}
            />
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('volunteer')}>
          + Add volunteering
        </button>
      </Group>

      <Group id="interests" title="Interests" count={resume.interests.length} open={!!open.interests} onToggle={() => toggle('interests')}>
        <TagInput values={resume.interests} onChange={store.setInterests} placeholder="Add an interest" />
        <p className="muted small">
          Optional, and only worth the space when an interest is genuinely distinctive or relevant.
        </p>
      </Group>

      <Group
        id="references"
        title="References"
        count={resume.references.length}
        description="Usually best left off — employers ask when they need them, and the space is better spent on achievements."
        open={!!open.references}
        onToggle={() => toggle('references')}
      >
        {resume.references.map((r, index) => (
          <EntryCard
            key={r.id}
            index={index}
            total={resume.references.length}
            title={r.name || 'New reference'}
            subtitle={r.company}
            defaultOpen={!r.name}
            onMove={(d) => store.moveItem('references', r.id, d)}
            onRemove={() => store.removeItem('references', r.id)}
          >
            <div className="grid grid--2">
              <Field label="Name">
                <TextInput value={r.name} onChange={(v) => store.updateItem('references', r.id, { name: v })} />
              </Field>
              <Field label="Title">
                <TextInput value={r.title} onChange={(v) => store.updateItem('references', r.id, { title: v })} />
              </Field>
              <Field label="Company">
                <TextInput
                  value={r.company}
                  onChange={(v) => store.updateItem('references', r.id, { company: v })}
                />
              </Field>
              <Field label="Contact">
                <TextInput
                  value={r.contact}
                  onChange={(v) => store.updateItem('references', r.id, { contact: v })}
                />
              </Field>
            </div>
          </EntryCard>
        ))}
        <button type="button" className="btn btn--dashed" onClick={() => store.addItem('references')}>
          + Add reference
        </button>
      </Group>

      {resume.customSections.map((section) => (
        <Group
          key={section.id}
          id={section.id}
          title={section.title}
          count={section.entries.length}
          open={!!open[section.id]}
          onToggle={() => toggle(section.id)}
        >
          <div className="row row--between">
            <Field label="Section heading">
              <TextInput
                value={section.title}
                onChange={(v) => store.updateCustomSection(section.id, { title: v })}
              />
            </Field>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={async () => {
                if (await askConfirm(`Delete the "${section.title}" section?`)) {
                  store.removeCustomSection(section.id);
                }
              }}
            >
              Delete section
            </button>
          </div>
          {section.entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              index={index}
              total={section.entries.length}
              title={entry.title || 'New entry'}
              subtitle={entry.subtitle}
              defaultOpen={!entry.title}
              onMove={() => undefined}
              onRemove={() => store.removeCustomEntry(section.id, entry.id)}
            >
              <div className="grid grid--2">
                <Field label="Title">
                  <TextInput
                    value={entry.title}
                    onChange={(v) => store.updateCustomEntry(section.id, entry.id, { title: v })}
                  />
                </Field>
                <Field label="Subtitle">
                  <TextInput
                    value={entry.subtitle}
                    onChange={(v) => store.updateCustomEntry(section.id, entry.id, { subtitle: v })}
                  />
                </Field>
                <Field label="Date">
                  <TextInput
                    value={entry.date}
                    onChange={(v) => store.updateCustomEntry(section.id, entry.id, { date: v })}
                  />
                </Field>
              </div>
              <Field label="Description" wide>
                <AutoTextarea
                  value={entry.description}
                  minRows={2}
                  onChange={(v) => store.updateCustomEntry(section.id, entry.id, { description: v })}
                />
              </Field>
              <BulletEditor
                items={entry.highlights}
                onChange={(items) => store.updateCustomEntry(section.id, entry.id, { highlights: items })}
              />
            </EntryCard>
          ))}
          <button
            type="button"
            className="btn btn--dashed"
            onClick={() => store.addCustomEntry(section.id)}
          >
            + Add entry
          </button>
        </Group>
      ))}

      <button
        type="button"
        className="btn btn--dashed btn--block"
        onClick={async () => {
          const title = await askText('Section heading', 'Additional information');
          if (title) store.addCustomSection(title);
        }}
      >
        + Add a custom section
      </button>
    </div>
  );
}
