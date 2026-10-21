import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { XIcon } from '../../components/ui/icons.tsx'
import { CATEGORY_LABEL, LEVEL_LABEL, MODALITY_LABEL, SOURCE_LABEL } from '../../lib/format.ts'
import type { Filters } from '../../lib/types.ts'
import { activeFilterCount, useStore } from '../../store/filters.ts'

const LIST: [keyof Filters, Record<string, string> | null][] = [
  ['levels', LEVEL_LABEL], ['categories', CATEGORY_LABEL], ['modality', MODALITY_LABEL],
  ['stack', null], ['states', null], ['sources', SOURCE_LABEL],
]
const spring = { type: 'spring', stiffness: 500, damping: 34 } as const

/** Removable summary of everything currently filtering the list. */
export function ActiveChips() {
  const f = useStore((s) => s.filters)
  const toggle = useStore((s) => s.toggle)
  const setFilter = useStore((s) => s.setFilter)
  const reset = useStore((s) => s.reset)

  const chips: { id: string; label: string; remove: () => void }[] = []
  for (const [key, labels] of LIST) {
    for (const v of f[key] as string[]) chips.push({ id: `${key}:${v}`, label: labels?.[v] ?? v, remove: () => toggle(key as 'stack', v) })
  }
  if (f.salaryMin) chips.push({ id: 'salary', label: `$${f.salaryMin / 1000}k+`, remove: () => setFilter('salaryMin', 0) })
  if (f.onlySalary) chips.push({ id: 'onlySalary', label: 'Con sueldo', remove: () => setFilter('onlySalary', false) })
  if (f.days) chips.push({ id: 'days', label: `Últimos ${f.days} d`, remove: () => setFilter('days', null) })
  if (f.savedOnly) chips.push({ id: 'saved', label: 'Guardadas', remove: () => setFilter('savedOnly', false) })

  if (!activeFilterCount(f)) return null

  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 lg:mx-0 lg:flex-wrap lg:px-0">
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((c) => (
          <m.button
            key={c.id}
            layout
            type="button"
            onClick={c.remove}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12, ease: 'easeIn' } }}
            transition={spring}
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-accent/15 pl-3 pr-2 text-[13px] text-accent-ink"
            aria-label={`Quitar filtro ${c.label}`}
          >
            {c.label}
            <XIcon width={14} height={14} />
          </m.button>
        ))}
        <m.button key="reset" layout transition={spring} type="button" onClick={reset} className="h-8 shrink-0 px-2 text-[13px] text-muted underline-offset-4 hover:text-fg hover:underline">
          Limpiar
        </m.button>
      </AnimatePresence>
    </div>
  )
}
