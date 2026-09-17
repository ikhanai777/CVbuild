import { useMemo, useState } from 'react';
import { useResume, useStore } from '../state/store';
import { scoreResume, type Severity } from '../lib/analysis/score';
import { matchKeywords } from '../lib/analysis/keywords';
import { AutoTextarea } from './fields';

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Fix first',
  warning: 'Should fix',
  suggestion: 'Polish',
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);
  const tone = score >= 85 ? 'good' : score >= 70 ? 'ok' : score >= 45 ? 'warn' : 'bad';
  return (
    <div className={`score-ring score-ring--${tone}`}>
      <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" className="score-ring__track" />
        <circle
          cx="60"
          cy="60"
          r="52"
          className="score-ring__value"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring__label">
        <strong>{score}</strong>
        <span>{grade}</span>
      </div>
    </div>
  );
}

export function ReviewPanel() {
  const resume = useResume();
  const setMeta = useStore((s) => s.setMeta);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const score = useMemo(() => scoreResume(resume), [resume]);
  const keywords = useMemo(
    () => matchKeywords(resume, resume.meta.targetJobDescription),
    [resume],
  );

  const counts = {
    critical: score.issues.filter((i) => i.severity === 'critical').length,
    warning: score.issues.filter((i) => i.severity === 'warning').length,
    suggestion: score.issues.filter((i) => i.severity === 'suggestion').length,
  };
  const issues = filter === 'all' ? score.issues : score.issues.filter((i) => i.severity === filter);

  return (
    <div className="review">
      <section className="panel-block score-head">
        <ScoreRing score={score.total} grade={score.grade} />
        <div className="score-head__stats">
          <div className="stat">
            <strong>
              {score.stats.quantifiedBullets}/{score.stats.bulletCount}
            </strong>
            <span>bullets with a number</span>
          </div>
          <div className="stat">
            <strong>
              {score.stats.actionVerbBullets}/{score.stats.bulletCount}
            </strong>
            <span>open with an action verb</span>
          </div>
          <div className="stat">
            <strong>{score.stats.estimatedPages}</strong>
            <span>estimated pages</span>
          </div>
          <div className="stat">
            <strong>{score.stats.averageBulletWords}</strong>
            <span>words per bullet</span>
          </div>
        </div>
      </section>

      <section className="panel-block">
        <h3>Scorecard</h3>
        {score.categories.map((c) => (
          <div className="bar" key={c.id}>
            <div className="bar__head">
              <span>{c.label}</span>
              <span className="bar__score">{c.score}</span>
            </div>
            <div className="bar__track">
              <div
                className={`bar__fill bar__fill--${c.score >= 80 ? 'good' : c.score >= 55 ? 'ok' : 'bad'}`}
                style={{ width: `${c.score}%` }}
              />
            </div>
            <p className="muted small">{c.summary}</p>
          </div>
        ))}
      </section>

      <section className="panel-block">
        <h3>Target role</h3>
        <p className="muted small">
          Paste the advert. Tailoring to the posting is the single highest-return edit you can make,
          and this shows exactly which of its terms your CV never uses.
        </p>
        <AutoTextarea
          value={resume.meta.targetJobDescription}
          minRows={4}
          placeholder="Paste the job description here…"
          onChange={(v) => setMeta({ targetJobDescription: v })}
        />
        {keywords.total ? (
          <>
            <div className="row row--between keyword-head">
              <strong>
                {keywords.matched} of {keywords.total} key terms covered
              </strong>
              <span className={`chip ${keywords.coverage >= 70 ? 'chip--ok' : 'chip--warn'}`}>
                {keywords.coverage}% weighted coverage
              </span>
            </div>
            <div className="keywords">
              {keywords.hits.map((hit) => (
                <span
                  className={`pill ${hit.present ? 'pill--ok' : 'pill--missing'}`}
                  key={hit.term}
                  title={
                    hit.present
                      ? 'Already on your CV'
                      : 'Missing — work it in where it is honestly true of you'
                  }
                >
                  {hit.term}
                </span>
              ))}
            </div>
            <p className="muted small">
              Only add a term where it is genuinely true. Keyword-stuffing survives the filter and
              then fails the interview.
            </p>
          </>
        ) : null}
      </section>

      <section className="panel-block">
        <div className="row row--between">
          <h3>
            {score.issues.length} {score.issues.length === 1 ? 'finding' : 'findings'}
          </h3>
          <div className="chips-row">
            {(['all', 'critical', 'warning', 'suggestion'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`pill${filter === f ? ' pill--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `All (${score.issues.length})` : `${SEVERITY_LABEL[f]} (${counts[f]})`}
              </button>
            ))}
          </div>
        </div>

        {issues.length === 0 ? (
          <p className="note note--good">Nothing flagged here. Give it a final read for typos and send it.</p>
        ) : null}

        <ul className="issues">
          {issues.map((issue) => (
            <li className={`issue issue--${issue.severity}`} key={issue.id}>
              <div className="issue__head">
                <span className={`chip chip--${issue.severity}`}>{SEVERITY_LABEL[issue.severity]}</span>
                <span className="issue__category">{issue.category}</span>
              </div>
              <p className="issue__message">{issue.message}</p>
              <p className="issue__fix">{issue.fix}</p>
              {issue.location ? <p className="issue__location">{issue.location}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
