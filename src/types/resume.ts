/**
 * The resume document model.
 *
 * Everything the app does — editing, importing, scoring, rendering a template,
 * exporting to PDF/Word — reads and writes this one shape. Keeping a single
 * normalised model is what lets a CV switch between 15 templates without the
 * user re-entering anything.
 */

export interface Basics {
  fullName: string;
  /** Target job title, e.g. "Senior Product Manager". Recruiters scan for this first. */
  headline: string;
  email: string;
  phone: string;
  /** "City, Country" — a full street address is a privacy risk and wastes a line. */
  location: string;
  website: string;
  linkedin: string;
  github: string;
  /** Data URL. Only rendered by templates that opt in, and never by ATS-safe ones. */
  photo: string;
  /** The professional summary / profile paragraph. */
  summary: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  /** Free-form but normalised to "MMM YYYY" where possible, e.g. "Mar 2021". */
  startDate: string;
  endDate: string;
  current: boolean;
  /** Optional one-line scope/context sentence rendered above the bullets. */
  summary: string;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  /** Include only when strong and recent (roughly: 3.5+ and within ~3 years). */
  grade: string;
  highlights: string[];
}

export interface SkillGroup {
  id: string;
  /** e.g. "Languages", "Cloud & Infrastructure". Empty renders as an ungrouped list. */
  category: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  link: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
  link: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  publisher: string;
  date: string;
  authors: string;
  link: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface VolunteerItem {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
}

export interface ReferenceItem {
  id: string;
  name: string;
  title: string;
  company: string;
  contact: string;
}

export interface CustomEntry {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  highlights: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomEntry[];
}

/** Stable keys for the built-in sections. Custom sections use `custom:<id>`. */
export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'references';

export type SectionId = SectionKey | `custom:${string}`;

export type PaperSize = 'A4' | 'Letter';

export interface ResumeSettings {
  templateId: string;
  accentColor: string;
  fontFamily: string;
  /** Multiplier on the template's base font size, 0.85–1.15. */
  fontScale: number;
  lineHeight: number;
  /** Extra vertical space between sections, in pt. */
  sectionSpacing: number;
  paperSize: PaperSize;
  /** Page margin in mm. Under 10mm risks being clipped by physical printers. */
  margin: number;
  showPhoto: boolean;
  /** Render icons next to contact details (templates that support it). */
  showIcons: boolean;
  /** Uppercase section headings. */
  uppercaseHeadings: boolean;
  /** Order sections appear in. Unknown/new sections are appended. */
  sectionOrder: SectionId[];
  /** Sections the user has switched off without deleting their content. */
  hiddenSections: SectionId[];
  /** Per-section heading overrides, e.g. experience -> "Professional Experience". */
  sectionTitles: Partial<Record<SectionId, string>>;
  /**
   * The template whose section preset is currently in force, if any. A few
   * templates (Academic, Graduate) impose their own order and hide sections;
   * this records that the layout is on loan from a template rather than chosen
   * by the user, so switching away can hand the user's own layout back.
   */
  sectionPreset: string | null;
  /** The user's own layout, held while a template preset overrides it. */
  userSectionOrder: SectionId[] | null;
  userHiddenSections: SectionId[] | null;
}

export interface ResumeMeta {
  id: string;
  /** The user-facing name of this document, e.g. "PM — Stripe application". */
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Pasted job description, used by the keyword matcher. Never rendered. */
  targetJobDescription: string;
}

export interface Resume {
  /** Schema version, so old saved documents can be migrated. */
  version: number;
  meta: ResumeMeta;
  settings: ResumeSettings;
  basics: Basics;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  publications: PublicationItem[];
  languages: LanguageItem[];
  volunteer: VolunteerItem[];
  interests: string[];
  references: ReferenceItem[];
  customSections: CustomSection[];
}

export const RESUME_SCHEMA_VERSION = 1;

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'awards',
  'publications',
  'languages',
  'volunteer',
  'interests',
  'references',
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards & Honours',
  publications: 'Publications',
  languages: 'Languages',
  volunteer: 'Volunteering',
  interests: 'Interests',
  references: 'References',
};
