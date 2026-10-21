// Mirrors the output of apps/scraper/src/scraper/cli.py::to_job
export type Level = 'intern' | 'trainee' | 'junior'
export type Modality = 'remote' | 'hybrid' | 'onsite'
export type Category = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'data' | 'devops' | 'qa' | 'software'

export type Job = {
  id: string
  title: string
  company: string
  level: Level
  categories: Category[]
  stack: string[]
  modality: Modality
  city: string | null
  state: string | null
  salaryMin: number | null
  salaryMax: number | null
  summary: string
  source: string
  url: string
  postedAt: string
  firstSeen: string
}

export type JobsFile = { generatedAt: string; count: number; jobs: Job[] }

export type Filters = {
  levels: Level[]
  categories: Category[]
  modality: Modality[]
  stack: string[]
  states: string[]
  sources: string[]
  salaryMin: number
  onlySalary: boolean
  days: number | null
  savedOnly: boolean
}

export type FacetKey = 'levels' | 'categories' | 'modality' | 'stack' | 'states' | 'sources'
export type Facets = Record<FacetKey, [value: string, count: number][]>

export type Sort = 'recent' | 'salary' | 'relevance'

export type JobsQuery = { q: string; filters: Filters; sort: Sort; saved: string[] }

export type JobsPage = {
  items: Job[]
  nextCursor: number | null
  total: number
  facets: Facets
  generatedAt: string
}
