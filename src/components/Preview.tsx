import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useResume } from '../state/store';
import { ResumeDocument } from '../templates/ResumeDocument';

const PAGE_HEIGHT_MM = { A4: 297, Letter: 279.4 } as const;
const MM_TO_PX = 96 / 25.4;

/**
 * Live preview at true physical size, with guides showing where the printed
 * page will break. The break guides matter more than they look: a bullet split
 * across pages, or a heading stranded at the bottom, is the most common thing
 * people only notice after printing.
 */
export function Preview() {
  const resume = useResume();
  const [zoom, setZoom] = useState(0.8);
  const [autoFit, setAutoFit] = useState(true);
  const [pages, setPages] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const pageHeightPx = PAGE_HEIGHT_MM[resume.settings.paperSize] * MM_TO_PX;

  // Fit-to-width keeps the whole page visible as the window resizes.
  useEffect(() => {
    if (!autoFit) return;
    const frame = frameRef.current;
    if (!frame) return;
    const fit = () => {
      const available = frame.clientWidth - 48;
      const pageWidth = (resume.settings.paperSize === 'A4' ? 210 : 215.9) * MM_TO_PX;
      setZoom(Math.max(0.35, Math.min(1.2, available / pageWidth)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [autoFit, resume.settings.paperSize]);

  // Count how many printed pages the content currently spills onto.
  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const measure = () => {
      const height = el.getBoundingClientRect().height / zoom;
      setPages(Math.max(1, Math.ceil(height / pageHeightPx - 0.02)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [resume, zoom, pageHeightPx]);

  return (
    <div className="preview">
      <div className="preview__bar">
        <span className="muted small">
          {pages} page{pages === 1 ? '' : 's'} · {resume.settings.paperSize}
        </span>
        <div className="preview__zoom">
          <button
            type="button"
            className="icon-btn"
            title="Zoom out"
            onClick={() => {
              setAutoFit(false);
              setZoom((z) => Math.max(0.35, Math.round((z - 0.1) * 100) / 100));
            }}
          >
            −
          </button>
          <span className="preview__zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="icon-btn"
            title="Zoom in"
            onClick={() => {
              setAutoFit(false);
              setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 100) / 100));
            }}
          >
            +
          </button>
          <button
            type="button"
            className={`pill${autoFit ? ' pill--active' : ''}`}
            onClick={() => setAutoFit((v) => !v)}
          >
            Fit
          </button>
        </div>
      </div>

      <div className="preview__frame" ref={frameRef}>
        <div className="preview__scaler" style={{ transform: `scale(${zoom})` }} ref={pageRef}>
          <ResumeDocument resume={resume} />
          {pages > 1
            ? Array.from({ length: pages - 1 }, (_, i) => (
                <div
                  className="page-break"
                  key={i}
                  style={{ top: `${(i + 1) * pageHeightPx}px` }}
                  aria-hidden="true"
                >
                  <span>page {i + 2}</span>
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
