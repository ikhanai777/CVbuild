import { useEffect, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { ContentEditor } from './components/ContentEditor';
import { TemplateGallery } from './components/TemplateGallery';
import { DesignPanel } from './components/DesignPanel';
import { ReviewPanel } from './components/ReviewPanel';
import { PlaybookPanel } from './components/PlaybookPanel';
import { ImportDialog } from './components/ImportDialog';
import { DialogHost } from './components/dialogs';
import { Preview } from './components/Preview';
import { ResumeDocument } from './templates/ResumeDocument';
import { useResume, useStore } from './state/store';
import { applyPageRule } from './lib/export/print';
import { scoreResume } from './lib/analysis/score';

type Tab = 'content' | 'templates' | 'design' | 'review' | 'guide';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'content', label: 'Content' },
  { id: 'templates', label: 'Templates' },
  { id: 'design', label: 'Design' },
  { id: 'review', label: 'Review' },
  { id: 'guide', label: 'Guide' },
];

export function App() {
  const resume = useResume();
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const [tab, setTab] = useState<Tab>('content');
  const [importOpen, setImportOpen] = useState(false);

  const issueCount = scoreResume(resume).issues.filter((i) => i.severity !== 'suggestion').length;

  // Keep the @page rule in sync so Ctrl+P prints correctly without going
  // through the Download menu first.
  useEffect(() => {
    applyPageRule(resume);
  }, [resume.settings.paperSize, resume]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <div className="app">
      <Toolbar onImport={() => setImportOpen(true)} />

      <div className="app__body">
        <section className="panel">
          <nav className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`tab${tab === t.id ? ' tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === 'review' && issueCount ? <span className="tab__badge">{issueCount}</span> : null}
              </button>
            ))}
          </nav>

          <div className="panel__scroll">
            {tab === 'content' ? <ContentEditor /> : null}
            {tab === 'templates' ? <TemplateGallery /> : null}
            {tab === 'design' ? <DesignPanel /> : null}
            {tab === 'review' ? <ReviewPanel /> : null}
            {tab === 'guide' ? <PlaybookPanel /> : null}
          </div>
        </section>

        <Preview />
      </div>

      {importOpen ? <ImportDialog onClose={() => setImportOpen(false)} /> : null}

      <DialogHost />

      {/* Rendered off-screen and revealed only by the print stylesheet, so the
          printed PDF is the document itself rather than a screenshot of the app. */}
      <div className="print-root" aria-hidden="true">
        <ResumeDocument resume={resume} preview={false} />
      </div>
    </div>
  );
}
