import MiniSearch from 'minisearch'
import type { Job } from './types.ts'

/**
 * Query syntax:
 *   react node          all words (fuzzy + prefix)
 *   "home office"       exact phrase
 *   -angular            exclude word / phrase / field
 *   stack:react  ciudad:gdl  estado:jalisco  empresa:globant  fuente:linkedin
 *   nivel:becario  area:mobile  modo:remoto  sueldo:>15k  sueldo:12k-20k
 */
export type Clause = { neg: boolean; key: FieldKey | null; value: string; phrase: boolean }
type FieldKey = keyof typeof FIELD_ALIASES

const FIELD_ALIASES = {
  stack: ['stack', 'tech', 'tec'],
  city: ['city', 'ciudad'],
  state: ['state', 'estado'],
  company: ['company', 'empresa'],
  source: ['source', 'fuente'],
  salary: ['salary', 'sueldo', 'salario'],
  level: ['level', 'nivel'],
  category: ['cat', 'area', 'tipo'],
  modality: ['modo', 'modality', 'modalidad'],
} as const

const KEY_BY_ALIAS = new Map<string, FieldKey>(
  Object.entries(FIELD_ALIASES).flatMap(([key, aliases]) => aliases.map((a) => [a, key as FieldKey])),
)

// Spanish words people will type, mapped to the values stored by the scraper.
const VALUE_SYNONYMS: Record<string, string> = {
  becario: 'intern', practicante: 'intern', remoto: 'remote', 'home office': 'remote', hibrido: 'hybrid',
  presencial: 'onsite', movil: 'mobile', datos: 'data', gdl: 'guadalajara', mty: 'monterrey', cdmx: 'ciudad de mexico',
}

export const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function parseQuery(q: string): Clause[] {
  const clauses: Clause[] = []
  for (const m of q.matchAll(/(-)?(?:([a-z]+):)?(?:"([^"]*)"?|(\S+))/gi)) {
    const [, neg, rawKey, phrase, word] = m
    const key = rawKey ? KEY_BY_ALIAS.get(fold(rawKey)) : undefined
    let value = fold((phrase ?? word ?? '').trim())
    if (rawKey && !key) value = fold(`${rawKey}:`) + value // unknown field -> plain text
    if (!value) continue
    clauses.push({ neg: !!neg, key: key ?? null, value: (key && VALUE_SYNONYMS[value]) || value, phrase: phrase != null })
  }
  return clauses
}

const tokenRx = (token: string) => new RegExp(`(^|\\s)${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'i')

export const hasToken = (q: string, token: string) => tokenRx(token).test(q)

/** Adds `token` to the query, or removes it if it's already there (never duplicates). */
export function toggleToken(q: string, token: string): string {
  const next = hasToken(q, token) ? q.replace(tokenRx(token), ' ') : `${q} ${token}`
  return next.replace(/\s+/g, ' ').trim()
}

/** '>15k' | '15000' | '12k-20k' -> [min, max] in MXN */
function salaryRange(v: string): [number, number] {
  const n = (s: string) => parseFloat(s) * (/k$/.test(s) ? 1000 : 1)
  const range = v.match(/^([\d.]+k?)-([\d.]+k?)$/)
  if (range) return [n(range[1]), n(range[2])]
  if (v.startsWith('<')) return [0, n(v.slice(1))]
  return [n(v.replace(/^>=?/, '')), Infinity]
}

function matchField(job: Job, key: FieldKey, v: string): boolean {
  switch (key) {
    case 'stack':
      return job.stack.some((s) => fold(s).startsWith(v))
    case 'city':
      return fold(`${job.city ?? ''} ${job.state ?? ''}`).includes(v)
    case 'state':
      return fold(job.state ?? '').includes(v)
    case 'company':
      return fold(job.company).includes(v)
    case 'source':
      return job.source.startsWith(v)
    case 'level':
      return job.level.startsWith(v)
    case 'category':
      return job.categories.some((c) => c.startsWith(v))
    case 'modality':
      return job.modality.startsWith(v)
    case 'salary': {
      const pay = job.salaryMax ?? job.salaryMin
      const [min, max] = salaryRange(v)
      return pay != null && pay >= min && pay <= max
    }
  }
}

const haystacks = new WeakMap<Job, string>()
function haystack(j: Job) {
  let text = haystacks.get(j)
  if (text === undefined) haystacks.set(j, (text = fold(`${j.title} ${j.company} ${j.stack.join(' ')} ${j.summary}`)))
  return text
}

export function buildIndex(jobs: Job[]) {
  const index = new MiniSearch<Job>({
    fields: ['title', 'company', 'stack', 'summary', 'place'],
    extractField: (j, f) =>
      f === 'stack' ? j.stack.join(' ') : f === 'place' ? `${j.city ?? ''} ${j.state ?? ''}` : String(j[f as keyof Job] ?? ''),
    processTerm: (t) => fold(t),
    searchOptions: { boost: { title: 3, stack: 2, company: 1.5 }, prefix: true, fuzzy: (t) => (t.length > 4 ? 0.2 : false), combineWith: 'AND' },
  })
  index.addAll(jobs)
  return index
}

/** Returns matching jobs with a relevance score (0 when there were no free-text words). */
export function searchJobs(jobs: Job[], index: MiniSearch<Job>, q: string): { job: Job; score: number }[] {
  const clauses = parseQuery(q)
  const words = clauses.filter((c) => !c.neg && !c.key && !c.phrase).map((c) => c.value)
  const rest = clauses.filter((c) => c.neg || c.key || c.phrase)

  let scored: { job: Job; score: number }[]
  if (words.length) {
    const byId = new Map(jobs.map((j) => [j.id, j]))
    scored = index.search(words.join(' ')).map((r) => ({ job: byId.get(r.id)!, score: r.score }))
  } else {
    scored = jobs.map((job) => ({ job, score: 0 }))
  }

  if (!rest.length) return scored
  return scored.filter(({ job }) => {
    const text = haystack(job)
    return rest.every((c) => (c.key ? matchField(job, c.key, c.value) : text.includes(c.value)) !== c.neg)
  })
}
