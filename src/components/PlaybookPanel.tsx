import { useState } from 'react';
import { PLAYBOOK } from '../data/playbook';
import { ACTION_VERBS } from '../lib/analysis/language';

export function PlaybookPanel() {
  const [openChapter, setOpenChapter] = useState<string>(PLAYBOOK[0].id);

  return (
    <div className="playbook">
      <p className="muted small">
        The rules the scorecard applies, with the reasoning behind each one. Everything here is
        guidance that holds across markets — where a convention is local (photos, page limits) it
        says so.
      </p>

      {PLAYBOOK.map((chapter) => {
        const open = openChapter === chapter.id;
        return (
          <section className={`chapter${open ? ' chapter--open' : ''}`} key={chapter.id}>
            <button
              type="button"
              className="chapter__head"
              onClick={() => setOpenChapter(open ? '' : chapter.id)}
              aria-expanded={open}
            >
              <span className="group__chevron" aria-hidden="true">
                {open ? '▾' : '▸'}
              </span>
              <span>
                <strong>{chapter.title}</strong>
                <span className="muted small chapter__intro">{chapter.intro}</span>
              </span>
            </button>
            {open ? (
              <div className="chapter__body">
                {chapter.entries.map((entry) => (
                  <article className="tip" key={entry.id}>
                    <h4>{entry.title}</h4>
                    <p>{entry.body}</p>
                    {entry.before && entry.after ? (
                      <div className="ba">
                        <div className="ba__col ba__col--before">
                          <span className="ba__label">Before</span>
                          <pre>{entry.before}</pre>
                        </div>
                        <div className="ba__col ba__col--after">
                          <span className="ba__label">After</span>
                          <pre>{entry.after}</pre>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}

      <section className="chapter chapter--open">
        <div className="chapter__head chapter__head--static">
          <span>
            <strong>Action verb bank</strong>
            <span className="muted small chapter__intro">
              Open every bullet with one of these. Past tense for previous roles, present tense only
              for your current one.
            </span>
          </span>
        </div>
        <div className="chapter__body">
          {Object.entries(ACTION_VERBS).map(([category, verbs]) => (
            <div className="verb-group" key={category}>
              <h4>{category}</h4>
              <p className="verb-list">
                {verbs.map((v) => (
                  <span className="pill pill--ghost" key={v}>
                    {v}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
