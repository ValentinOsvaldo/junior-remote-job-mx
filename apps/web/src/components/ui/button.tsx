import type { ButtonHTMLAttributes } from 'react'

const VARIANT = {
  primary: 'bg-accent text-accent-fg hover:bg-accent/90',
  outline: 'border border-line bg-surface text-fg hover:border-fg/40',
  ghost: 'text-muted hover:text-fg hover:bg-surface',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANT }

export function Button({ variant = 'outline', className = '', ...props }: Props) {
  return (
    <button
      type="button"
      className={`press inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors duration-150 disabled:opacity-50 ${VARIANT[variant]} ${className}`}
      {...props}
    />
  )
}
