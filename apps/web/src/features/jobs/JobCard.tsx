import * as m from 'motion/react-m'
import { memo } from 'react'
import { Tag } from '../../components/ui/chip.tsx'
import { ArrowUpRightIcon, BookmarkIcon } from '../../components/ui/icons.tsx'
import { ago, LEVEL_LABEL, MODALITY_LABEL, place, salary, SOURCE_LABEL } from '../../lib/format.ts'
import type { Job } from '../../lib/types.ts'

const MAX_STACK = 4

type Props = { job: Job; saved: boolean; onToggleSave: (id: string) => void }

export const JobCard = memo(function JobCard({ job, saved, onToggleSave }: Props) {
  const pay = salary(job)
  const extra = job.stack.length - MAX_STACK

  return (
    <article className="group press relative rounded-2xl border border-line bg-surface p-4 transition-colors duration-150 hover:border-fg/25 sm:p-5">
      <div className="flex items-center gap-2 pr-10 font-mono text-[11px] text-muted">
        <span className="rounded bg-fg px-1.5 py-0.5 font-semibold uppercase tracking-wide text-bg">{LEVEL_LABEL[job.level]}</span>
        <span>{SOURCE_LABEL[job.source] ?? job.source}</span>
        <span aria-hidden>·</span>
        <time dateTime={job.postedAt}>{ago(job.postedAt)}</time>
      </div>

      <h3 className="mt-2.5 text-[17px] font-semibold leading-snug text-fg text-balance sm:text-lg">
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-accent">
          {job.title}
        </a>
      </h3>
      <p className="mt-1 truncate text-sm text-muted">
        <span className="text-fg/80">{job.company}</span> · {place(job)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {pay ? (
          <p className="font-mono text-[15px] font-semibold tabular-nums text-accent-ink">
            {pay} <span className="text-[11px] font-normal text-muted">MXN/mes</span>
          </p>
        ) : (
          <p className="font-mono text-[12px] text-muted">Sueldo no publicado</p>
        )}
        <Tag tone={job.modality === 'remote' ? 'accent' : 'plain'}>{MODALITY_LABEL[job.modality]}</Tag>
      </div>

      {job.summary ? <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted">{job.summary}</p> : null}

      {job.stack.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.stack.slice(0, MAX_STACK).map((s) => <Tag key={s}>{s}</Tag>)}
          {extra > 0 ? <Tag>+{extra}</Tag> : null}
        </div>
      ) : null}

      <ArrowUpRightIcon className="absolute bottom-4 right-4 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden />

      <m.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => onToggleSave(job.id)}
        aria-pressed={saved}
        aria-label={saved ? 'Quitar de guardadas' : 'Guardar vacante'}
        className={`absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-full transition-colors duration-150 ${saved ? 'text-accent-ink' : 'text-muted hover:text-fg'}`}
      >
        <BookmarkIcon filled={saved} />
      </m.button>
    </article>
  )
})
