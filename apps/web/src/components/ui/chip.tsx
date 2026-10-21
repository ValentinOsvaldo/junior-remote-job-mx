import type { ComponentProps, ReactNode } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentProps<typeof Toggle>, 'pressed'> & { pressed: boolean; count?: number }

/** Filter chip: shadcn <Toggle> (aria-pressed + data-state) styled as a pill with a facet count. */
export function Chip({ pressed, count, children, className, ...props }: Props) {
  return (
    <Toggle
      variant="outline"
      pressed={pressed}
      disabled={!pressed && count === 0}
      className={cn(
        'h-9 rounded-full border-border bg-card px-3 font-normal text-foreground shadow-none hover:border-foreground/40 hover:bg-card hover:text-foreground disabled:opacity-35',
        'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      {children}
      {count != null ? <span className={cn('font-mono text-[11px]', pressed ? 'opacity-70' : 'text-muted-foreground')}>{count}</span> : null}
    </Toggle>
  )
}

export function Tag({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'accent' }) {
  return (
    <span
      translate="no"
      className={`inline-flex h-6 items-center rounded-md px-1.5 font-mono text-[11px] leading-none ${
        tone === 'accent' ? 'bg-primary/15 text-primary-ink' : 'bg-foreground/[0.06] text-muted-foreground'
      }`}
    >
      {children}
    </span>
  )
}
