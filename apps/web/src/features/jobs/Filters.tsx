import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Chip } from '../../components/ui/chip.tsx'
import { CATEGORY_LABEL, LEVEL_LABEL, MODALITY_LABEL, SOURCE_LABEL } from '../../lib/format.ts'
import type { FacetKey, Facets } from '../../lib/types.ts'
import { useStore } from '../../store/filters.ts'

const LABELS: Partial<Record<FacetKey, Record<string, string>>> = {
  levels: LEVEL_LABEL, categories: CATEGORY_LABEL, modality: MODALITY_LABEL, sources: SOURCE_LABEL,
}
const DAYS: [string, string][] = [['all', 'Todo'], ['1', '24 h'], ['3', '3 días'], ['7', '7 días']]
const SALARY_MAX = 40_000

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="cursor-pointer font-normal">{children}</Label>
    </div>
  )
}

function Group({ title, children, hidden }: { title: string; children: ReactNode; hidden?: boolean }) {
  if (hidden) return null
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</legend>
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
        <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)} className="text-primary-ink">
          {expanded ? 'Ver menos' : `+${values.length - limit} más`}
        </Button>
      ) : null}
    </div>
  )
}

export function Filters({ facets }: { facets: Facets | undefined }) {
  const f = useStore((s) => s.filters)
  const setFilter = useStore((s) => s.setFilter)
  const savedCount = useStore((s) => s.saved.length)
  const salaryId = useId() // Filters renders twice (sidebar + mobile sheet): ids must be unique

  if (!facets) return <div className="h-96 animate-pulse rounded-2xl bg-card" />

  return (
    <div className="space-y-6">
      <Group title="Nivel" hidden={!facets.levels.length}><FacetChips facet="levels" facets={facets} /></Group>
      <Group title="Área" hidden={!facets.categories.length}><FacetChips facet="categories" facets={facets} /></Group>
      <Group title="Modalidad" hidden={!facets.modality.length}><FacetChips facet="modality" facets={facets} /></Group>

      <Group title="Sueldo mensual">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={salaryId} className="font-normal">Mínimo</Label>
          <output htmlFor={salaryId} className="font-mono text-sm text-primary-ink">
            {f.salaryMin ? `$${f.salaryMin / 1000}k+` : 'Cualquiera'}
          </output>
        </div>
        <Slider
          id={salaryId}
          min={0}
          max={SALARY_MAX}
          step={2500}
          value={[f.salaryMin]}
          onValueChange={([v]) => setFilter('salaryMin', v)}
          aria-label="Sueldo mínimo"
        />
        <CheckRow checked={f.onlySalary} onChange={(v) => setFilter('onlySalary', v)}>
          Solo con sueldo publicado
        </CheckRow>
      </Group>

      <Group title="Publicado">
        <ToggleGroup
          type="single"
          value={f.days ? String(f.days) : 'all'}
          onValueChange={(v) => v && setFilter('days', v === 'all' ? null : Number(v))} // '' = re-click on the active one
          className="grid w-full grid-cols-4 gap-1 rounded-xl border border-border bg-card p-1"
          aria-label="Publicado"
        >
          {DAYS.map(([value, label]) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="h-9 rounded-lg! text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Group>

      <Group title="Tecnologías" hidden={!facets.stack.length}><FacetChips facet="stack" facets={facets} limit={14} /></Group>
      <Group title="Estado" hidden={!facets.states.length}><FacetChips facet="states" facets={facets} limit={8} /></Group>
      <Group title="Fuente" hidden={!facets.sources.length}><FacetChips facet="sources" facets={facets} /></Group>

      <CheckRow checked={f.savedOnly} onChange={(v) => setFilter('savedOnly', v)}>
        Solo guardadas <span className="font-mono text-[11px] text-muted-foreground">{savedCount}</span>
      </CheckRow>
    </div>
  )
}
