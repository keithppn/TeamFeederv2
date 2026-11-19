// Shared look for the staff workspace, from the prototype's .row / .badge / .chip classes.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Status } from './data'

export const rowCls = 'flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border-[1.5px] border-border p-4'
export const h3Cls = 'text-xl font-extrabold'
export const mutedCls = 'font-semibold text-muted-foreground'
export const ghostCls = 'border-2 border-primary bg-transparent'

const badge = {
  pending: 'bg-accent text-accent-foreground',
  approved: 'bg-primary text-white',
  declined: 'bg-[#E9E1D1] line-through',
}

export function Badge({ tone, children }: { tone: Status; children: ReactNode }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-xs font-bold', badge[tone])}>{children}</span>
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[13px] font-semibold">{children}</span>
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-[18px] bg-secondary p-[18px]">
      <div className="text-4xl font-extrabold">{value}</div>
      <div className="font-semibold">{label}</div>
    </div>
  )
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">{children}</div>
}
