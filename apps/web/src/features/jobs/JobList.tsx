import { useWindowVirtualizer } from '@tanstack/react-virtual'
import * as m from 'motion/react-m'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/button.tsx'
import { useStore } from '../../store/filters.ts'
import { JobCard } from './JobCard.tsx'
import type { useJobs } from './use-jobs.ts'

const GAP = 12
const ease = [0.22, 1, 0.36, 1] as const // ease-out: arrive fast, settle gently

export function JobList({ query }: { query: ReturnType<typeof useJobs> }) {
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query
  const saved = useStore((s) => s.saved)
  const toggleSaved = useStore((s) => s.toggleSaved)
  const reset = useStore((s) => s.reset)

  // The virtualizer re-renders on every scroll frame: don't rebuild these each time.
  const jobs = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])
  const savedSet = useMemo(() => new Set(saved), [saved])

  // Window scrolling (natural on mobile); the list starts below header/filters, so offset by its top.
  const listRef = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)
  const topRef = useRef(0)
  useLayoutEffect(() => {
    // Re-measured after every render (chips row can grow); setState only when it moved, so no loop.
    const t = (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY
    topRef.current = t
    setTop((prev) => (Math.abs(t - prev) > 1 ? t : prev))
  })

  const virtualizer = useWindowVirtualizer({
    count: jobs.length + (hasNextPage ? 1 : 0),
    estimateSize: () => 220,
    overscan: 6,
    gap: GAP,
    scrollMargin: top,
  })
  const rows = virtualizer.getVirtualItems()
  const lastIndex = rows.at(-1)?.index ?? -1

  // Infinite scroll: ask for the next page when the loader row is about to show.
  useEffect(() => {
    if (lastIndex >= jobs.length - 4 && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [lastIndex, jobs.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // New result set (search / filter change): jump back to the top and replay the entrance.
  const firstPage = data?.pages[0]
  const seen = useRef(new Set<string>())
  const lastFirstPage = useRef(firstPage)
  if (lastFirstPage.current !== firstPage) {
    lastFirstPage.current = firstPage
    seen.current = new Set()
  }
  useEffect(() => {
    if (window.scrollY > topRef.current) window.scrollTo({ top: Math.max(0, topRef.current - 160) })
  }, [firstPage])
  useEffect(() => {
    for (const r of rows) if (jobs[r.index]) seen.current.add(jobs[r.index].id)
  })

  if (error) {
    return (
      <State title="No se pudieron cargar las vacantes" body={error.message}>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </State>
    )
  }
  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Cargando vacantes">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface" />)}
      </div>
    )
  }
  if (!jobs.length) {
    return (
      <State title="Sin resultados" body="Prueba con menos filtros o una búsqueda más corta.">
        <Button onClick={reset}>Limpiar filtros</Button>
      </State>
    )
  }

  let stagger = 0
  return (
    <div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {rows.map((row) => {
        const job = jobs[row.index]
        const isNew = job && !seen.current.has(job.id)
        const delay = isNew ? Math.min(stagger++, 8) * 0.03 : 0
        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute inset-x-0 top-0"
            style={{ transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)` }}
          >
            {job ? (
              <m.div
                key={job.id}
                initial={isNew ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease, delay }}
              >
                <JobCard job={job} saved={savedSet.has(job.id)} onToggleSave={toggleSaved} />
              </m.div>
            ) : (
              <p className="py-6 text-center font-mono text-xs text-muted" role="status">Cargando más…</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function State({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}
