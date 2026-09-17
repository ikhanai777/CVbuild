import { useEffect, useRef, useState } from 'react';

/**
 * In-app confirm and prompt dialogs.
 *
 * The browser's own `confirm()` and `prompt()` are ignored without warning in a
 * sandboxed iframe, which is how the app is served when it is embedded in
 * another page. Anything built on them — deleting an entry, renaming a section —
 * would silently do nothing there. These are plain DOM dialogs instead, so the
 * behaviour is identical wherever the app runs.
 */

interface Request {
  kind: 'confirm' | 'prompt';
  message: string;
  initial: string;
  confirmLabel: string;
  danger: boolean;
  /** A notice has nothing to cancel, so it shows only the acknowledgement. */
  notice?: boolean;
  resolve: (value: string | boolean | null) => void;
}

let enqueue: ((request: Request) => void) | null = null;

export function askConfirm(
  message: string,
  options: { confirmLabel?: string; danger?: boolean } = {},
): Promise<boolean> {
  if (!enqueue) return Promise.resolve(window.confirm(message));
  return new Promise((resolve) =>
    enqueue!({
      kind: 'confirm',
      message,
      initial: '',
      confirmLabel: options.confirmLabel ?? 'Delete',
      danger: options.danger ?? true,
      resolve: (v) => resolve(v === true),
    }),
  );
}

/** A message with a single acknowledgement, replacing `alert()`. */
export function askNotice(message: string): Promise<void> {
  if (!enqueue) {
    window.alert(message);
    return Promise.resolve();
  }
  return new Promise((resolve) =>
    enqueue!({
      kind: 'confirm',
      message,
      initial: '',
      confirmLabel: 'OK',
      danger: false,
      notice: true,
      resolve: () => resolve(),
    }),
  );
}

export function askText(message: string, initial = ''): Promise<string | null> {
  if (!enqueue) return Promise.resolve(window.prompt(message, initial));
  return new Promise((resolve) =>
    enqueue!({
      kind: 'prompt',
      message,
      initial,
      confirmLabel: 'Save',
      danger: false,
      resolve: (v) => resolve(typeof v === 'string' ? v : null),
    }),
  );
}

/** Mounted once, at the app root. */
export function DialogHost() {
  const [request, setRequest] = useState<Request | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    enqueue = (next) => {
      setValue(next.initial);
      setRequest(next);
    };
    return () => {
      enqueue = null;
    };
  }, []);

  useEffect(() => {
    if (request?.kind === 'prompt') inputRef.current?.select();
  }, [request]);

  if (!request) return null;

  const close = (result: string | boolean | null) => {
    request.resolve(result);
    setRequest(null);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(request.kind === 'confirm' ? false : null);
      }}
    >
      {/* Deliberately not a <form>: a sandboxed iframe without `allow-forms`
          blocks submission before the handler runs, which would leave the
          dialog stuck open — the same class of failure as the native ones. */}
      <div
        className="modal modal--ask"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && request.kind === 'prompt') {
            e.preventDefault();
            close(value);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            close(request.kind === 'confirm' ? false : null);
          }
        }}
      >
        <div className="modal__body">
          <p className="ask__message">{request.message}</p>
          {request.kind === 'prompt' ? (
            <input
              ref={inputRef}
              className="input"
              value={value}
              autoFocus
              onChange={(e) => setValue(e.target.value)}
            />
          ) : null}
        </div>
        <footer className="modal__foot">
          {request.notice ? null : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => close(request.kind === 'confirm' ? false : null)}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            data-dialog-confirm
            className={`btn ${request.danger ? 'btn--danger' : 'btn--primary'}`}
            autoFocus={request.kind === 'confirm'}
            onClick={() => close(request.kind === 'confirm' ? true : value)}
          >
            {request.confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
