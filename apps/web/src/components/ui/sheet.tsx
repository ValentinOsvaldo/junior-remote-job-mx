import { useEffect, useRef, type ReactNode } from 'react'
import { XIcon } from './icons.tsx'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }

/** Bottom sheet on a native <dialog>: focus trap, Esc and backdrop for free. Motion lives in index.css (.sheet). */
export function Sheet({ open, onClose, title, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="absolute h-1 w-10 rounded-full bg-line left-1/2 top-2 -translate-x-1/2" aria-hidden />
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="press -mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-fg" aria-label="Cerrar">
            <XIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer ? <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
      </div>
    </dialog>
  )
}
