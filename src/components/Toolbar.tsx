import { useEffect, useRef, useState } from 'react';
import { useResume, useStore } from '../state/store';
import { downloadDocx } from '../lib/export/docx';
import { downloadJson } from '../lib/export/json';
import { printResume } from '../lib/export/print';
import { scoreResume } from '../lib/analysis/score';
import { askConfirm, askNotice, askText } from './dialogs';

function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

export function Toolbar({ onImport }: { onImport: () => void }) {
  const resume = useResume();
  const store = useStore();
  const resumes = useStore((s) => s.resumes);
  const [docsOpen, setDocsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState('');

  const docsRef = useOutsideClose(() => setDocsOpen(false));
  const exportRef = useOutsideClose(() => setExportOpen(false));

  const score = scoreResume(resume);

  const handleWord = async () => {
    setBusy('word');
    try {
      await downloadDocx(resume);
    } catch (e) {
      void askNotice(`The Word file could not be generated: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy('');
      setExportOpen(false);
    }
  };

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="logo" aria-hidden="true">
          CV
        </span>
        <span>
          <strong>CVBuild</strong>
          <span className="muted small toolbar__tagline">Print-ready CVs, built in your browser</span>
        </span>
      </div>

      <div className="toolbar__docs" ref={docsRef}>
        <button type="button" className="btn btn--ghost" onClick={() => setDocsOpen((v) => !v)}>
          {resume.meta.name} <span aria-hidden="true">▾</span>
        </button>
        {docsOpen ? (
          <div className="menu">
            <div className="menu__section">
              {resumes.map((r) => (
                <button
                  type="button"
                  className={`menu__item${r.meta.id === resume.meta.id ? ' menu__item--active' : ''}`}
                  key={r.meta.id}
                  onClick={() => {
                    store.selectResume(r.meta.id);
                    setDocsOpen(false);
                  }}
                >
                  <span>{r.meta.name}</span>
                  <span className="muted small">
                    {new Date(r.meta.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
            <div className="menu__section">
              <button
                type="button"
                className="menu__item"
                onClick={async () => {
                  setDocsOpen(false);
                  const name = await askText('Name this CV', resume.meta.name);
                  if (name) store.setMeta({ name });
                }}
              >
                Rename…
              </button>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  store.duplicateResume(resume.meta.id);
                  setDocsOpen(false);
                }}
              >
                Duplicate — tailor a copy for another role
              </button>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  store.newResume();
                  setDocsOpen(false);
                }}
              >
                New blank CV
              </button>
              <button
                type="button"
                className="menu__item menu__item--danger"
                disabled={resumes.length <= 1}
                onClick={async () => {
                  setDocsOpen(false);
                  if (await askConfirm(`Delete "${resume.meta.name}"? This can be undone with Ctrl+Z.`)) {
                    store.deleteResume(resume.meta.id);
                  }
                }}
              >
                Delete this CV
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="toolbar__spacer" />

      <div className="toolbar__score" title="Open the Review tab for the full breakdown">
        <span className={`score-pill score-pill--${score.total >= 85 ? 'good' : score.total >= 70 ? 'ok' : score.total >= 45 ? 'warn' : 'bad'}`}>
          {score.total}
        </span>
        <span className="muted small">CV score</span>
      </div>

      <button
        type="button"
        className="icon-btn"
        title="Undo (Ctrl+Z)"
        disabled={!store.past.length}
        onClick={store.undo}
      >
        ↶
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!store.future.length}
        onClick={store.redo}
      >
        ↷
      </button>

      <button type="button" className="btn btn--ghost" onClick={onImport}>
        Import CV
      </button>

      <div className="toolbar__export" ref={exportRef}>
        <button type="button" className="btn btn--primary" onClick={() => setExportOpen((v) => !v)}>
          Download <span aria-hidden="true">▾</span>
        </button>
        {exportOpen ? (
          <div className="menu menu--right">
            <button
              type="button"
              className="menu__item"
              onClick={() => {
                setExportOpen(false);
                printResume(resume);
              }}
            >
              <span>
                <strong>PDF</strong>
                <span className="muted small">
                  Opens your print dialog — choose “Save as PDF”. Text stays selectable, which ATS
                  systems require.
                </span>
              </span>
            </button>
            <button type="button" className="menu__item" disabled={busy === 'word'} onClick={handleWord}>
              <span>
                <strong>Word (.docx)</strong>
                <span className="muted small">
                  {busy === 'word' ? 'Building…' : 'A real, editable Word document — send when the advert asks for Word.'}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="menu__item"
              onClick={() => {
                downloadJson(resume);
                setExportOpen(false);
              }}
            >
              <span>
                <strong>JSON backup</strong>
                <span className="muted small">Re-importable — your content, without the formatting.</span>
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
