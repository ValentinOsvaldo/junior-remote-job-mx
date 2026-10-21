import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { SearchIcon, XIcon } from '../../components/ui/icons.tsx'
import { hasToken, toggleToken } from '../../lib/search.ts'
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

  const toggleExample = (ex: string) => {
    setQ(toggleToken(q, ex))
    input.current?.focus()
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={input}
          type="search"
          name="q"
          aria-label="Buscar vacantes"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setQ(''), e.currentTarget.blur())}
          placeholder="react, python, becario…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <Button variant="ghost" size="icon-sm" onClick={() => setQ('')} aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 -translate-y-1/2">
            <XIcon width={16} height={16} />
          </Button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 font-mono text-[11px] text-muted-foreground sm:block">/</kbd>
        )}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" aria-label="Ejemplos de búsqueda">
        {EXAMPLES.map((ex) => (
          <Toggle
            key={ex}
            size="sm"
            pressed={hasToken(q, ex)}
            onPressedChange={() => toggleExample(ex)}
            className="h-7 min-w-0 shrink-0 rounded-md px-2 font-mono text-[11px] font-normal text-muted-foreground ring-1 ring-border hover:bg-transparent hover:text-foreground data-[state=on]:bg-primary/15 data-[state=on]:text-primary-ink data-[state=on]:ring-primary/40"
          >
            {ex}
          </Toggle>
        ))}
      </div>
    </div>
  )
}
