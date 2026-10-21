// The only place the UI gets jobs from. Today: a static JSON written by the scraper,
// filtered in the browser. With a server, replace the body of fetchJobsPage with
// `fetch('/api/jobs?' + params)` (and fetchJob with `/api/jobs/:id`); the shapes stay the same.
import { buildIndex, searchJobs } from './search.ts'
import type { FacetKey, Facets, Filters, Job, JobsFile, JobsPage, JobsQuery } from './types.ts'

export const PAGE_SIZE = 30
const DAY = 86_400_000

let data: Promise<JobsFile & { index: ReturnType<typeof buildIndex> }> | null = null
let byId: Map<string, Job> | null = null // filled once loaded, for synchronous lookups

function load() {
  data ??= fetch(`${import.meta.env.BASE_URL}data/jobs.json`)
    .then((r) => {
      if (!r.ok) throw new Error(r.status === 404 ? 'No hay datos todavía. Ejecuta `pnpm scrape`.' : `HTTP ${r.status}`)
      return r.json() as Promise<JobsFile>
    })
    .then((file) => {
      byId = new Map(file.jobs.map((j) => [j.id, j]))
      return { ...file, index: buildIndex(file.jobs) }
    })
    .catch((e) => {
      data = null // allow retry
      throw e
    })
  return data
}

/** null when the job is gone (expired postings are dropped by the scraper after 30 days). */
export async function fetchJob(id: string): Promise<Job | null> {
  await load()
  return byId!.get(id) ?? null
}

/** Sync lookup when the data is already loaded (coming from the list): lets the page render in the same frame. */
export const peekJob = (id: string) => byId?.get(id)

const FACET_VALUE: Record<FacetKey, (j: Job) => string[]> = {
  levels: (j) => [j.level],
  categories: (j) => j.categories,
  modality: (j) => [j.modality],
  stack: (j) => j.stack,
  states: (j) => (j.state ? [j.state] : []),
  sources: (j) => [j.source],
}

function passes(job: Job, f: Filters, saved: Set<string>, now: number, skip?: FacetKey): boolean {
  for (const key of Object.keys(FACET_VALUE) as FacetKey[]) {
    const wanted = f[key] as string[]
    if (key !== skip && wanted.length && !FACET_VALUE[key](job).some((v) => wanted.includes(v))) return false
  }
  const pay = job.salaryMax ?? job.salaryMin
  if (f.onlySalary && pay == null) return false
  if (f.salaryMin && (pay ?? 0) < f.salaryMin) return false
  if (f.days && now - Date.parse(job.postedAt) > f.days * DAY) return false
  if (f.savedOnly && !saved.has(job.id)) return false
  return true
}

/** Counts per facet value, ignoring that facet's own selection (standard faceted search). */
function facets(jobs: Job[], f: Filters, saved: Set<string>, now: number): Facets {
  const out = {} as Facets
  for (const key of Object.keys(FACET_VALUE) as FacetKey[]) {
    const counts = new Map<string, number>()
    for (const j of jobs) {
      if (!passes(j, f, saved, now, key)) continue
      for (const v of FACET_VALUE[key](j)) counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    for (const v of f[key] as string[]) if (!counts.has(v)) counts.set(v, 0) // keep selected chips visible
    out[key] = [...counts].sort((a, b) => b[1] - a[1])
  }
  return out
}

let last: { key: string; items: Job[]; facets: Facets } | null = null

export async function fetchJobsPage(query: JobsQuery, cursor = 0): Promise<JobsPage> {
  const { jobs, index, generatedAt } = await load()
  const key = JSON.stringify(query)
  if (last?.key !== key) {
    const now = Date.now()
    const saved = new Set(query.saved)
    const matched = searchJobs(jobs, index, query.q)
    const filtered = matched.filter(({ job }) => passes(job, query.filters, saved, now))
    const pay = (j: Job) => j.salaryMax ?? j.salaryMin ?? -1
    const byDate = (a: Job, b: Job) => b.postedAt.localeCompare(a.postedAt)
    filtered.sort((a, b) =>
      query.sort === 'salary' ? pay(b.job) - pay(a.job) || byDate(a.job, b.job)
      : query.sort === 'relevance' ? b.score - a.score || byDate(a.job, b.job)
      : byDate(a.job, b.job),
    )
    last = { key, items: filtered.map((r) => r.job), facets: facets(matched.map((r) => r.job), query.filters, saved, now) }
  }
  const items = last.items.slice(cursor, cursor + PAGE_SIZE)
  const next = cursor + PAGE_SIZE
  return { items, nextCursor: next < last.items.length ? next : null, total: last.items.length, facets: last.facets, generatedAt }
}
