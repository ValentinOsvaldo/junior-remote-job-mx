import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean; count?: number }

/** Toggle chip for filters. Uses aria-pressed so screen readers announce the state. */
export function Chip({ pressed, count, children, className = '', ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={!pressed && count === 0}
      className={`press inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150 disabled:opacity-35 ${
        pressed ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface text-fg hover:border-fg/40'
      } ${className}`}
      {...props}
    >
      {children}
      {count != null ? <span className={`font-mono text-[11px] ${pressed ? 'opacity-70' : 'text-muted'}`}>{count}</span> : null}
    </button>
  )
}

export function Tag({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'accent' }) {
  return (
    <span
      translate="no"
      className={`inline-flex h-6 items-center rounded-md px-1.5 font-mono text-[11px] leading-none ${
        tone === 'accent' ? 'bg-accent/15 text-accent-ink' : 'bg-fg/[0.06] text-muted'
      }`}
    >
      {children}
    </span>
  )
}
