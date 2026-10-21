import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { useEffect, ViewTransition, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tag } from '../../components/ui/chip.tsx'
import { ArrowLeftIcon, ArrowUpRightIcon, BookmarkIcon } from '../../components/ui/icons.tsx'
import { ago, CATEGORY_LABEL, LEVEL_LABEL, MODALITY_LABEL, place, salary, SOURCE_LABEL } from '../../lib/format.ts'
import { fetchJob, peekJob } from '../../lib/jobs-source.ts'
import type { Job } from '../../lib/types.ts'
import { useStore } from '../../store/filters.ts'

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long' })

export function JobPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Came from the list: real history back (keeps the list's URL and scroll). Deep link: go to the list.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/', { replace: true }))
  const { data: job, isPending, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJob(id),
    initialData: () => peekJob(id), // instant when coming from the list
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!job) return
    const prev = document.title
    document.title = `${job.title} · ${job.company} | Junior Jobs MX`
    return () => {
      document.title = prev
    }
  }, [job])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Button variant="ghost" onClick={goBack} className="-ml-2 px-2 font-normal">
            <ArrowLeftIcon /> Vacantes
          </Button>
          <span translate="no" className="font-mono text-[15px] font-semibold tracking-tight">
            junior<span className="text-primary-ink">/</span>mx
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pb-16 sm:pt-10">
        {job ? (
          <JobDetail job={job} />
        ) : isPending ? (
          <div className="space-y-4" aria-busy="true" aria-label="Cargando vacante">
            <div className="h-4 w-40 animate-pulse rounded bg-card" />
            <div className="h-9 w-4/5 animate-pulse rounded bg-card" />
            <div className="h-40 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <h1 className="text-lg font-semibold">{error ? 'No se pudo cargar la vacante' : 'Esta vacante ya no está disponible'}</h1>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {error ? error.message : 'Las vacantes con más de 30 días se retiran. Busca otras parecidas en la lista.'}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {error ? <Button variant="outline" onClick={() => refetch()}>Reintentar</Button> : null}
              <Button className="font-semibold" onClick={goBack}>Ver vacantes</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm">{children}</dd>
    </div>
  )
}

function JobDetail({ job }: { job: Job }) {
  const saved = useStore((s) => s.saved.includes(job.id))
  const toggleSaved = useStore((s) => s.toggleSaved)
  const pay = salary(job)
  const source = SOURCE_LABEL[job.source] ?? job.source

  const actions = (
    <>
      <Button variant="outline" onClick={() => toggleSaved(job.id)} aria-pressed={saved} className={saved ? 'text-primary-ink' : ''}>
        <BookmarkIcon filled={saved} /> {saved ? 'Guardada' : 'Guardar'}
      </Button>
      <Button asChild className="flex-1 px-5 font-semibold sm:flex-none">
        <a href={job.url} target="_blank" rel="noopener noreferrer">
          Postularme<span className="hidden sm:inline">&nbsp;en {source}</span> <ArrowUpRightIcon width={16} height={16} />
        </a>
      </Button>
    </>
  )

  return (
    <article>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span className="rounded bg-foreground px-1.5 py-0.5 font-semibold uppercase tracking-wide text-background">{LEVEL_LABEL[job.level]}</span>
        <span>{source}</span>
        <span aria-hidden>·</span>
        <time dateTime={job.postedAt}>{ago(job.postedAt)}</time>
      </div>

      <ViewTransition name={`job-title-${job.id}`} share="morph" default="none">
        <h1 className="mt-3 w-fit text-[26px] font-semibold leading-tight text-balance sm:text-4xl">{job.title}</h1>
      </ViewTransition>
      <p className="mt-2 text-base text-muted-foreground">
        <span className="text-foreground">{job.company}</span> · {place(job)}
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
        {pay ? (
          <p className="font-mono text-2xl font-semibold tabular-nums text-primary-ink">
            {pay} <span className="text-xs font-normal text-muted-foreground">MXN/mes</span>
          </p>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">Sueldo no publicado</p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
          <Fact label="Modalidad">{MODALITY_LABEL[job.modality]}</Fact>
          <Fact label="Nivel">{LEVEL_LABEL[job.level]}</Fact>
          <Fact label="Área">{job.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}</Fact>
          <Fact label="Ubicación">{place(job)}</Fact>
          <Fact label="Publicada">{dateFmt.format(new Date(`${job.postedAt}T12:00:00`))}</Fact>
          <Fact label="Fuente">{source}</Fact>
        </dl>
      </div>

      {job.summary ? (
        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Resumen</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty">{job.summary}</p>
          <p className="mt-2 text-sm text-muted-foreground">La descripción completa está en {source}.</p>
        </section>
      ) : null}

      {job.stack.length ? (
        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Tecnologías</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.stack.map((s) => <Tag key={s}>{s}</Tag>)}
          </div>
        </section>
      ) : null}

      {/* Desktop: inline. Mobile: sticky bar within thumb reach. */}
      <div className="mt-10 hidden gap-2 sm:flex">{actions}</div>
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-border bg-background/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        {actions}
      </div>
    </article>
  )
}
