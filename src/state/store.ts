/**
 * Application state.
 *
 * Everything lives in the browser: a CV is personal data and there is no server
 * in this app to send it to. Documents are persisted to localStorage on every
 * change, with a bounded undo history so an accidental delete is recoverable.
 */
import { create } from 'zustand';
import type { Resume, ResumeSettings, SectionId } from '../types/resume';
import { emptyResume } from '../data/defaults';
import { sampleResume } from '../data/sampleResume';
import { adoptSectionLayout, applyTemplate } from '../templates/applyTemplate';
import { migrateResume } from '../lib/export/json';
import { uid } from '../lib/id';

const STORAGE_KEY = 'cvbuild.documents.v1';
const HISTORY_LIMIT = 60;

/** Keys whose value is an array of objects with an `id`. */
type ListKey =
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'languages'
  | 'volunteer'
  | 'references';

interface PersistedState {
  resumes: Resume[];
  activeId: string;
}

interface AppState {
  resumes: Resume[];
  activeId: string;
  past: PersistedState[];
  future: PersistedState[];
  /** Set when a template preview is being hovered in the picker. */
  previewTemplateId: string | null;

  resume: () => Resume;
  commit: (mutate: (draft: Resume) => void, options?: { history?: boolean }) => void;

  setBasics: (patch: Partial<Resume['basics']>) => void;
  setMeta: (patch: Partial<Resume['meta']>) => void;
  setSettings: (patch: Partial<ResumeSettings>) => void;
  setTemplate: (templateId: string) => void;
  setPreviewTemplate: (templateId: string | null) => void;

  addItem: (key: ListKey) => void;
  updateItem: (key: ListKey, id: string, patch: Record<string, unknown>) => void;
  removeItem: (key: ListKey, id: string) => void;
  moveItem: (key: ListKey, id: string, delta: number) => void;
  duplicateItem: (key: ListKey, id: string) => void;

  setInterests: (values: string[]) => void;
  addCustomSection: (title: string) => void;
  updateCustomSection: (id: string, patch: Partial<Resume['customSections'][number]>) => void;
  removeCustomSection: (id: string) => void;
  addCustomEntry: (sectionId: string) => void;
  updateCustomEntry: (sectionId: string, entryId: string, patch: Record<string, unknown>) => void;
  removeCustomEntry: (sectionId: string, entryId: string) => void;

  moveSection: (id: SectionId, delta: number) => void;
  toggleSection: (id: SectionId) => void;
  renameSection: (id: SectionId, title: string) => void;

  newResume: (from?: Resume) => void;
  importResume: (resume: Resume) => void;
  replaceActive: (resume: Resume) => void;
  duplicateResume: (id: string) => void;
  deleteResume: (id: string) => void;
  selectResume: (id: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const EMPTY_ITEMS: Record<ListKey, () => Record<string, unknown>> = {
  experience: () => ({
    id: uid('exp'),
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    summary: '',
    highlights: [''],
  }),
  education: () => ({
    id: uid('edu'),
    institution: '',
    degree: '',
    field: '',
    location: '',
    startDate: '',
    endDate: '',
    grade: '',
    highlights: [],
  }),
  skills: () => ({ id: uid('sk'), category: '', items: [] }),
  projects: () => ({
    id: uid('pr'),
    name: '',
    role: '',
    link: '',
    startDate: '',
    endDate: '',
    description: '',
    highlights: [],
  }),
  certifications: () => ({ id: uid('ce'), name: '', issuer: '', date: '', credentialId: '', link: '' }),
  awards: () => ({ id: uid('aw'), title: '', issuer: '', date: '', description: '' }),
  publications: () => ({ id: uid('pb'), title: '', publisher: '', date: '', authors: '', link: '' }),
  languages: () => ({ id: uid('ln'), name: '', level: '' }),
  volunteer: () => ({
    id: uid('vo'),
    organization: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
    highlights: [],
  }),
  references: () => ({ id: uid('rf'), name: '', title: '', company: '', contact: '' }),
};

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.resumes) && parsed.resumes.length) {
        const resumes = parsed.resumes.map((r) => migrateResume(r));
        const activeId = resumes.some((r) => r.meta.id === parsed.activeId)
          ? parsed.activeId
          : resumes[0].meta.id;
        return { resumes, activeId };
      }
    }
  } catch {
    // A corrupt payload should never block the app from opening.
  }
  const first = sampleResume();
  return { resumes: [first], activeId: first.meta.id };
}

function persist(state: PersistedState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ resumes: state.resumes, activeId: state.activeId }),
    );
  } catch {
    // Quota exceeded (usually a large embedded photo) — keep working in memory.
  }
}

function snapshot(state: AppState): PersistedState {
  return { resumes: state.resumes.map((r) => structuredClone(r)), activeId: state.activeId };
}

const initial = load();

export const useStore = create<AppState>((set, get) => ({
  resumes: initial.resumes,
  activeId: initial.activeId,
  past: [],
  future: [],
  previewTemplateId: null,

  resume: () => {
    const state = get();
    return state.resumes.find((r) => r.meta.id === state.activeId) ?? state.resumes[0];
  },

  commit: (mutate, options = {}) => {
    const withHistory = options.history !== false;
    set((state) => {
      const past = withHistory
        ? [...state.past, snapshot(state)].slice(-HISTORY_LIMIT)
        : state.past;
      const resumes = state.resumes.map((r) => {
        if (r.meta.id !== state.activeId) return r;
        const draft = structuredClone(r);
        mutate(draft);
        draft.meta.updatedAt = new Date().toISOString();
        return draft;
      });
      const next = { ...state, resumes, past, future: withHistory ? [] : state.future };
      persist(next);
      return next;
    });
  },

  setBasics: (patch) => get().commit((d) => Object.assign(d.basics, patch)),
  setMeta: (patch) => get().commit((d) => Object.assign(d.meta, patch)),
  setSettings: (patch) => get().commit((d) => Object.assign(d.settings, patch)),

  setTemplate: (templateId) =>
    get().commit((d) => {
      d.settings = applyTemplate(d.settings, templateId);
    }),

  setPreviewTemplate: (templateId) => set({ previewTemplateId: templateId }),

  addItem: (key) =>
    get().commit((d) => {
      (d[key] as unknown[]).push(EMPTY_ITEMS[key]());
      // Adding content to a section the user had switched off should show it.
      d.settings.hiddenSections = d.settings.hiddenSections.filter((s) => s !== key);
    }),

  updateItem: (key, id, patch) =>
    get().commit((d) => {
      const list = d[key] as unknown as Array<Record<string, unknown>>;
      const item = list.find((i) => i.id === id);
      if (item) Object.assign(item, patch);
    }),

  removeItem: (key, id) =>
    get().commit((d) => {
      const list = d[key] as Array<{ id: string }>;
      const index = list.findIndex((i) => i.id === id);
      if (index >= 0) list.splice(index, 1);
    }),

  moveItem: (key, id, delta) =>
    get().commit((d) => {
      const list = d[key] as Array<{ id: string }>;
      const index = list.findIndex((i) => i.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= list.length) return;
      const [item] = list.splice(index, 1);
      list.splice(target, 0, item);
    }),

  duplicateItem: (key, id) =>
    get().commit((d) => {
      const list = d[key] as Array<{ id: string }>;
      const index = list.findIndex((i) => i.id === id);
      if (index < 0) return;
      const copy = structuredClone(list[index]);
      copy.id = uid(key.slice(0, 2));
      list.splice(index + 1, 0, copy);
    }),

  setInterests: (values) => get().commit((d) => void (d.interests = values)),

  addCustomSection: (title) =>
    get().commit((d) => {
      const id = uid('cs');
      d.customSections.push({ id, title: title || 'New section', entries: [] });
      d.settings.sectionOrder.push(`custom:${id}`);
      // Keep the held-aside layout in step so the section survives a template switch.
      d.settings.userSectionOrder?.push(`custom:${id}`);
    }),

  updateCustomSection: (id, patch) =>
    get().commit((d) => {
      const section = d.customSections.find((s) => s.id === id);
      if (section) Object.assign(section, patch);
    }),

  removeCustomSection: (id) =>
    get().commit((d) => {
      d.customSections = d.customSections.filter((s) => s.id !== id);
      d.settings.sectionOrder = d.settings.sectionOrder.filter((s) => s !== `custom:${id}`);
      d.settings.userSectionOrder =
        d.settings.userSectionOrder?.filter((s) => s !== `custom:${id}`) ?? null;
    }),

  addCustomEntry: (sectionId) =>
    get().commit((d) => {
      const section = d.customSections.find((s) => s.id === sectionId);
      section?.entries.push({
        id: uid('cu'),
        title: '',
        subtitle: '',
        date: '',
        description: '',
        highlights: [],
      });
    }),

  updateCustomEntry: (sectionId, entryId, patch) =>
    get().commit((d) => {
      const entry = d.customSections.find((s) => s.id === sectionId)?.entries.find((e) => e.id === entryId);
      if (entry) Object.assign(entry, patch);
    }),

  removeCustomEntry: (sectionId, entryId) =>
    get().commit((d) => {
      const section = d.customSections.find((s) => s.id === sectionId);
      if (section) section.entries = section.entries.filter((e) => e.id !== entryId);
    }),

  moveSection: (id, delta) =>
    get().commit((d) => {
      const order = d.settings.sectionOrder;
      const index = order.indexOf(id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= order.length) return;
      const [item] = order.splice(index, 1);
      order.splice(target, 0, item);
      adoptSectionLayout(d.settings);
    }),

  toggleSection: (id) =>
    get().commit((d) => {
      d.settings.hiddenSections = d.settings.hiddenSections.includes(id)
        ? d.settings.hiddenSections.filter((s) => s !== id)
        : [...d.settings.hiddenSections, id];
      adoptSectionLayout(d.settings);
    }),

  renameSection: (id, title) =>
    get().commit((d) => {
      if (title.trim()) d.settings.sectionTitles[id] = title.trim();
      else delete d.settings.sectionTitles[id];
    }),

  newResume: (from) =>
    set((state) => {
      const resume = from ? structuredClone(from) : emptyResume(`CV ${state.resumes.length + 1}`);
      resume.meta.id = uid('cv');
      const next = {
        ...state,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: [],
        resumes: [...state.resumes, resume],
        activeId: resume.meta.id,
      };
      persist(next);
      return next;
    }),

  importResume: (resume) =>
    set((state) => {
      const copy = structuredClone(resume);
      copy.meta.id = uid('cv');
      const next = {
        ...state,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: [],
        resumes: [...state.resumes, copy],
        activeId: copy.meta.id,
      };
      persist(next);
      return next;
    }),

  replaceActive: (resume) =>
    set((state) => {
      const copy = structuredClone(resume);
      copy.meta.id = state.activeId;
      const next = {
        ...state,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: [],
        resumes: state.resumes.map((r) => (r.meta.id === state.activeId ? copy : r)),
      };
      persist(next);
      return next;
    }),

  duplicateResume: (id) =>
    set((state) => {
      const source = state.resumes.find((r) => r.meta.id === id);
      if (!source) return state;
      const copy = structuredClone(source);
      copy.meta.id = uid('cv');
      copy.meta.name = `${source.meta.name} (copy)`;
      const next = {
        ...state,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: [],
        resumes: [...state.resumes, copy],
        activeId: copy.meta.id,
      };
      persist(next);
      return next;
    }),

  deleteResume: (id) =>
    set((state) => {
      if (state.resumes.length <= 1) return state;
      const resumes = state.resumes.filter((r) => r.meta.id !== id);
      const next = {
        ...state,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: [],
        resumes,
        activeId: state.activeId === id ? resumes[0].meta.id : state.activeId,
      };
      persist(next);
      return next;
    }),

  selectResume: (id) =>
    set((state) => {
      const next = { ...state, activeId: id };
      persist(next);
      return next;
    }),

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      const next = {
        ...state,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
        resumes: previous.resumes,
        activeId: previous.activeId,
      };
      persist(next);
      return next;
    }),

  redo: () =>
    set((state) => {
      const [entry, ...rest] = state.future;
      if (!entry) return state;
      const next = {
        ...state,
        past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
        future: rest,
        resumes: entry.resumes,
        activeId: entry.activeId,
      };
      persist(next);
      return next;
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));

/** Subscribe to the active resume only. */
export function useResume(): Resume {
  return useStore((s) => s.resumes.find((r) => r.meta.id === s.activeId) ?? s.resumes[0]);
}
