import { Button } from '@/components/ui/button'
import { memo, ViewTransition } from 'react'
import { Link } from 'react-router'
import { Tag } from '../../components/ui/chip.tsx'
import { BookmarkIcon, ChevronRightIcon } from '../../components/ui/icons.tsx'
import { ago, LEVEL_LABEL, MODALITY_LABEL, place, salary, SOURCE_LABEL } from '../../lib/format.ts'
import type { Job } from '../../lib/types.ts'

const MAX_STACK = 4

type Props = { job: Job; saved: boolean; onToggleSave: (id: string) => void }

export const JobCard = memo(function JobCard({ job, saved, onToggleSave }: Props) {
  const pay = salary(job)
  const extra = job.stack.length - MAX_STACK

  return (
    <article className="group press relative rounded-2xl border border-border bg-card p-4 transition-colors duration-150 hover:border-foreground/25 sm:p-5">
      <div className="flex items-center gap-2 pr-10 font-mono text-[11px] text-muted-foreground">
        <span className="rounded bg-foreground px-1.5 py-0.5 font-semibold uppercase tracking-wide text-background">{LEVEL_LABEL[job.level]}</span>
        <span>{SOURCE_LABEL[job.source] ?? job.source}</span>
        <span aria-hidden>·</span>
        <time dateTime={job.postedAt}>{ago(job.postedAt)}</time>
      </div>

      {/* Same name as the heading on JobPage: the title morphs into it on navigation. */}
      <ViewTransition name={`job-title-${job.id}`} share="morph" default="none">
        <h3 className="mt-2.5 w-fit text-[17px] font-semibold leading-snug text-foreground text-balance sm:text-lg">
          <Link to={`/job/${encodeURIComponent(job.id)}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-primary">
            {job.title}
          </Link>
        </h3>
      </ViewTransition>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        <span className="text-foreground/80">{job.company}</span> · {place(job)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {pay ? (
          <p className="font-mono text-[15px] font-semibold tabular-nums text-primary-ink">
            {pay} <span className="text-[11px] font-normal text-muted-foreground">MXN/mes</span>
          </p>
        ) : (
          <p className="font-mono text-[12px] text-muted-foreground">Sueldo no publicado</p>
        )}
        <Tag tone={job.modality === 'remote' ? 'accent' : 'plain'}>{MODALITY_LABEL[job.modality]}</Tag>
      </div>

      {job.summary ? <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{job.summary}</p> : null}

      {job.stack.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.stack.slice(0, MAX_STACK).map((s) => <Tag key={s}>{s}</Tag>)}
          {extra > 0 ? <Tag>+{extra}</Tag> : null}
        </div>
      ) : null}

      <ChevronRightIcon className="absolute bottom-4 right-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleSave(job.id)}
        aria-pressed={saved}
        aria-label={saved ? 'Quitar de guardadas' : 'Guardar vacante'}
        className={`absolute right-2 top-2 z-10 rounded-full hover:bg-transparent ${saved ? 'text-primary-ink hover:text-primary-ink' : ''}`}
      >
        <BookmarkIcon filled={saved} />
      </Button>
    </article>
  )
})
