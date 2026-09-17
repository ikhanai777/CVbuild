/**
 * JSON import/export — the escape hatch. A CV the user can round-trip is a CV
 * they can back up, version and move between machines without losing work.
 */
import { DEFAULT_SECTION_ORDER, RESUME_SCHEMA_VERSION, type Resume } from '../../types/resume';
import { emptyResume, DEFAULT_SETTINGS } from '../../data/defaults';
import { suggestedFileName } from './docx';

export function exportJson(resume: Resume): string {
  return JSON.stringify(resume, null, 2);
}

export function downloadJson(resume: Resume): void {
  const blob = new Blob([exportJson(resume)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedFileName(resume, 'json');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Accepts anything shaped roughly like a resume — our own export, or a
 * JSON Resume document — and fills in whatever is missing.
 */
export function migrateResume(input: unknown): Resume {
  const base = emptyResume();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, any>;

  // JSON Resume (jsonresume.org) uses `basics.name` and `work`.
  const isJsonResume = !!raw.basics && typeof raw.basics === 'object' && 'name' in raw.basics && !raw.version;

  if (isJsonResume) {
    const b = raw.basics ?? {};
    const profiles: any[] = Array.isArray(b.profiles) ? b.profiles : [];
    const profile = (network: string) =>
      profiles.find((p) => String(p?.network ?? '').toLowerCase() === network)?.url ?? '';
    return {
      ...base,
      basics: {
        ...base.basics,
        fullName: b.name ?? '',
        headline: b.label ?? '',
        email: b.email ?? '',
        phone: b.phone ?? '',
        location: [b.location?.city, b.location?.countryCode].filter(Boolean).join(', '),
        website: b.url ?? b.website ?? '',
        linkedin: profile('linkedin'),
        github: profile('github'),
        photo: '',
        summary: b.summary ?? '',
      },
      experience: (raw.work ?? []).map((w: any, i: number) => ({
        id: `exp${i}`,
        company: w.name ?? w.company ?? '',
        position: w.position ?? '',
        location: w.location ?? '',
        startDate: w.startDate ?? '',
        endDate: w.endDate ?? '',
        current: !w.endDate,
        summary: w.summary ?? '',
        highlights: Array.isArray(w.highlights) ? w.highlights : [],
      })),
      education: (raw.education ?? []).map((e: any, i: number) => ({
        id: `edu${i}`,
        institution: e.institution ?? '',
        degree: e.studyType ?? '',
        field: e.area ?? '',
        location: '',
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        grade: e.score ?? '',
        highlights: Array.isArray(e.courses) ? e.courses : [],
      })),
      skills: (raw.skills ?? []).map((s: any, i: number) => ({
        id: `sk${i}`,
        category: s.name ?? '',
        items: Array.isArray(s.keywords) ? s.keywords : [],
      })),
      projects: (raw.projects ?? []).map((p: any, i: number) => ({
        id: `pr${i}`,
        name: p.name ?? '',
        role: '',
        link: p.url ?? '',
        startDate: p.startDate ?? '',
        endDate: p.endDate ?? '',
        description: p.description ?? '',
        highlights: Array.isArray(p.highlights) ? p.highlights : [],
      })),
      languages: (raw.languages ?? []).map((l: any, i: number) => ({
        id: `ln${i}`,
        name: l.language ?? '',
        level: l.fluency ?? '',
      })),
      interests: (raw.interests ?? []).map((i: any) => i?.name ?? '').filter(Boolean),
    };
  }

  const settings = { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) };
  if (!Array.isArray(settings.sectionOrder) || !settings.sectionOrder.length) {
    settings.sectionOrder = [...DEFAULT_SECTION_ORDER];
  }
  if (!Array.isArray(settings.hiddenSections)) settings.hiddenSections = [];
  if (!settings.sectionTitles || typeof settings.sectionTitles !== 'object') {
    settings.sectionTitles = {};
  }

  const arr = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  return {
    version: RESUME_SCHEMA_VERSION,
    meta: { ...base.meta, ...(raw.meta ?? {}) },
    settings,
    basics: { ...base.basics, ...(raw.basics ?? {}) },
    experience: arr(raw.experience),
    education: arr(raw.education),
    skills: arr(raw.skills),
    projects: arr(raw.projects),
    certifications: arr(raw.certifications),
    awards: arr(raw.awards),
    publications: arr(raw.publications),
    languages: arr(raw.languages),
    volunteer: arr(raw.volunteer),
    interests: arr<string>(raw.interests),
    references: arr(raw.references),
    customSections: arr(raw.customSections),
  };
}

export function parseJsonResume(text: string): Resume {
  return migrateResume(JSON.parse(text));
}
