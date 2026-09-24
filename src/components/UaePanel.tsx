import { useMemo, useState } from 'react';
import { useResume, useStore } from '../state/store';
import { UAE_JOB_CHANNELS, UAE_SECTORS } from '../data/uaeSectors';
import { resumeText, uaeChecklist, uaeScore, type CheckStatus } from '../lib/uae';
import { sampleResumeUae } from '../data/sampleResumeUae';
import { askConfirm } from './dialogs';
import { Checkbox } from './fields';

const STATUS_ICON: Record<CheckStatus, string> = {
  ok: '✓',
  missing: '!',
  risk: '✕',
  tip: '›',
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  ok: 'Done',
  missing: 'Missing',
  risk: 'Remove',
  tip: 'Tip',
};

/**
 * The UAE Toolkit: a readiness checklist for the Gulf market, sector packs of
 * keywords and credentials a UAE recruiter searches for, and the channels
 * candidates actually apply through.
 */
export function UaePanel() {
  const resume = useResume();
  const store = useStore();
  const [sectorId, setSectorId] = useState(UAE_SECTORS[0].id);
  const sector = UAE_SECTORS.find((s) => s.id === sectorId) ?? UAE_SECTORS[0];

  const checks = useMemo(() => uaeChecklist(resume), [resume]);
  const score = uaeScore(checks);
  const text = useMemo(() => resumeText(resume).toLowerCase(), [resume]);
  const has = (term: string) => text.includes(term.toLowerCase().replace(/\s*\(.*\)$/, ''));

  const uae = resume.settings.market === 'uae';
  const tone = score >= 85 ? 'good' : score >= 65 ? 'ok' : 'bad';

  return (
    <div className="uae">
      <section className="panel-block uae-hero">
        <div className="uae-hero__flag" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="uae-hero__text">
          <h3>UAE market readiness</h3>
          <p className="muted small">
            What Gulf recruiters screen on before they read your bullets — visa, nationality,
            notice period, a local number, the right licence — checked against your CV.
          </p>
        </div>
        <div className={`uae-hero__score uae-hero__score--${tone}`}>
          <strong>{score}</strong>
          <span>/ 100</span>
        </div>
      </section>

      {!uae ? (
        <p className="note note--warn">
          This CV is set to the International market, so these checks are not counted in the Review
          score.{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => store.setSettings({ market: 'uae' })}
          >
            Switch to UAE & GCC
          </button>
        </p>
      ) : null}

      <section className="panel-block">
        <ul className="uae-checks">
          {checks.map((c) => (
            <li className={`uae-check uae-check--${c.status}`} key={c.id}>
              <span className="uae-check__icon" aria-hidden="true">
                {STATUS_ICON[c.status]}
              </span>
              <span className="uae-check__body">
                <span className="uae-check__label">
                  {c.label}
                  <span className={`uae-check__tag uae-check__tag--${c.status}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </span>
                <span className="muted small">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-block">
        <h3>Sector pack</h3>
        <p className="muted small">
          Keywords UAE recruiters search for in your sector. Tap one to add it to your skills — only
          where it is honestly true, because an interviewer will ask.
        </p>
        <div className="chips-row">
          {UAE_SECTORS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`pill${s.id === sectorId ? ' pill--active' : ''}`}
              onClick={() => setSectorId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="note">{sector.note}</p>

        <h4>Keywords</h4>
        <div className="chips-row">
          {sector.keywords.map((k) => {
            const present = has(k);
            return (
              <button
                key={k}
                type="button"
                className={`pill ${present ? 'pill--ok' : ''}`}
                disabled={present}
                title={present ? 'Already on your CV' : 'Add to skills'}
                onClick={() => store.addSkills('Key skills', [k])}
              >
                {present ? '✓ ' : '+ '}
                {k}
              </button>
            );
          })}
        </div>

        <h4>Credentials worth naming</h4>
        <div className="chips-row">
          {sector.credentials.map((c) => (
            <span key={c} className={`pill ${has(c) ? 'pill--ok' : 'pill--ghost'}`}>
              {c}
            </span>
          ))}
        </div>
        <p className="muted small">
          Add the ones you hold under Certifications, with the status — "active", "eligibility
          letter", "in progress".
        </p>

        <h4>Summary scaffold</h4>
        <blockquote className="uae-scaffold">{sector.summary}</blockquote>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={async () => {
            if (
              !resume.basics.summary.trim() ||
              (await askConfirm('Replace your current summary with this scaffold?'))
            ) {
              store.setBasics({ summary: sector.summary });
            }
          }}
        >
          Use as my summary
        </button>
      </section>

      <section className="panel-block">
        <h3>Where to apply</h3>
        <ul className="uae-channels">
          {UAE_JOB_CHANNELS.map((c) => (
            <li key={c.name}>
              <strong>{c.name}</strong>
              <span className="muted small">{c.tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-block">
        <h3>Presentation</h3>
        <Checkbox
          label="Bilingual section headings — English with Arabic: الخبرة العملية"
          checked={resume.settings.bilingualHeadings}
          onChange={(v) => store.setSettings({ bilingualHeadings: v })}
        />
        <Checkbox
          label="Nationality, visa, notice period and licence in the header"
          checked={resume.settings.showKeyFacts}
          onChange={(v) => store.setSettings({ showKeyFacts: v })}
        />
        <p className="muted small">
          Send two versions: a designed template from the UAE & Gulf set when you email a hiring
          manager directly, and <strong>Gulf Portal</strong> or <strong>Dubai Executive</strong>{' '}
          for Bayt, LinkedIn and employer portals, where software reads the CV first.
        </p>
        <div className="row row--gap">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => store.setTemplate('gulf-portal')}>
            Switch to Gulf Portal
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => store.newResume(sampleResumeUae())}>
            Open the UAE sample CV
          </button>
        </div>
      </section>
    </div>
  );
}
