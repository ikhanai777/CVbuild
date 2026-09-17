import { useResume, useStore } from '../state/store';
import { ACCENT_PRESETS, FONT_OPTIONS, getTemplate } from '../templates/registry';
import { SECTION_LABELS, type SectionId, type SectionKey } from '../types/resume';
import { orderedSectionIds, sectionTitle } from '../templates/Sections';
import { Checkbox, Field } from './fields';
import { askText } from './dialogs';
import { estimatePages } from '../lib/analysis/score';

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        <span className="field__value">
          {Math.round(value * 100) / 100}
          {suffix ?? ''}
        </span>
      </span>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function DesignPanel() {
  const resume = useResume();
  const store = useStore();
  const s = resume.settings;
  const template = getTemplate(s.templateId);
  const pages = estimatePages(resume);
  const sections = orderedSectionIds(resume);

  return (
    <div className="design">
      <section className="panel-block">
        <h3>Typography & colour</h3>
        <div className="grid grid--2">
          <Field label="Font">
            <select
              className="input"
              value={s.fontFamily}
              onChange={(e) => store.setSettings({ fontFamily: e.target.value })}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Paper size">
            <select
              className="input"
              value={s.paperSize}
              onChange={(e) => store.setSettings({ paperSize: e.target.value as 'A4' | 'Letter' })}
            >
              <option value="A4">A4 (Europe, UK, most of the world)</option>
              <option value="Letter">US Letter (US, Canada)</option>
            </select>
          </Field>
        </div>

        <Field label="Accent colour">
          <div className="colour-row">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${s.accentColor.toLowerCase() === c.toLowerCase() ? ' swatch--active' : ''}`}
                style={{ background: c }}
                aria-label={`Accent ${c}`}
                onClick={() => store.setSettings({ accentColor: c })}
              />
            ))}
            <input
              className="swatch swatch--input"
              type="color"
              value={s.accentColor}
              onChange={(e) => store.setSettings({ accentColor: e.target.value })}
              aria-label="Custom accent colour"
            />
          </div>
        </Field>

        <Slider
          label="Text size"
          value={s.fontScale}
          min={0.85}
          max={1.15}
          step={0.01}
          onChange={(v) => store.setSettings({ fontScale: v })}
        />
        <Slider
          label="Line spacing"
          value={s.lineHeight}
          min={1.1}
          max={1.7}
          step={0.05}
          onChange={(v) => store.setSettings({ lineHeight: v })}
        />
        <Slider
          label="Space between sections"
          value={s.sectionSpacing}
          min={4}
          max={20}
          step={1}
          suffix="pt"
          onChange={(v) => store.setSettings({ sectionSpacing: v })}
        />
        <Slider
          label="Page margin"
          value={s.margin}
          min={8}
          max={28}
          step={1}
          suffix="mm"
          onChange={(v) => store.setSettings({ margin: v })}
        />
        {s.margin < 10 || s.fontScale < 0.9 ? (
          <p className="note note--warn">
            Shrinking type and margins to force a fit is the most visible way to look over-stuffed.
            Cut the oldest roles to one line instead — you are currently at about {pages} pages.
          </p>
        ) : (
          <p className="muted small">Estimated length: about {pages} page{pages === 1 ? '' : 's'}.</p>
        )}

        <Checkbox
          label="Uppercase section headings"
          checked={s.uppercaseHeadings}
          onChange={(v) => store.setSettings({ uppercaseHeadings: v })}
        />
        <Checkbox
          label="Show icons next to contact details"
          checked={s.showIcons}
          onChange={(v) => store.setSettings({ showIcons: v })}
        />
        <Checkbox
          label="Show photo"
          checked={s.showPhoto}
          onChange={(v) => store.setSettings({ showPhoto: v })}
        />
        {s.showPhoto && !resume.basics.photo ? (
          <p className="note">Upload a photo under Content → Personal details for it to appear.</p>
        ) : null}
        {!template.atsSafe ? (
          <p className="note note--warn">
            <strong>{template.name}</strong> is a multi-column design. Keep an ATS-safe version for
            online portals — the Templates tab marks which ones qualify.
          </p>
        ) : null}
      </section>

      <section className="panel-block">
        <h3>Sections</h3>
        <p className="muted small">
          Order matters: put the section that proves you can do <em>this</em> job directly under the
          summary. Hiding a section keeps its content but removes it from the page.
        </p>
        <ul className="section-list">
          {sections.map((id: SectionId, index) => {
            const hidden = s.hiddenSections.includes(id);
            const label = id.startsWith('custom:')
              ? sectionTitle(resume, id)
              : SECTION_LABELS[id as SectionKey] ?? id;
            return (
              <li className={`section-row${hidden ? ' section-row--hidden' : ''}`} key={id}>
                <span className="section-row__name">
                  {label}
                  {s.sectionTitles[id] ? (
                    <span className="muted small"> → “{s.sectionTitles[id]}”</span>
                  ) : null}
                </span>
                <span className="section-row__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => store.moveSection(id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Move down"
                    disabled={index === sections.length - 1}
                    onClick={() => store.moveSection(id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Rename heading"
                    onClick={async () => {
                      const next = await askText(`Heading for "${label}"`, sectionTitle(resume, id));
                      if (next !== null) store.renameSection(id, next);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title={hidden ? 'Show section' : 'Hide section'}
                    onClick={() => store.toggleSection(id)}
                  >
                    {hidden ? '☐' : '☑'}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
