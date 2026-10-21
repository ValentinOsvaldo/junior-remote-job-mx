import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const SearchIcon = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const SlidersIcon = (p: P) => <svg {...base} {...p}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
export const XIcon = (p: P) => <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
export const ArrowUpRightIcon = (p: P) => <svg {...base} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>
export const ArrowLeftIcon = (p: P) => <svg {...base} {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
export const ChevronRightIcon = (p: P) => <svg {...base} {...p}><path d="m9 18 6-6-6-6" /></svg>
export const BookmarkIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
)
