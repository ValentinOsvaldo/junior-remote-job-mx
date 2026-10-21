import { useState, type ReactNode } from 'react'
import { Chip } from '../../components/ui/chip.tsx'
import { CATEGORY_LABEL, LEVEL_LABEL, MODALITY_LABEL, SOURCE_LABEL } from '../../lib/format.ts'
import type { FacetKey, Facets } from '../../lib/types.ts'
import { useStore } from '../../store/filters.ts'

const LABELS: Partial<Record<FacetKey, Record<string, string>>> = {
  levels: LEVEL_LABEL, categories: CATEGORY_LABEL, modality: MODALITY_LABEL, sources: SOURCE_LABEL,
}
const DAYS: [number | null, string][] = [[null, 'Todo'], [1, '24 h'], [3, '3 días'], [7, '7 días']]
const SALARY_MAX = 40_000

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">{title}</legend>
      {children}
    </fieldset>
  )
}

function FacetChips({ facet, facets, limit }: { facet: FacetKey; facets: Facets; limit?: number }) {
  const selected = useStore((s) => s.filters[facet] as string[])
  const toggle = useStore((s) => s.toggle)
  const [expanded, setExpanded] = useState(false)
  const values = facets[facet]
  const shown = limit && !expanded ? values.slice(0, limit) : values

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(([value, count]) => (
        <Chip key={value} pressed={selected.includes(value)} count={count} onClick={() => toggle(facet, value)}>
          {LABELS[facet]?.[value] ?? value}
        </Chip>
      ))}
      {limit && values.length > limit ? (
        <button type="button" onClick={() => setExpanded(!expanded)} className="press h-9 px-2 text-sm text-accent-ink underline-offset-4 hover:underline">
          {expanded ? 'Ver menos' : `+${values.length - limit} más`}
        </button>
      ) : null}
    </div>
  )
}

export function Filters({ facets }: { facets: Facets | undefined }) {
  const f = useStore((s) => s.filters)
  const setFilter = useStore((s) => s.setFilter)
  const savedCount = useStore((s) => s.saved.length)

  if (!facets) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />

  return (
    <div className="space-y-6">
      <Group title="Nivel"><FacetChips facet="levels" facets={facets} /></Group>
      <Group title="Área"><FacetChips facet="categories" facets={facets} /></Group>
      <Group title="Modalidad"><FacetChips facet="modality" facets={facets} /></Group>

      <Group title="Sueldo mensual">
        <div className="flex items-baseline justify-between">
          <label htmlFor="salary" className="text-sm">Mínimo</label>
          <output htmlFor="salary" className="font-mono text-sm text-accent-ink">
            {f.salaryMin ? `$${f.salaryMin / 1000}k+` : 'Cualquiera'}
          </output>
        </div>
        <input
          id="salary"
          type="range"
          min={0}
          max={SALARY_MAX}
          step={2500}
          value={f.salaryMin}
          onChange={(e) => setFilter('salaryMin', Number(e.target.value))}
          className="range w-full"
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={f.onlySalary} onChange={(e) => setFilter('onlySalary', e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Solo con sueldo publicado
        </label>
      </Group>

      <Group title="Publicado">
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-surface p-1" role="group">
          {DAYS.map(([d, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={f.days === d}
              onClick={() => setFilter('days', d)}
              className={`press h-9 rounded-lg text-sm transition-colors duration-150 ${f.days === d ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Tecnologías"><FacetChips facet="stack" facets={facets} limit={14} /></Group>
      <Group title="Estado"><FacetChips facet="states" facets={facets} limit={8} /></Group>
      <Group title="Fuente"><FacetChips facet="sources" facets={facets} /></Group>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={f.savedOnly} onChange={(e) => setFilter('savedOnly', e.target.checked)} className="size-4 accent-[var(--accent)]" />
        Solo guardadas <span className="font-mono text-[11px] text-muted">{savedCount}</span>
      </label>
    </div>
  )
}
