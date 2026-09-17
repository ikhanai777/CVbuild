import { describe, expect, it } from 'vitest';
import { adoptSectionLayout, applyTemplate } from './applyTemplate';
import { DEFAULT_SETTINGS } from '../data/defaults';
import { TEMPLATES } from './registry';
import type { ResumeSettings } from '../types/resume';

const base = (): ResumeSettings => ({ ...DEFAULT_SETTINGS, sectionOrder: [...DEFAULT_SETTINGS.sectionOrder] });

describe('applyTemplate', () => {
  it('adopts the template typography and colour', () => {
    const next = applyTemplate(base(), 'tech-matrix');
    expect(next.templateId).toBe('tech-matrix');
    expect(next.accentColor).toBe('#0f766e');
  });

  it('applies a template that imposes its own section layout', () => {
    const next = applyTemplate(base(), 'academic-cv');
    expect(next.sectionOrder[0]).toBe('education');
    expect(next.hiddenSections).toContain('summary');
    expect(next.sectionPreset).toBe('academic-cv');
  });

  it('hands the layout back when switching to a template with no opinion', () => {
    const before = base();
    const academic = applyTemplate(before, 'academic-cv');
    const after = applyTemplate(academic, 'elegant-sidebar');

    // The regression this guards: the summary must not stay hidden, and the
    // academic ordering must not follow the user to an unrelated template.
    expect(after.hiddenSections).not.toContain('summary');
    expect(after.sectionOrder).toEqual(before.sectionOrder);
    expect(after.hiddenSections).toEqual(before.hiddenSections);
    expect(after.sectionPreset).toBeNull();
    expect(after.userSectionOrder).toBeNull();
  });

  it('keeps custom sections when a preset takes over', () => {
    const settings = base();
    settings.sectionOrder = [...settings.sectionOrder, 'custom:abc'];
    const next = applyTemplate(settings, 'graduate-entry');
    expect(next.sectionOrder).toContain('custom:abc');
  });

  it('does not revert a layout the user set themselves', () => {
    const settings = applyTemplate(base(), 'academic-cv');
    settings.hiddenSections = settings.hiddenSections.filter((s) => s !== 'summary');
    adoptSectionLayout(settings);

    const after = applyTemplate(settings, 'modern-professional');
    expect(after.hiddenSections).not.toContain('summary');
    expect(after.sectionOrder[0]).toBe('education'); // their choice, kept
  });

  it('round-trips through every template without losing a section', () => {
    let settings = base();
    const expected = [...settings.sectionOrder].sort();
    for (const template of TEMPLATES) {
      settings = applyTemplate(settings, template.id);
      const all = new Set([...settings.sectionOrder, ...(settings.userSectionOrder ?? [])]);
      expect([...all].sort()).toEqual(expected);
    }
    settings = applyTemplate(settings, 'ats-classic');
    expect([...settings.sectionOrder].sort()).toEqual(expected);
  });
});
