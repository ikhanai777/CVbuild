import type { ResumeSettings, SectionId } from '../types/resume';

export type TemplateCategory =
  | 'ATS & classic'
  | 'Modern professional'
  | 'Two-column'
  | 'Creative'
  | 'Specialist';

export type LayoutKind =
  | 'single'
  | 'sidebar-left'
  | 'sidebar-right'
  | 'header-band'
  | 'timeline';

export type HeaderVariant =
  | 'stacked'
  | 'centered'
  | 'split'
  | 'band'
  | 'bold-left'
  | 'compact'
  | 'monogram';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  /** Who this template is the right choice for — shown in the picker. */
  bestFor: string[];
  /**
   * True when the layout is a single text column with no graphics, tables or
   * text boxes, which is what applicant tracking systems parse reliably.
   */
  atsSafe: boolean;
  layout: LayoutKind;
  header: HeaderVariant;
  /** Theme class applied to the page root; styled in styles/templates.css. */
  className: string;
  /** Which sections move into the sidebar for two-column layouts. */
  sidebarSections?: SectionId[];
  /** Sidebar width as a CSS length. */
  sidebarWidth?: string;
  defaults: Partial<ResumeSettings>;
}

const SIDEBAR_DEFAULT: SectionId[] = ['skills', 'languages', 'certifications', 'interests'];

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    category: 'ATS & classic',
    description:
      'Single column, system fonts, no graphics. The safest possible structure for applicant tracking systems and the default we recommend for online applications.',
    bestFor: ['Online applications', 'Large employers', 'Recruiter screens'],
    atsSafe: true,
    layout: 'single',
    header: 'stacked',
    className: 'tpl-ats-classic',
    defaults: {
      accentColor: '#000000',
      fontFamily: 'Arial',
      uppercaseHeadings: true,
      showPhoto: false,
      showIcons: false,
      margin: 18,
    },
  },
  {
    id: 'harvard-serif',
    name: 'Harvard Serif',
    category: 'ATS & classic',
    description:
      'The centred, serif, rule-under-heading format used by university careers offices. Conservative, dense and universally accepted.',
    bestFor: ['Consulting', 'Finance', 'Law', 'Graduate schemes'],
    atsSafe: true,
    layout: 'single',
    header: 'centered',
    className: 'tpl-harvard',
    defaults: {
      accentColor: '#111111',
      fontFamily: 'Georgia',
      uppercaseHeadings: true,
      showPhoto: false,
      showIcons: false,
      margin: 18,
    },
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    category: 'Modern professional',
    description:
      'A single column with a coloured name, thin accent rules and generous spacing. Still ATS-parseable, but noticeably more designed than the classic.',
    bestFor: ['Most industries', 'Mid-career moves', 'Direct applications'],
    atsSafe: true,
    layout: 'single',
    header: 'split',
    className: 'tpl-modern',
    defaults: { accentColor: '#1f4e79', fontFamily: 'Inter', margin: 16 },
  },
  {
    id: 'executive-brief',
    name: 'Executive Brief',
    category: 'Modern professional',
    description:
      'Leads with a wide summary block and small-caps headings. Built for senior candidates whose story is scope and P&L rather than task lists.',
    bestFor: ['Director and above', 'Board roles', 'Executive search'],
    atsSafe: true,
    layout: 'single',
    header: 'centered',
    className: 'tpl-executive',
    defaults: {
      accentColor: '#14303f',
      fontFamily: 'Georgia',
      sectionSpacing: 13,
      margin: 18,
    },
  },
  {
    id: 'minimal-swiss',
    name: 'Minimal Swiss',
    category: 'Modern professional',
    description:
      'Left-aligned grid, hairline rules and a lot of white space. Lets strong content breathe; punishes filler.',
    bestFor: ['Design-adjacent roles', 'Product', 'Short, senior CVs'],
    atsSafe: true,
    layout: 'single',
    header: 'bold-left',
    className: 'tpl-swiss',
    defaults: {
      accentColor: '#222222',
      fontFamily: 'Inter',
      uppercaseHeadings: false,
      sectionSpacing: 14,
      margin: 20,
    },
  },
  {
    id: 'compact-onepage',
    name: 'Compact One-Page',
    category: 'ATS & classic',
    description:
      'Tightened leading, smaller headings and inline dates to fit a long career onto one page without dropping to an unreadable font size.',
    bestFor: ['10+ year careers', 'One-page limits', 'Career fairs'],
    atsSafe: true,
    layout: 'single',
    header: 'compact',
    className: 'tpl-compact',
    defaults: {
      accentColor: '#1a1a1a',
      fontFamily: 'Arial',
      fontScale: 0.92,
      lineHeight: 1.25,
      sectionSpacing: 7,
      margin: 12,
    },
  },
  {
    id: 'two-column-classic',
    name: 'Two-Column Classic',
    category: 'Two-column',
    description:
      'Skills, tools and languages sit in a narrow left rail so the main column stays focused on experience. Best for CVs you send directly to a human.',
    bestFor: ['Technical roles', 'Skills-heavy CVs', 'Direct-to-hiring-manager'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'stacked',
    className: 'tpl-twocol',
    sidebarSections: SIDEBAR_DEFAULT,
    sidebarWidth: '33%',
    defaults: { accentColor: '#2b5c4f', fontFamily: 'Inter', margin: 14 },
  },
  {
    id: 'elegant-sidebar',
    name: 'Elegant Sidebar',
    category: 'Two-column',
    description:
      'A tinted right-hand rail with serif body text. Reads as considered rather than decorative.',
    bestFor: ['Marketing', 'Communications', 'Client-facing roles'],
    atsSafe: false,
    layout: 'sidebar-right',
    header: 'split',
    className: 'tpl-elegant',
    sidebarSections: ['skills', 'certifications', 'languages', 'interests'],
    sidebarWidth: '31%',
    defaults: { accentColor: '#6b3f5b', fontFamily: 'Georgia', margin: 14 },
  },
  {
    id: 'tech-matrix',
    name: 'Tech Matrix',
    category: 'Two-column',
    description:
      'Monospaced labels and a dense skills matrix in the rail, with projects promoted near the top. Written for engineers.',
    bestFor: ['Software engineering', 'Data', 'DevOps'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'compact',
    className: 'tpl-tech',
    sidebarSections: ['skills', 'certifications', 'languages'],
    sidebarWidth: '30%',
    defaults: {
      accentColor: '#0f766e',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      margin: 13,
    },
  },
  {
    id: 'creative-band',
    name: 'Creative Band',
    category: 'Creative',
    description:
      'A full-bleed colour band carries the name and contact details, with an optional photo. Use where design sense is part of the assessment.',
    bestFor: ['Design', 'Advertising', 'Europe (photo CVs)'],
    atsSafe: false,
    layout: 'header-band',
    header: 'band',
    className: 'tpl-band',
    sidebarSections: ['skills', 'languages', 'interests'],
    sidebarWidth: '32%',
    defaults: {
      accentColor: '#b3452f',
      fontFamily: 'Inter',
      showPhoto: true,
      margin: 0,
    },
  },
  {
    id: 'monogram-modern',
    name: 'Monogram Modern',
    category: 'Creative',
    description:
      'Initials set in an accent tile beside the name, with section headings on a tinted strip. Distinctive without being hard to read.',
    bestFor: ['Consulting', 'Startup roles', 'Personal branding'],
    atsSafe: false,
    layout: 'single',
    header: 'monogram',
    className: 'tpl-monogram',
    defaults: { accentColor: '#3b4cca', fontFamily: 'Inter', margin: 16 },
  },
  {
    id: 'timeline-career',
    name: 'Career Timeline',
    category: 'Creative',
    description:
      'Experience runs down a vertical timeline with dated markers, which makes a long, unbroken tenure obvious at a glance.',
    bestFor: ['Steady progression stories', 'Internal promotions'],
    atsSafe: false,
    layout: 'timeline',
    header: 'split',
    className: 'tpl-timeline',
    defaults: { accentColor: '#8a5a2b', fontFamily: 'Inter', margin: 16 },
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    category: 'Specialist',
    description:
      'Multi-page academic format: education first, then publications, grants and teaching. No summary, no skills bar, no length limit.',
    bestFor: ['Postdoc & faculty', 'Research', 'Grant applications'],
    atsSafe: true,
    layout: 'single',
    header: 'centered',
    className: 'tpl-academic',
    defaults: {
      accentColor: '#1a1a1a',
      fontFamily: 'Georgia',
      sectionOrder: [
        'education',
        'experience',
        'publications',
        'awards',
        'projects',
        'certifications',
        'skills',
        'languages',
        'volunteer',
        'references',
        'summary',
        'interests',
      ],
      hiddenSections: ['summary', 'interests'],
      margin: 20,
    },
  },
  {
    id: 'graduate-entry',
    name: 'Graduate Entry',
    category: 'Specialist',
    description:
      'Education and projects sit above work history, which is the right order when your coursework is stronger than your job list.',
    bestFor: ['Students', 'First job', 'Career changers'],
    atsSafe: true,
    layout: 'single',
    header: 'stacked',
    className: 'tpl-graduate',
    defaults: {
      accentColor: '#1d4ed8',
      fontFamily: 'Inter',
      sectionOrder: [
        'summary',
        'education',
        'projects',
        'experience',
        'skills',
        'certifications',
        'volunteer',
        'awards',
        'languages',
        'interests',
        'publications',
        'references',
      ],
      hiddenSections: ['publications', 'references'],
      margin: 16,
    },
  },
  {
    id: 'federal-detailed',
    name: 'Detailed / Federal',
    category: 'Specialist',
    description:
      'Long-form layout that keeps full employer detail, dates and scope lines. For public sector and other forms that ask for completeness over brevity.',
    bestFor: ['Government', 'Public sector', 'Regulated industries'],
    atsSafe: true,
    layout: 'single',
    header: 'stacked',
    className: 'tpl-federal',
    defaults: {
      accentColor: '#333333',
      fontFamily: 'Times New Roman',
      lineHeight: 1.4,
      sectionSpacing: 12,
      margin: 20,
    },
  },
  {
    id: 'engineering-standard',
    name: 'Engineering Standard',
    category: 'Modern professional',
    description:
      'Puts the tech stack directly under the summary and projects above education — the order an engineering CV is actually read in. Single column, so it still survives an application portal.',
    bestFor: ['Software engineering', 'Data & infrastructure', 'Online applications'],
    atsSafe: true,
    layout: 'single',
    header: 'split',
    className: 'tpl-engineering',
    defaults: {
      accentColor: '#334155',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      margin: 15,
      // The point of the template. A generic CV buries skills under education;
      // for engineering roles the stack is the first thing both the keyword
      // filter and the hiring engineer look for, and shipped projects carry
      // more weight than coursework.
      sectionOrder: [
        'summary',
        'skills',
        'experience',
        'projects',
        'education',
        'certifications',
        'awards',
        'publications',
        'languages',
        'volunteer',
        'interests',
        'references',
      ],
    },
  },
];

export const DEFAULT_TEMPLATE_ID = 'ats-classic';

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'ATS & classic',
  'Modern professional',
  'Two-column',
  'Creative',
  'Specialist',
];

export const FONT_STACKS: Record<string, string> = {
  Inter: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  Arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  Calibri: "Calibri, Candara, Segoe, 'Segoe UI', Optima, Arial, sans-serif",
  Georgia: "Georgia, 'Times New Roman', Times, serif",
  'Times New Roman': "'Times New Roman', Times, serif",
  Garamond: "Garamond, 'EB Garamond', Georgia, serif",
  'Source Sans': "'Source Sans 3', 'Source Sans Pro', Inter, Arial, sans-serif",
  Lato: "'Lato', 'Segoe UI', Arial, sans-serif",
};

export const FONT_OPTIONS = Object.keys(FONT_STACKS);

export const ACCENT_PRESETS = [
  '#000000',
  '#1f4e79',
  '#14303f',
  '#2b5c4f',
  '#0f766e',
  '#1d4ed8',
  '#3b4cca',
  '#6b3f5b',
  '#b3452f',
  '#8a5a2b',
  '#334155',
];
