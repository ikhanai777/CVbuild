import { useMemo, useState } from 'react';
import { useResume, useStore } from '../state/store';
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '../templates/registry';
import { ResumeDocument } from '../templates/ResumeDocument';
import { applyTemplate } from '../templates/applyTemplate';

/**
 * The picker renders each template with the user's own content rather than
 * lorem-ipsum thumbnails, because how a template handles *your* CV — a long job
 * title, six bullets, no photo — is the only thing that actually matters.
 */
export function TemplateGallery() {
  const resume = useResume();
  const setTemplate = useStore((s) => s.setTemplate);
  const [filter, setFilter] = useState<TemplateCategory | 'All' | 'ATS-safe only'>('All');

  const visible = useMemo(() => {
    if (filter === 'All') return TEMPLATES;
    if (filter === 'ATS-safe only') return TEMPLATES.filter((t) => t.atsSafe);
    return TEMPLATES.filter((t) => t.category === filter);
  }, [filter]);

  return (
    <div className="gallery">
      <p className="muted small">
        Switching template never changes your content — only the layout, typography and colour.
        Templates marked <strong>ATS-safe</strong> are single-column designs that applicant tracking
        systems parse reliably; use one of those for online portals.
      </p>

      <div className="chips-row">
        {(['All', 'ATS-safe only', ...TEMPLATE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            className={`pill${filter === c ? ' pill--active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="gallery__grid">
        {visible.map((template) => {
          const active = template.id === resume.settings.templateId;
          // Preview through the same code path the switch uses, so the card
          // shows exactly what clicking it produces — section order included.
          const preview = { ...resume, settings: applyTemplate(resume.settings, template.id) };
          return (
            <div className={`tpl-card${active ? ' tpl-card--active' : ''}`} key={template.id}>
              <button
                type="button"
                className="tpl-card__preview"
                onClick={() => setTemplate(template.id)}
                aria-label={`Use the ${template.name} template`}
              >
                <div className="tpl-card__scaler">
                  <ResumeDocument resume={preview} preview={false} />
                </div>
              </button>
              <div className="tpl-card__meta">
                <div className="row row--between">
                  <strong>{template.name}</strong>
                  {template.atsSafe ? (
                    <span className="chip chip--ok" title="Single column, no graphics — parses reliably.">
                      ATS-safe
                    </span>
                  ) : (
                    <span className="chip chip--muted" title="Multi-column or graphical — best sent directly to a person.">
                      Designed
                    </span>
                  )}
                </div>
                <p className="muted small">{template.description}</p>
                <p className="tpl-card__best">
                  {template.bestFor.map((b) => (
                    <span className="pill pill--ghost" key={b}>
                      {b}
                    </span>
                  ))}
                </p>
                <button
                  type="button"
                  className={`btn ${active ? 'btn--ghost' : 'btn--primary'} btn--sm btn--block`}
                  onClick={() => setTemplate(template.id)}
                  disabled={active}
                >
                  {active ? 'In use' : 'Use this template'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
