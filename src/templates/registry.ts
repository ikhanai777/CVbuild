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
  {
    id: 'studio-split',
    name: 'Studio Split',
    category: 'Creative',
    description:
      'A heavy, confident name block sits beside ruled contact details and a round portrait, with education and skills in a right-hand rail. Graphic-designer poster energy, held together by strict alignment.',
    bestFor: ['Graphic design', 'Art direction', 'Creative portfolios'],
    atsSafe: false,
    layout: 'sidebar-right',
    header: 'split',
    className: 'tpl-studio',
    sidebarSections: ['education', 'skills', 'certifications', 'languages', 'references'],
    sidebarWidth: '34%',
    defaults: {
      accentColor: '#2b2b2b',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      margin: 14,
    },
  },
  {
    id: 'portfolio-rail',
    name: 'Portfolio Rail',
    category: 'Two-column',
    description:
      'Portrait left, name ranged right over a divided contact strip, then a left rail against a dotted timeline of roles. The most structured of the photo layouts.',
    bestFor: ['Design & marketing', 'Photo CVs (EU)', 'Client-facing roles'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'stacked',
    className: 'tpl-rail',
    sidebarSections: ['education', 'skills', 'languages', 'references'],
    sidebarWidth: '32%',
    defaults: {
      accentColor: '#3d4a52',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: false,
      showPhoto: true,
      margin: 14,
    },
  },
  {
    id: 'editorial-air',
    name: 'Editorial',
    category: 'Creative',
    description:
      'Wide-tracked capitals, hairline rules and a great deal of air. Almost nothing is drawn — the spacing does the work, so every line has to earn its place.',
    bestFor: ['Senior creative roles', 'Consulting', 'Short, confident CVs'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'split',
    className: 'tpl-editorial',
    sidebarSections: ['education', 'skills', 'certifications', 'languages'],
    sidebarWidth: '30%',
    defaults: {
      accentColor: '#8c8378',
      fontFamily: 'Lato',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      lineHeight: 1.5,
      sectionSpacing: 14,
      margin: 17,
    },
  },
  {
    id: 'couture-serif',
    name: 'Couture',
    category: 'Creative',
    description:
      'The name set in very wide capitals, a full-height rule dividing the columns, and job titles tracked out over italic employers. Fashion-editorial restraint.',
    bestFor: ['Fashion & beauty', 'Luxury retail', 'Events & PR'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'stacked',
    className: 'tpl-couture',
    sidebarSections: ['skills', 'education', 'certifications', 'languages', 'interests'],
    sidebarWidth: '31%',
    defaults: {
      accentColor: '#1a1a1a',
      fontFamily: 'Lato',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      sectionSpacing: 12,
      margin: 16,
    },
  },
  {
    id: 'ivory-serif',
    name: 'Ivory',
    category: 'Modern professional',
    description:
      'Warm off-white paper with a serif display name over a clean sans body. The only template here that pairs two typefaces, and it stays single column, so it still survives a portal.',
    bestFor: ['Writing & editorial', 'Hospitality', 'Online applications'],
    atsSafe: true,
    layout: 'single',
    header: 'split',
    className: 'tpl-ivory',
    defaults: {
      accentColor: '#7d6a55',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: false,
      sectionSpacing: 12,
      margin: 17,
    },
  },
  {
    id: 'onyx-rail',
    name: 'Onyx',
    category: 'Two-column',
    description:
      'A solid dark rail running edge to edge down the full height of the page, with the main column left bright and open. The strongest contrast in the set.',
    bestFor: ['Design & product', 'Senior hires', 'Direct applications'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'split',
    className: 'tpl-onyx',
    sidebarSections: ['skills', 'education', 'certifications', 'languages', 'interests'],
    sidebarWidth: '33%',
    defaults: {
      accentColor: '#1c1f26',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      margin: 15,
    },
  },
  {
    id: 'aurora-gradient',
    name: 'Aurora',
    category: 'Creative',
    description:
      'A full-bleed gradient banner carries the name, with rounded skill pills below. Warm and contemporary — the one here that looks most like a product landing page.',
    bestFor: ['Startups', 'Marketing & growth', 'Product design'],
    atsSafe: false,
    layout: 'single',
    header: 'band',
    className: 'tpl-aurora',
    defaults: {
      accentColor: '#6d28d9',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      margin: 15,
    },
  },
  {
    id: 'bauhaus-block',
    name: 'Bauhaus',
    category: 'Creative',
    description:
      'Heavy geometry: a circle and a square set against the name, thick accent bars marking each heading, square bullets. Loud on purpose, and strictly aligned so it stays readable.',
    bestFor: ['Art direction', 'Industrial design', 'Architecture'],
    atsSafe: false,
    layout: 'single',
    header: 'bold-left',
    className: 'tpl-bauhaus',
    defaults: {
      accentColor: '#c2410c',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: false,
      sectionSpacing: 13,
      margin: 16,
    },
  },
  {
    id: 'broadsheet-press',
    name: 'Broadsheet',
    category: 'ATS & classic',
    description:
      'Set like a newspaper: a masthead rule under the name, justified serif columns and a drop cap opening the summary. The drop cap is styling only, so this stays portal-safe.',
    bestFor: ['Journalism & publishing', 'Law', 'Academia-adjacent roles'],
    atsSafe: true,
    layout: 'single',
    header: 'centered',
    className: 'tpl-broadsheet',
    defaults: {
      accentColor: '#1f2933',
      fontFamily: 'Georgia',
      uppercaseHeadings: true,
      showIcons: false,
      margin: 18,
    },
  },
  {
    id: 'kyoto-zen',
    name: 'Kyoto',
    category: 'Modern professional',
    description:
      'One hairline runs the height of the page and everything hangs off it. Almost no ink, very large margins — a design that only works if the writing is already tight.',
    bestFor: ['Senior and concise CVs', 'Architecture', 'Research'],
    atsSafe: true,
    layout: 'single',
    header: 'stacked',
    className: 'tpl-kyoto',
    defaults: {
      accentColor: '#4a5d52',
      fontFamily: 'Lato',
      uppercaseHeadings: true,
      showIcons: false,
      lineHeight: 1.55,
      sectionSpacing: 15,
      margin: 22,
    },
  },
  {
    id: 'atelier-frame',
    name: 'Atelier',
    category: 'Creative',
    description:
      'A double-ruled title block frames the name like a piece of headed stationery, over a Garamond body. Formal without being stuffy.',
    bestFor: ['Luxury & hospitality', 'Curation & galleries', 'Private clients'],
    atsSafe: false,
    layout: 'single',
    header: 'centered',
    className: 'tpl-atelier',
    defaults: {
      accentColor: '#6b5b4a',
      fontFamily: 'Garamond',
      uppercaseHeadings: true,
      showIcons: false,
      sectionSpacing: 13,
      margin: 18,
    },
  },
  {
    id: 'marina-cards',
    name: 'Marina',
    category: 'Modern professional',
    description:
      'Each section sits in a soft rounded panel, which makes a dense CV far easier to scan in one pass. Single column, and the tint is background only, so it still parses.',
    bestFor: ['Healthcare', 'Education', 'Operations'],
    atsSafe: true,
    layout: 'single',
    header: 'split',
    className: 'tpl-marina',
    defaults: {
      accentColor: '#0e7490',
      fontFamily: 'Source Sans',
      uppercaseHeadings: true,
      showIcons: true,
      sectionSpacing: 9,
      margin: 14,
    },
  },
  {
    id: 'midnight-dark',
    name: 'Midnight',
    category: 'Creative',
    description:
      'The whole page inverted — pale type on near-black with a bright accent. Striking on screen and as a PDF; print it only if you are happy to spend the toner.',
    bestFor: ['Portfolios & PDFs', 'Games & music', 'Creative tech'],
    atsSafe: false,
    layout: 'single',
    header: 'split',
    className: 'tpl-midnight',
    defaults: {
      accentColor: '#7dd3fc',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      margin: 16,
    },
  },
  {
    id: 'meridian-split',
    name: 'Meridian',
    category: 'Two-column',
    description:
      'Two tones meeting at one line: a warm tinted rail down the full page and a dark band carrying the name across the main column, with the portrait straddling the join.',
    bestFor: ['Sales & account management', 'Client-facing roles', 'Photo CVs (EU)'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'stacked',
    className: 'tpl-meridian',
    sidebarSections: ['education', 'skills', 'languages', 'certifications', 'references'],
    sidebarWidth: '34%',
    defaults: {
      accentColor: '#2f2a28',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      margin: 14,
    },
  },
  {
    id: 'ledger-frame',
    name: 'Ledger',
    category: 'ATS & classic',
    description:
      'A ruled frame on every page, and dates set in their own left-hand column so the eye can run down the timeline without reading a word. Single column underneath, so it still parses.',
    bestFor: ['Management', 'Finance & audit', 'Formal applications'],
    atsSafe: true,
    layout: 'single',
    header: 'centered',
    className: 'tpl-ledgerframe',
    defaults: {
      accentColor: '#243447',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: false,
      margin: 19,
    },
  },
  {
    id: 'cascade-card',
    name: 'Cascade',
    category: 'Two-column',
    description:
      'The rail floats as a soft rounded card with the page showing all around it, instead of running to the trim. Friendly and modern without being loud.',
    bestFor: ['Graduates', 'Support & admin', 'Care and community roles'],
    atsSafe: false,
    layout: 'sidebar-left',
    header: 'split',
    className: 'tpl-cascade',
    sidebarSections: ['skills', 'education', 'languages', 'interests', 'certifications'],
    sidebarWidth: '32%',
    defaults: {
      accentColor: '#4f8299',
      fontFamily: 'Lato',
      uppercaseHeadings: false,
      showIcons: true,
      showPhoto: true,
      margin: 13,
    },
  },
  {
    id: 'beacon-center',
    name: 'Beacon',
    category: 'Modern professional',
    description:
      'A banded header in three parts — name, portrait, contacts — with the photo holding the centre. Balanced and immediately legible.',
    bestFor: ['Operations', 'Administration', 'Recruitment'],
    atsSafe: false,
    layout: 'single',
    header: 'split',
    className: 'tpl-beacon',
    defaults: {
      accentColor: '#475569',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      sectionSpacing: 9,
      margin: 15,
    },
  },
  {
    id: 'granite-right',
    name: 'Granite',
    category: 'Two-column',
    description:
      'Experience takes the wide left column while the summary and skills sit right, under a squared portrait and a boxed grid of contact details. A tinted band closes every page.',
    bestFor: ['Accounting', 'Consulting', 'Corporate roles'],
    atsSafe: false,
    layout: 'sidebar-right',
    header: 'split',
    className: 'tpl-granite',
    sidebarSections: ['summary', 'education', 'skills', 'languages', 'certifications'],
    sidebarWidth: '31%',
    defaults: {
      accentColor: '#a1866f',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      margin: 14,
    },
  },
  {
    id: 'signal-accent',
    name: 'Signal',
    category: 'Modern professional',
    description:
      'Employers picked out in colour and skills underscored like tags, under quiet grey headings. The accent does the navigating, so the layout can stay plain — and single column.',
    bestFor: ['Executive assistants', 'Project delivery', 'Online applications'],
    atsSafe: true,
    layout: 'single',
    header: 'stacked',
    className: 'tpl-signal',
    defaults: {
      accentColor: '#b45309',
      fontFamily: 'Source Sans',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: false,
      margin: 15,
    },
  },
  {
    id: 'marquee-block',
    name: 'Marquee',
    category: 'Creative',
    description:
      'Every heading reversed out of a solid block of colour, so the sections read as a stack of labels. The boldest way to organise a long CV.',
    bestFor: ['Events & production', 'Retail management', 'Hospitality'],
    atsSafe: false,
    layout: 'single',
    header: 'bold-left',
    className: 'tpl-marquee',
    defaults: {
      accentColor: '#166534',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: false,
      margin: 16,
    },
  },
  {
    id: 'prism-angle',
    name: 'Prism',
    category: 'Creative',
    description:
      'The colour band closes on a slant rather than a straight edge, which gives the whole page a direction. One geometric move, nothing else competing with it.',
    bestFor: ['Media & film', 'Advertising', 'Brand roles'],
    atsSafe: false,
    layout: 'single',
    header: 'band',
    className: 'tpl-prism',
    defaults: {
      accentColor: '#be123c',
      fontFamily: 'Inter',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: true,
      margin: 16,
    },
  },
  {
    id: 'ribbon-edge',
    name: 'Ribbon',
    category: 'Modern professional',
    description:
      'A solid band of colour down the trimmed edge of every page and nothing else decorative. Gives a plain single column an identity without spending a line on it.',
    bestFor: ['Any industry', 'Online applications', 'Long CVs'],
    atsSafe: true,
    layout: 'single',
    header: 'split',
    className: 'tpl-ribbon',
    defaults: {
      accentColor: '#1e3a5f',
      fontFamily: 'Lato',
      uppercaseHeadings: true,
      showIcons: true,
      showPhoto: false,
      margin: 16,
    },
  },
  {
    id: 'bronze-editorial',
    name: 'Bronze',
    category: 'ATS & classic',
    description:
      'Section headings set large in italic serif against small, quiet body text — a magazine contrast rather than a rule. Warm paper, single column.',
    bestFor: ['Writing & editing', 'Curation', 'Teaching'],
    atsSafe: true,
    layout: 'single',
    header: 'stacked',
    className: 'tpl-bronze',
    defaults: {
      accentColor: '#8c6d3f',
      fontFamily: 'Georgia',
      uppercaseHeadings: false,
      showIcons: false,
      showPhoto: false,
      sectionSpacing: 13,
      margin: 18,
    },
  },
  {
    id: 'muse-centered',
    name: 'Muse',
    category: 'Modern professional',
    description:
      'Centred and very light, with each heading set between two hairlines. Quiet and formal without going traditional — and single column, so it is portal-safe.',
    bestFor: ['Arts & culture', 'Non-profit', 'Online applications'],
    atsSafe: true,
    layout: 'single',
    header: 'centered',
    className: 'tpl-muse',
    defaults: {
      accentColor: '#5b6670',
      fontFamily: 'Lato',
      uppercaseHeadings: true,
      showIcons: false,
      showPhoto: false,
      lineHeight: 1.45,
      sectionSpacing: 13,
      margin: 19,
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
  '#8c8378',
  '#7d6a55',
  '#1c1f26',
  '#6d28d9',
  '#c2410c',
  '#0e7490',
];
