import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BULLET_PATTERNS } from '../data/playbook';
import { hasMetric, startsWithActionVerb, suggestVerbs, weakOpener, wordCount } from '../lib/analysis/language';

export function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span className="field__label">
        {label}
        {hint ? <span className="field__hint" title={hint}>?</span> : null}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className="input"
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Textarea that grows with its content so long summaries stay visible. */
export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      className="input input--area"
      rows={minRows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Comma/enter separated chips, used for skills and interests. */
export function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = (text: string) => {
    const parts = text
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length) onChange([...values, ...parts]);
    setDraft('');
  };

  return (
    <div className="tag-input">
      <div className="tag-input__tags">
        {values.map((value, i) => (
          <span className="tag" key={`${value}-${i}`}>
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((_, index) => index !== i))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        value={draft}
        placeholder={placeholder ?? 'Type and press Enter'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
      />
    </div>
  );
}

/**
 * Bullet editor with live coaching. The feedback is deliberately inline: a
 * warning that appears next to the sentence being written gets acted on; a
 * report at the end of the process does not.
 */
export function BulletEditor({
  items,
  onChange,
  label = 'Achievements',
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label?: string;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  const listId = useId();

  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="bullets">
      <div className="bullets__head">
        <span className="field__label">{label}</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange([...items, ''])}>
          + Add bullet
        </button>
      </div>

      {items.length === 0 ? (
        <p className="muted small">
          No bullets yet. Aim for 3–6 on a recent role, each one an outcome with a number.
        </p>
      ) : null}

      {items.map((item, index) => {
        const weak = weakOpener(item);
        const words = wordCount(item);
        const quantified = hasMetric(item);
        const verbLed = startsWithActionVerb(item);
        const showCoach = focused === index && item.trim().length > 0;

        return (
          <div className="bullet" key={`${listId}-${index}`}>
            <div className="bullet__row">
              <span className="bullet__dot" aria-hidden="true" />
              <AutoTextarea
                value={item}
                minRows={2}
                placeholder="Led … , reducing … by …%"
                onChange={(value) => update(index, value)}
              />
              <div className="bullet__actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    onChange(next);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    onChange(next);
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  title="Delete bullet"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            </div>

            <div
              className="bullet__meta"
              onFocus={() => setFocused(index)}
              onMouseEnter={() => setFocused(index)}
            >
              <button
                type="button"
                className="bullet__toggle"
                onClick={() => setFocused(focused === index ? null : index)}
              >
                {item.trim() ? (
                  <>
                    <span className={`chip ${verbLed ? 'chip--ok' : 'chip--warn'}`}>
                      {verbLed ? 'action verb' : 'weak opener'}
                    </span>
                    <span className={`chip ${quantified ? 'chip--ok' : 'chip--warn'}`}>
                      {quantified ? 'quantified' : 'no number'}
                    </span>
                    <span className={`chip ${words > 34 ? 'chip--warn' : 'chip--muted'}`}>{words} words</span>
                  </>
                ) : (
                  <span className="chip chip--muted">empty</span>
                )}
              </button>
            </div>

            {showCoach ? (
              <div className="coach">
                {weak ? (
                  <p className="coach__line">
                    <strong>"{weak.phrase}"</strong> — {weak.fix}
                  </p>
                ) : null}
                {!verbLed ? (
                  <p className="coach__line">
                    Try opening with:{' '}
                    {suggestVerbs(item).map((verb) => (
                      <button
                        key={verb}
                        type="button"
                        className="pill"
                        onClick={() => {
                          const stripped = item.replace(/^\s*\W*\w+\s*/, '');
                          update(index, `${verb} ${stripped}`.replace(/\s{2,}/g, ' '));
                        }}
                      >
                        {verb}
                      </button>
                    ))}
                  </p>
                ) : null}
                {!quantified ? (
                  <p className="coach__line">
                    No number yet. What changed, by how much, over what period? Ranges and team sizes count.
                  </p>
                ) : null}
                {words > 34 ? (
                  <p className="coach__line">
                    This runs past two printed lines — split it into two bullets or cut the setup.
                  </p>
                ) : null}
                <p className="coach__patterns">
                  {BULLET_PATTERNS.map((pattern) => (
                    <button
                      key={pattern.label}
                      type="button"
                      className="pill pill--ghost"
                      title={pattern.text}
                      onClick={() => update(index, pattern.text)}
                    >
                      {pattern.label}
                    </button>
                  ))}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Collapsible card used for each experience/education/project entry. */
export function EntryCard({
  title,
  subtitle,
  index,
  total,
  onMove,
  onDuplicate,
  onRemove,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  index: number;
  total: number;
  onMove: (delta: number) => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`entry-card${open ? ' entry-card--open' : ''}`}>
      <div className="entry-card__head">
        <button type="button" className="entry-card__toggle" onClick={() => setOpen(!open)}>
          <span className="entry-card__chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span className="entry-card__titles">
            <span className="entry-card__title">{title || 'Untitled'}</span>
            {subtitle ? <span className="entry-card__subtitle">{subtitle}</span> : null}
          </span>
        </button>
        <div className="entry-card__actions">
          <button
            type="button"
            className="icon-btn"
            title="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          {onDuplicate ? (
            <button type="button" className="icon-btn" title="Duplicate" onClick={onDuplicate}>
              ⧉
            </button>
          ) : null}
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            title="Delete"
            onClick={() => {
              if (confirm('Delete this entry? You can undo with Ctrl+Z.')) onRemove();
            }}
          >
            ×
          </button>
        </div>
      </div>
      {open ? <div className="entry-card__body">{children}</div> : null}
    </div>
  );
}
