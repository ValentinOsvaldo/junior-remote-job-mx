import { create } from 'zustand'
import type { Filters, Sort } from '../lib/types.ts'

export const EMPTY_FILTERS: Filters = {
  levels: [], categories: [], modality: [], stack: [], states: [], sources: [],
  salaryMin: 0, onlySalary: false, days: null, savedOnly: false,
}

type ListKey = { [K in keyof Filters]: Filters[K] extends string[] ? K : never }[keyof Filters]

type State = {
  q: string
  sort: Sort
  filters: Filters
  saved: string[]
  setQ: (q: string) => void
  setSort: (sort: Sort) => void
  toggle: (key: ListKey, value: string) => void
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  reset: () => void
  toggleSaved: (id: string) => void
}

// --- URL <-> state (shareable searches) ---------------------------------------

const LIST_KEYS = ['levels', 'categories', 'modality', 'stack', 'states', 'sources'] as const

function fromUrl(): Pick<State, 'q' | 'sort' | 'filters'> {
  const p = new URLSearchParams(location.search)
  const filters = { ...EMPTY_FILTERS }
  for (const k of LIST_KEYS) (filters[k] as string[]) = p.get(k)?.split(',').filter(Boolean) ?? []
  filters.salaryMin = Number(p.get('salaryMin')) || 0
  filters.onlySalary = p.has('onlySalary')
  filters.days = Number(p.get('days')) || null
  filters.savedOnly = p.has('saved')
  const sort = p.get('sort')
  return { q: p.get('q') ?? '', sort: sort === 'salary' || sort === 'relevance' ? sort : 'recent', filters }
}

function toUrl({ q, sort, filters: f }: State) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (sort !== 'recent') p.set('sort', sort)
  for (const k of LIST_KEYS) if (f[k].length) p.set(k, f[k].join(','))
  if (f.salaryMin) p.set('salaryMin', String(f.salaryMin))
  if (f.onlySalary) p.set('onlySalary', '')
  if (f.days) p.set('days', String(f.days))
  if (f.savedOnly) p.set('saved', '')
  const search = p.toString().replace(/=(&|$)/g, '$1')
  history.replaceState(null, '', search ? `?${search}` : location.pathname)
}

// --- Saved jobs (per browser) ----------------------------------------------------

const SAVED_KEY = 'junior-job:saved:v1'

function readSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function writeSaved(ids: string[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
  } catch {
    // private mode / blocked storage: saved jobs just won't survive a reload
  }
}

export const useStore = create<State>()((set) => ({
  ...fromUrl(),
  saved: readSaved(),
  setQ: (q) => set({ q }),
  setSort: (sort) => set({ sort }),
  toggle: (key, value) =>
    set((s) => {
      const list = s.filters[key] as string[]
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { filters: { ...s.filters, [key]: next } }
    }),
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  reset: () => set({ q: '', filters: EMPTY_FILTERS }),
  toggleSaved: (id) =>
    set((s) => {
      const saved = s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [id, ...s.saved]
      writeSaved(saved)
      return { saved }
    }),
}))

useStore.subscribe((s, prev) => {
  if (s.q !== prev.q || s.sort !== prev.sort || s.filters !== prev.filters) toUrl(s)
})

export const activeFilterCount = (f: Filters) =>
  LIST_KEYS.reduce((n, k) => n + f[k].length, 0) + (f.salaryMin ? 1 : 0) + (f.onlySalary ? 1 : 0) + (f.days ? 1 : 0) + (f.savedOnly ? 1 : 0)
