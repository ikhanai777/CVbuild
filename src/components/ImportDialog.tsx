import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import { extractText } from '../lib/import/extractText';
import { parseResumeText, type ParseResult } from '../lib/import/parseResume';
import { parseJsonResume } from '../lib/export/json';
import type { Resume } from '../types/resume';
import { ResumeDocument } from '../templates/ResumeDocument';

type Mode = 'choose' | 'paste' | 'working' | 'review';

function summarise(resume: Resume) {
  return [
    { label: 'Roles', value: resume.experience.length },
    { label: 'Qualifications', value: resume.education.length },
    { label: 'Skill groups', value: resume.skills.length },
    { label: 'Projects', value: resume.projects.length },
    { label: 'Certifications', value: resume.certifications.length },
    { label: 'Bullets', value: resume.experience.reduce((n, e) => n + e.highlights.length, 0) },
  ];
}

/**
 * Import flow. Nothing leaves the browser: PDF and Word files are parsed
 * locally, which is the only responsible default for a document full of
 * personal data.
 */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const importResume = useStore((s) => s.importResume);
  const replaceActive = useStore((s) => s.replaceActive);
  const [mode, setMode] = useState<Mode>('choose');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const runParse = (raw: string, name: string) => {
    const parsed = parseResumeText(raw, name);
    setResult(parsed);
    setMode('review');
  };

  const handleFile = async (file: File) => {
    setError('');
    setWarnings([]);
    setMode('working');
    setStatus(`Reading ${file.name}…`);
    try {
      const extracted = await extractText(file);
      setWarnings(extracted.warnings);
      if (extracted.source === 'json') {
        const resume = parseJsonResume(extracted.text);
        setResult({ resume, notes: [], detectedSections: ['Loaded from a saved CVBuild/JSON Resume file'] });
        setMode('review');
        return;
      }
      if (!extracted.text.trim()) {
        setError(
          extracted.warnings[0] ??
            'No text could be read from that file. If it is a scan, paste the text instead.',
        );
        setMode('choose');
        return;
      }
      runParse(extracted.text, file.name.replace(/\.[^.]+$/, ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file could not be read.');
      setMode('choose');
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Import a CV">
      <div className="modal modal--wide">
        <header className="modal__head">
          <h2>Import an existing CV</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal__body">
          {mode === 'choose' || mode === 'paste' ? (
            <>
              <div
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFile(file);
                }}
                onClick={() => fileRef.current?.click()}
              >
                <strong>Drop a PDF, Word or text file here</strong>
                <span className="muted small">
                  or click to browse — .pdf, .docx, .txt, .md, .json
                </span>
                <span className="muted small">
                  Files are read entirely in your browser. Nothing is uploaded.
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.json,application/pdf,text/plain,application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = '';
                }}
              />

              <div className="divider"><span>or paste the text</span></div>

              <textarea
                className="input input--area"
                rows={8}
                value={text}
                placeholder="Paste your CV text here…"
                onChange={(e) => setText(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--primary"
                disabled={text.trim().length < 40}
                onClick={() => runParse(text, 'Pasted CV')}
              >
                Read pasted text
              </button>

              {error ? <p className="note note--warn">{error}</p> : null}
            </>
          ) : null}

          {mode === 'working' ? <p className="note">{status}</p> : null}

          {mode === 'review' && result ? (
            <div className="import-review">
              <div className="import-review__side">
                <h3>What we read</h3>
                <ul className="kv">
                  {summarise(result.resume).map((row) => (
                    <li key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </li>
                  ))}
                </ul>

                {result.detectedSections.length ? (
                  <>
                    <h4>Headings found</h4>
                    <p className="chips-row">
                      {result.detectedSections.map((s, i) => (
                        <span className="pill pill--ghost" key={`${s}-${i}`}>
                          {s}
                        </span>
                      ))}
                    </p>
                  </>
                ) : null}

                {[...warnings, ...result.notes].length ? (
                  <>
                    <h4>Worth checking</h4>
                    <ul className="notes-list">
                      {[...warnings, ...result.notes].map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="note note--good">Everything parsed cleanly.</p>
                )}

                <p className="muted small">
                  Parsing a CV is guesswork — there is no standard layout. Check the dates and job
                  titles before you send it anywhere.
                </p>
              </div>

              <div className="import-review__preview">
                <div className="mini-page">
                  <ResumeDocument resume={result.resume} preview={false} />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="modal__foot">
          {mode === 'review' && result ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setMode('choose')}>
                Back
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  replaceActive(result.resume);
                  onClose();
                }}
              >
                Replace current CV
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  importResume(result.resume);
                  onClose();
                }}
              >
                Add as a new CV
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
