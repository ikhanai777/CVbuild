import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_CATEGORIES, TEMPLATES, getTemplate } from './registry';

/**
 * Integrity checks for the template catalogue. Cheap to run, and exactly the
 * kind of mistake a copy-pasted new template entry makes: a duplicate id, a
 * category that isn't in the picker's filter list, or a CSS class that was
 * never actually styled.
 */
describe('template registry', () => {
  it('has unique, non-empty ids and names', () => {
    const ids = TEMPLATES.map((t) => t.id);
    const names = TEMPLATES.map((t) => t.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    for (const t of TEMPLATES) {
      expect(t.id.trim()).not.toBe('');
      expect(t.name.trim()).not.toBe('');
    }
  });

  it('assigns every template to a category the picker actually lists', () => {
    for (const t of TEMPLATES) {
      expect(TEMPLATE_CATEGORIES).toContain(t.category);
    }
  });

  it('marks a two-column or banner layout as not ATS-safe', () => {
    const multiColumnLayouts = new Set(['sidebar-left', 'sidebar-right', 'header-band']);
    for (const t of TEMPLATES) {
      if (multiColumnLayouts.has(t.layout)) expect(t.atsSafe).toBe(false);
    }
  });

  it('gives every sidebar layout at least one sidebar section', () => {
    for (const t of TEMPLATES) {
      if (t.layout === 'sidebar-left' || t.layout === 'sidebar-right') {
        expect(t.sidebarSections?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('gives every template a className that is actually styled in templates.css', () => {
    const cssPath = fileURLToPath(new URL('../styles/templates.css', import.meta.url));
    const css = readFileSync(cssPath, 'utf8');
    for (const t of TEMPLATES) {
      expect(t.className.trim()).not.toBe('');
      expect(css.includes(`.${t.className}`)).toBe(true);
    }
  });

  it('resolves every id and falls back sanely for an unknown one', () => {
    for (const t of TEMPLATES) {
      expect(getTemplate(t.id).id).toBe(t.id);
    }
    expect(getTemplate('not-a-real-template').id).toBe(TEMPLATES[0].id);
  });

  it('has at least one Engineering template with an ATS-safe option', () => {
    const engineering = TEMPLATES.filter((t) => t.category === 'Engineering');
    expect(engineering.length).toBeGreaterThanOrEqual(4);
    expect(engineering.some((t) => t.atsSafe)).toBe(true);
  });
});
