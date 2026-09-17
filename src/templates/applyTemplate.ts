import { DEFAULT_SECTION_ORDER, type ResumeSettings, type SectionId } from '../types/resume';
import { getTemplate } from './registry';

/**
 * Applies a template to a settings object.
 *
 * Switching template adopts that design's typography and colour — that is what
 * "try another template" is expected to do, and content never changes.
 *
 * Section layout needs more care. A handful of templates impose their own order
 * and hide sections (the Academic CV drops the summary and leads with
 * education). Left as a plain overwrite, that preference would outlive the
 * template: switch to Academic and back, and your summary would still be hidden
 * with nothing on screen to say why. So a template-imposed layout is treated as
 * a loan — the user's own order is held aside and handed back when they move to
 * a template that has no opinion.
 */
export function applyTemplate(settings: ResumeSettings, templateId: string): ResumeSettings {
  const template = getTemplate(templateId);
  const { sectionOrder: presetOrder, hiddenSections: presetHidden, ...rest } = template.defaults;
  const next: ResumeSettings = { ...settings, ...rest, templateId };
  const hasPreset = !!presetOrder || !!presetHidden;

  if (hasPreset) {
    // Hold the user's layout the first time a preset takes over.
    if (!settings.sectionPreset) {
      next.userSectionOrder = [...settings.sectionOrder];
      next.userHiddenSections = [...settings.hiddenSections];
    }
    if (presetOrder) {
      // Keep anything the preset does not mention — custom sections especially.
      const extra = settings.sectionOrder.filter((id) => !presetOrder.includes(id));
      next.sectionOrder = [...presetOrder, ...extra];
    }
    if (presetHidden) next.hiddenSections = [...presetHidden];
    next.sectionPreset = templateId;
  } else if (settings.sectionPreset) {
    next.sectionOrder = settings.userSectionOrder ?? [...DEFAULT_SECTION_ORDER];
    next.hiddenSections = settings.userHiddenSections ?? [];
    next.sectionPreset = null;
    next.userSectionOrder = null;
    next.userHiddenSections = null;
  }

  return next;
}

/**
 * Marks the current section layout as the user's own. Called whenever they
 * reorder, hide or add a section, so a later template switch no longer reverts
 * what they deliberately set.
 */
export function adoptSectionLayout(settings: ResumeSettings): void {
  settings.sectionPreset = null;
  settings.userSectionOrder = null;
  settings.userHiddenSections = null;
}

export type { SectionId };
