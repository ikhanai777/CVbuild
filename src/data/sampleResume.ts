import type { Resume } from '../types/resume';
import { emptyResume } from './defaults';

/**
 * A worked example that demonstrates the writing strategies the app coaches:
 * a headline that names the target role, a three-sentence summary, and bullets
 * built as "strong verb + what you did + measurable result".
 */
export function sampleResume(): Resume {
  const base = emptyResume('Sample — Senior Product Manager');
  return {
    ...base,
    settings: { ...base.settings, templateId: 'modern-professional' },
    basics: {
      fullName: 'Amara Osei',
      headline: 'Senior Product Manager — Payments & Growth',
      email: 'amara.osei@example.com',
      phone: '+44 7700 900 142',
      location: 'London, UK',
      website: 'amaraosei.dev',
      linkedin: 'linkedin.com/in/amaraosei',
      github: '',
      photo: '',
      summary:
        'Senior product manager with 8 years building payments and growth products for fintech and marketplace businesses. Led the platform migration that cut checkout failures by 34% and unlocked £12M in annual recurring revenue. Known for turning ambiguous discovery work into shipped roadmaps that engineering and finance both sign off on.',
    },
    experience: [
      {
        id: 'exp1',
        company: 'Northwind Payments',
        position: 'Senior Product Manager, Checkout',
        location: 'London, UK',
        startDate: 'Mar 2021',
        endDate: '',
        current: true,
        summary:
          'Own the checkout and payment-methods roadmap for 2.4M monthly transactions across 14 markets.',
        highlights: [
          'Led migration to a modular checkout platform, reducing payment failure rate from 5.1% to 3.4% and recovering £12M in annualised revenue.',
          'Launched local payment methods in 6 European markets in 9 months, growing non-card volume from 8% to 27% of transactions.',
          'Rebuilt the experimentation pipeline with data engineering, cutting time-to-result for pricing tests from 3 weeks to 4 days.',
          'Coached 3 associate PMs; two were promoted to mid-level within 18 months.',
        ],
      },
      {
        id: 'exp2',
        company: 'Orbit Marketplace',
        position: 'Product Manager, Growth',
        location: 'Manchester, UK',
        startDate: 'Jun 2018',
        endDate: 'Feb 2021',
        current: false,
        summary: '',
        highlights: [
          'Redesigned seller onboarding, lifting activation from 41% to 63% and adding 4,800 active sellers in the first year.',
          'Shipped a referral programme that drove 18% of new buyer signups at a 60% lower CAC than paid acquisition.',
          'Consolidated 4 analytics tools into one warehouse-backed stack, saving £96K per year in licensing.',
        ],
      },
      {
        id: 'exp3',
        company: 'Brightloop',
        position: 'Associate Product Manager',
        location: 'Manchester, UK',
        startDate: 'Sep 2016',
        endDate: 'May 2018',
        current: false,
        summary: '',
        highlights: [
          'Delivered the first mobile release of the scheduling product, reaching 30K installs in 6 months.',
          'Ran 40+ customer interviews that reframed the roadmap around retention rather than acquisition.',
        ],
      },
    ],
    education: [
      {
        id: 'edu1',
        institution: 'University of Manchester',
        degree: 'BSc (Hons)',
        field: 'Economics and Computer Science',
        location: 'Manchester, UK',
        startDate: '2013',
        endDate: '2016',
        grade: 'First Class Honours',
        highlights: [],
      },
    ],
    skills: [
      {
        id: 'sk1',
        category: 'Product',
        items: [
          'Roadmapping',
          'Discovery & user research',
          'A/B experimentation',
          'Pricing strategy',
          'Go-to-market',
        ],
      },
      {
        id: 'sk2',
        category: 'Technical',
        items: ['SQL', 'Amplitude', 'Looker', 'Figma', 'REST & webhook APIs', 'Jira'],
      },
      {
        id: 'sk3',
        category: 'Domain',
        items: ['Card & APM payments', 'PSD2 / SCA', 'Chargebacks', 'Marketplace economics'],
      },
    ],
    projects: [
      {
        id: 'pr1',
        name: 'Checkout Benchmark Report',
        role: 'Author',
        link: 'amaraosei.dev/checkout-benchmark',
        startDate: '2023',
        endDate: '',
        description:
          'Annual teardown of checkout flows across 40 European merchants, cited by two industry newsletters.',
        highlights: [],
      },
    ],
    certifications: [
      {
        id: 'ce1',
        name: 'Certified Scrum Product Owner (CSPO)',
        issuer: 'Scrum Alliance',
        date: '2019',
        credentialId: '',
        link: '',
      },
    ],
    awards: [],
    publications: [],
    languages: [
      { id: 'ln1', name: 'English', level: 'Native' },
      { id: 'ln2', name: 'French', level: 'Professional working' },
      { id: 'ln3', name: 'Twi', level: 'Conversational' },
    ],
    volunteer: [],
    interests: ['Long-distance running', 'Open-data projects', 'Jazz piano'],
    references: [],
    customSections: [],
  };
}
