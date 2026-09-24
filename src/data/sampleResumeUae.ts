import type { Resume } from '../types/resume';
import { emptyResume } from './defaults';

/**
 * A worked example written for the UAE market: the screening facts in the
 * header (nationality, visa, notice period, licence), a local +971 number, the
 * emirate named, results in AED, Arabic among the languages and the name in
 * Arabic script — alongside the same verb-led, quantified bullets the coach
 * asks for everywhere.
 */
export function sampleResumeUae(): Resume {
  const base = emptyResume('Sample — Dubai Marketing Manager');
  return {
    ...base,
    settings: {
      ...base.settings,
      templateId: 'dubai-executive',
      accentColor: '#0b2545',
      fontFamily: 'Montserrat',
      showIcons: true,
      showKeyFacts: true,
      lineHeight: 1.38,
    },
    basics: {
      fullName: 'Layla Haddad',
      headline: 'Senior Marketing Manager — Real Estate & Luxury',
      email: 'layla.haddad@example.com',
      phone: '+971 50 123 4567',
      location: 'Dubai, UAE',
      website: '',
      linkedin: 'linkedin.com/in/laylahaddad',
      github: '',
      photo: '',
      summary:
        'Senior marketing manager with 9 years across Dubai real estate and GCC luxury retail. Led the launch campaign that sold out a 420-unit off-plan tower in 11 days and generated AED 780M in bookings. Bilingual Arabic–English, with a track record of building performance-marketing teams that cut cost per lead while growing qualified pipeline.',
    },
    personal: {
      nationality: 'Jordanian',
      visaStatus: 'Golden Visa (10-year residence)',
      availability: '30 days notice',
      drivingLicence: 'UAE driving licence — light vehicle',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      nameArabic: 'ليلى حداد',
    },
    experience: [
      {
        id: 'exp1',
        company: 'Azure Bay Developments',
        position: 'Senior Marketing Manager',
        location: 'Dubai, UAE',
        startDate: 'Apr 2021',
        endDate: '',
        current: true,
        summary:
          'Lead a team of 8 across brand, performance and events for a developer with AED 4.2B in active projects.',
        highlights: [
          'Launched the Azure Crest off-plan campaign across UAE, KSA and India, selling out 420 units in 11 days and generating AED 780M in bookings.',
          'Rebuilt the performance-marketing stack (Meta, Google, Property Finder, Bayut), cutting cost per qualified lead by 38% while doubling monthly lead volume.',
          'Introduced a broker-partner portal that grew agency-sourced sales from 22% to 41% of revenue within one year.',
          'Delivered the brand presence at Cityscape Global 2023, securing 1,900 registered leads and AED 96M in on-site reservations.',
        ],
      },
      {
        id: 'exp2',
        company: 'Falcon Retail Group',
        position: 'Marketing Manager, Luxury Division',
        location: 'Abu Dhabi, UAE',
        startDate: 'Jan 2018',
        endDate: 'Mar 2021',
        current: false,
        summary: '',
        highlights: [
          'Managed marketing for 14 luxury boutiques across Abu Dhabi and Dubai with an annual budget of AED 18M.',
          'Launched the group’s first CRM and loyalty programme, reaching 65,000 members and lifting repeat purchase by 27%.',
          'Ran Ramadan and Dubai Shopping Festival campaigns that beat seasonal sales targets three years running, peaking at 134% of target.',
        ],
      },
      {
        id: 'exp3',
        company: 'Brightpath Media',
        position: 'Digital Marketing Executive',
        location: 'Amman, Jordan',
        startDate: 'Jul 2015',
        endDate: 'Dec 2017',
        current: false,
        summary: '',
        highlights: [
          'Planned and optimised paid social for 20+ regional FMCG and telecom clients, managing USD 1.4M in annual spend.',
          'Built an Arabic-first content calendar that tripled engagement on the agency’s flagship telecom account.',
        ],
      },
    ],
    education: [
      {
        id: 'edu1',
        institution: 'American University of Sharjah',
        degree: 'MBA',
        field: 'Marketing',
        location: 'Sharjah, UAE',
        startDate: '2019',
        endDate: '2021',
        grade: '',
        highlights: [],
      },
      {
        id: 'edu2',
        institution: 'University of Jordan',
        degree: 'BA',
        field: 'Business Administration (attested)',
        location: 'Amman, Jordan',
        startDate: '2011',
        endDate: '2015',
        grade: '',
        highlights: [],
      },
    ],
    skills: [
      {
        id: 'sk1',
        category: 'Marketing',
        items: [
          'Brand strategy',
          'Off-plan launches',
          'Performance marketing',
          'CRM & loyalty',
          'Events & roadshows',
          'Broker channel management',
        ],
      },
      {
        id: 'sk2',
        category: 'Platforms',
        items: ['Salesforce', 'HubSpot', 'Google Ads', 'Meta Ads', 'Property Finder', 'Bayut', 'GA4'],
      },
      {
        id: 'sk3',
        category: 'Markets',
        items: ['UAE', 'KSA', 'GCC', 'India & Pakistan investor markets'],
      },
    ],
    projects: [],
    certifications: [
      {
        id: 'ce1',
        name: 'Google Analytics Certification',
        issuer: 'Google',
        date: '2023',
        credentialId: '',
        link: '',
      },
      {
        id: 'ce2',
        name: 'Level 6 Diploma in Professional Marketing',
        issuer: 'Chartered Institute of Marketing (CIM)',
        date: '2019',
        credentialId: '',
        link: '',
      },
    ],
    awards: [],
    publications: [],
    languages: [
      { id: 'ln1', name: 'Arabic', level: 'Native' },
      { id: 'ln2', name: 'English', level: 'Fluent' },
      { id: 'ln3', name: 'French', level: 'Conversational' },
    ],
    volunteer: [],
    interests: [],
    references: [],
    customSections: [],
  };
}
