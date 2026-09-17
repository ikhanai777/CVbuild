import {
  DEFAULT_SECTION_ORDER,
  RESUME_SCHEMA_VERSION,
  type Resume,
  type ResumeSettings,
} from '../types/resume';
import { uid } from '../lib/id';

export const DEFAULT_SETTINGS: ResumeSettings = {
  templateId: 'ats-classic',
  accentColor: '#1f4e79',
  fontFamily: 'Inter',
  fontScale: 1,
  lineHeight: 1.35,
  sectionSpacing: 10,
  paperSize: 'A4',
  margin: 16,
  showPhoto: false,
  showIcons: true,
  uppercaseHeadings: true,
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  hiddenSections: ['publications', 'volunteer', 'references', 'awards'],
  sectionTitles: {},
  sectionPreset: null,
  userSectionOrder: null,
  userHiddenSections: null,
};

export function emptyResume(name = 'Untitled CV'): Resume {
  const now = new Date().toISOString();
  return {
    version: RESUME_SCHEMA_VERSION,
    meta: {
      id: uid('cv'),
      name,
      createdAt: now,
      updatedAt: now,
      targetJobDescription: '',
    },
    settings: { ...DEFAULT_SETTINGS, sectionOrder: [...DEFAULT_SECTION_ORDER] },
    basics: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      photo: '',
      summary: '',
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    languages: [],
    volunteer: [],
    interests: [],
    references: [],
    customSections: [],
  };
}
