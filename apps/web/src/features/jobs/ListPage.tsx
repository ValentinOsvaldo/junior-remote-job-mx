import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlidersIcon } from '../../components/ui/icons.tsx'
import { Sheet } from '../../components/ui/sheet.tsx'
import { ago } from '../../lib/format.ts'
import type { Sort } from '../../lib/types.ts'
import { activeFilterCount, useStore } from '../../store/filters.ts'
import { ActiveChips } from './ActiveChips.tsx'
import { Filters } from './Filters.tsx'
import { JobList } from './JobList.tsx'
import { SearchBar } from './SearchBar.tsx'
import { useJobs } from './use-jobs.ts'

const SORTS: [Sort, string][] = [['recent', 'Más recientes'], ['salary', 'Mejor sueldo'], ['relevance', 'Relevancia']]

export function ListPage() {
  const query = useJobs()
  const first = query.data?.pages[0]
  const total = first?.total ?? 0
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterCount = useStore((s) => activeFilterCount(s.filters))
  const sort = useStore((s) => s.sort)
  const setSort = useStore((s) => s.setSort)

  return (
    <div className="min-h-dvh">
      <a href="#vacantes" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Saltar a las vacantes
      </a>
      <h1 className="sr-only">Vacantes junior, trainee y becario para programadores en México</h1>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-2 pt-3 lg:flex-row lg:items-start lg:gap-8 lg:py-4">
          <div className="flex items-center justify-between lg:h-11 lg:w-[260px] lg:shrink-0">
            <Link to="/" translate="no" className="font-mono text-[15px] font-semibold tracking-tight">
              junior<span className="text-primary-ink">/</span>mx
            </Link>
            {first ? <span className="font-mono text-[11px] text-muted-foreground">act. {ago(first.generatedAt)}</span> : null}
          </div>
          <div className="flex min-w-0 flex-1 gap-2">
            <SearchBar />
            <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)} className="relative lg:hidden" aria-label="Filtros">
              <SlidersIcon />
              {filterCount ? (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
                  {filterCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:pt-6">
        <aside className="no-scrollbar hidden lg:sticky lg:top-[7.5rem] lg:block lg:max-h-[calc(100dvh-8.5rem)] lg:self-start lg:overflow-y-auto lg:pb-6">
          <Filters facets={first?.facets} />
        </aside>

        <section id="vacantes" aria-label="Vacantes" tabIndex={-1} className="min-w-0 outline-none">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-mono font-semibold tabular-nums text-foreground">{total}</span> vacantes junior
            </p>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger size="default" aria-label="Ordenar por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ActiveChips />
          <JobList query={query} />
        </section>
      </main>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        footer={
          <Button className="w-full font-semibold" onClick={() => setFiltersOpen(false)}>
            Ver {total} vacantes
          </Button>
        }
      >
        <Filters facets={first?.facets} />
      </Sheet>
    </div>
  )
}
