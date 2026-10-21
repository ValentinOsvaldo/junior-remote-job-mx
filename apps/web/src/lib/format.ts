import type { Category, Job, Level, Modality } from './types.ts'

export const LEVEL_LABEL: Record<Level, string> = { intern: 'Becario', trainee: 'Trainee', junior: 'Junior' }

export const CATEGORY_LABEL: Record<Category, string> = {
  frontend: 'Frontend', backend: 'Backend', fullstack: 'Full stack', mobile: 'Móvil',
  data: 'Datos', devops: 'DevOps', qa: 'QA', software: 'Software',
}

export const MODALITY_LABEL: Record<Modality, string> = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' }

export const SOURCE_LABEL: Record<string, string> = { indeed: 'Indeed', linkedin: 'LinkedIn', glassdoor: 'Glassdoor', google: 'Google' }

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))

export function salary({ salaryMin: min, salaryMax: max }: Job): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return min === max ? `$${k(min)}` : `$${k(min)} – ${k(max)}`
  return min != null ? `Desde $${k(min)}` : `Hasta $${k(max!)}`
}

const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })

export function ago(iso: string): string {
  const days = Math.round((Date.parse(iso) - Date.now()) / 86_400_000)
  if (days > -1) return rtf.format(Math.min(days, 0), 'day')
  if (days > -30) return rtf.format(days, 'day')
  return rtf.format(Math.round(days / 30), 'month')
}

export const place = (j: Job) => [j.city, j.state].filter(Boolean).join(', ') || 'México'
