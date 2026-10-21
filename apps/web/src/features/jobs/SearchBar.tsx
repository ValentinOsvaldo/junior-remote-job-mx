import { useEffect, useRef } from 'react'
import { SearchIcon, XIcon } from '../../components/ui/icons.tsx'
import { useStore } from '../../store/filters.ts'

const EXAMPLES = ['react -angular', '"home office"', 'stack:python', 'ciudad:gdl', 'sueldo:>15k', 'nivel:becario', 'modo:remoto']

export function SearchBar() {
  const q = useStore((s) => s.q)
  const setQ = useStore((s) => s.setQ)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const addExample = (ex: string) => {
    setQ(q.trim() ? `${q.trim()} ${ex}` : ex)
    input.current?.focus()
  }

  return (
    <div className="min-w-0 flex-1">
      <label className="relative block">
        <span className="sr-only">Buscar vacantes</span>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setQ(''), e.currentTarget.blur())}
          placeholder="react, python, becario…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-[16px] text-fg outline-none transition-colors duration-150 placeholder:text-muted focus:border-accent sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button type="button" onClick={() => setQ('')} aria-label="Limpiar búsqueda" className="press absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg">
            <XIcon width={16} height={16} />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-muted sm:block">/</kbd>
        )}
      </label>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" aria-label="Ejemplos de búsqueda">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => addExample(ex)} className="press shrink-0 rounded-md px-2 py-1 font-mono text-[11px] text-muted ring-1 ring-line hover:text-fg">
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
