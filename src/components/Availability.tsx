// 05 — Room availability grid
import { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pillCls } from '@/components/form'
import type { Tracked } from '@/components/Tracker'
import {
  SLOTS, addDays, dkey, fmtDay, mondayOf, parseKey, rangeLabel, slotCell, slotLabel,
  type CellKind, type Room, type Slot,
} from '@/lib/booking'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const MAX_WEEKS = 7

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const wk = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`

const cellCls: Record<CellKind, string> = {
  open: 'bg-white shadow-[inset_0_0_0_1px_#C9CFDD] hover:bg-[#FDE3A9]',
  pending: 'bg-accent text-accent-foreground',
  booked: 'cursor-not-allowed bg-primary text-white',
  past: 'cursor-not-allowed bg-[#EFE6D3] text-muted-foreground',
}
const tone = {
  approved: { border: 'border-success', text: 'text-[#13692B]', msg: 'Successfully booked' },
  pending: { border: 'border-warning', text: 'text-[#8A5300]', msg: 'Pending approval' },
  declined: { border: 'border-destructive', text: 'text-destructive', msg: 'Declined' },
}
const tabCls = (on: boolean) =>
  cn('min-h-11 rounded-full px-[18px] text-[15px] font-bold', on ? 'bg-primary text-white' : 'bg-secondary')
const iconBtn = 'inline-flex size-11 items-center justify-center rounded-full bg-secondary hover:bg-[#FBE3B0] disabled:cursor-not-allowed disabled:opacity-55'

export function Availability({ rooms, room, onSelRoom, week, onWeek, tracked, onClearTracked, onPick, version }: {
  rooms: Room[]; room: Room | undefined; onSelRoom: (id: string) => void
  week: number; onWeek: (n: number) => void
  tracked: Tracked | null; onClearTracked: () => void
  onPick: (roomId: string, day: string, slot: number) => void
  version: number
}) {
  const [slots, setSlots] = useState<Slot[]>([])
  const today = new Date()
  const todayKey = dkey(today)
  const monday = addDays(mondayOf(today), 7 * week)
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i))
  const from = dkey(days[0])
  const to = dkey(days[4])

  useEffect(() => {
    if (!room) return
    let live = true
    supabase.rpc('room_slots', { p_room: room.id, p_from: from, p_to: to })
      .then(({ data }) => { if (live) setSlots((data as Slot[] | null) ?? []) })
    return () => { live = false }
  }, [room, from, to, version])

  const mine: Slot | null = tracked && room && tracked.room_id === room.id && tracked.status !== 'declined'
    ? { day: tracked.day, start_slot: tracked.start_slot, end_slot: tracked.end_slot, status: tracked.status }
    : null
  const t = tracked && tone[tracked.status]

  return (
    <section id="availability" className="px-[5vw] pt-12 sm:pt-[72px]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-5 rounded-[22px] bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="text-[clamp(28px,3vw,40px)] font-extrabold tracking-tight">Room availability</h2>
            <p className="font-medium text-muted-foreground">
              Open hours: Monday to Friday, {slotLabel(0)} – {slotLabel(SLOTS)}, in 30-minute slots. Pick an open slot to start a request.
            </p>
          </div>
          <div className="flex w-full items-center gap-2.5 sm:w-auto">
            <button className={iconBtn} aria-label="Previous week" disabled={week <= 0} onClick={() => onWeek(week - 1)}>
              <ChevronLeftIcon className="size-5" strokeWidth={2.4} aria-hidden="true" />
            </button>
            <span aria-live="polite" className="min-w-0 flex-1 text-center font-bold sm:min-w-[190px] sm:flex-none">
              {wk(days[0])} – {wk(days[4])}, {days[4].getFullYear()}
            </span>
            <button className={iconBtn} aria-label="Next week" disabled={week >= MAX_WEEKS} onClick={() => onWeek(week + 1)}>
              <ChevronRightIcon className="size-5" strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        </div>

        {tracked && t && (
          <div role="status" className={cn('flex flex-wrap items-center justify-between gap-x-7 gap-y-3.5 rounded-[18px] border-[3px] bg-white px-5 py-[18px]', t.border)}>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-bold text-muted-foreground">Tracked booking</span>
              <span className="font-mono text-xl font-extrabold tracking-wider">{tracked.tx}</span>
              <span className={cn('text-[17px] font-extrabold', t.text)}>{t.msg}</span>
            </div>
            <dl className="grid flex-[1_1_360px] grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-x-6 gap-y-2.5">
              {[
                ['Room', tracked.room_name],
                ['Date', fmtDay(parseKey(tracked.day))],
                ['Time', rangeLabel(tracked.start_slot, tracked.end_slot)],
                ['Department', tracked.dept],
                ['Purpose', tracked.purpose || '—'],
                ...(tracked.status === 'declined' ? [['Reason declined', tracked.reason || 'No reason recorded']] : []),
              ].map(([k, v]) => (
                <div key={k}><dt className="text-[13px] font-medium text-muted-foreground">{k}</dt><dd className="font-bold">{v}</dd></div>
              ))}
            </dl>
            <Button variant="outline" className={cn(pillCls, 'border-2 border-primary bg-transparent')} onClick={onClearTracked}>
              Clear
            </Button>
          </div>
        )}

        {rooms.length === 0 ? (
          <p className="rounded-2xl bg-secondary p-7 text-center font-semibold">No availability is currently listed.</p>
        ) : (
          <>
            <div role="group" aria-label="Choose a room" className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button key={r.id} aria-pressed={r.id === room?.id} className={tabCls(r.id === room?.id)} onClick={() => onSelRoom(r.id)}>
                  {r.name}
                </button>
              ))}
            </div>
            <ul aria-label="Legend" className="flex flex-wrap gap-x-[22px] gap-y-2.5 text-sm font-semibold">
              <li className="flex items-center gap-2"><span className="h-4 w-[22px] rounded-[5px] bg-white shadow-[inset_0_0_0_1px_#8A93A8]" />Available</li>
              <li className="flex items-center gap-2"><span className="h-4 w-[22px] rounded-[5px] bg-accent" />Pending request</li>
              <li className="flex items-center gap-2"><span className="h-4 w-[22px] rounded-[5px] bg-primary" />Booked</li>
            </ul>
            {room && (
              <div className="overflow-x-auto pb-1.5">
                <div className="flex min-w-[460px] flex-col gap-1 sm:min-w-[640px]">
                  <div className="grid grid-cols-[56px_repeat(5,minmax(76px,1fr))] sm:grid-cols-[84px_repeat(5,minmax(96px,1fr))] gap-1">
                    <span className="sticky left-0 bg-card" />
                    {days.map((d) => (
                      <div key={dkey(d)} className="py-1.5 text-center font-extrabold">
                        {fmtDay(d).split(',')[0]}<br />
                        <span className="text-[13px] font-semibold text-muted-foreground">{wk(d)}</span>
                      </div>
                    ))}
                  </div>
                  {Array.from({ length: SLOTS }, (_, s) => (
                    <div key={s} className="grid grid-cols-[56px_repeat(5,minmax(76px,1fr))] sm:grid-cols-[84px_repeat(5,minmax(96px,1fr))] items-center gap-1">
                      <span className="sticky left-0 z-10 bg-card pr-2 text-right text-xs font-semibold text-muted-foreground">{slotLabel(s)}</span>
                      {days.map((d) => {
                        const day = dkey(d)
                        const c = slotCell(slots, day, s, todayKey, mine)
                        return (
                          <button key={day} aria-label={c.aria} disabled={c.disabled}
                            onClick={() => onPick(room.id, day, s)}
                            className={cn('min-h-9 w-full rounded-lg text-[11px] font-bold', cellCls[c.kind],
                              c.mine && 'outline-3 outline-offset-1', c.mine === 'approved' && 'outline-success', c.mine === 'pending' && 'outline-[#8A5300]')}>
                            {c.text}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// Week index (0 = this week) of a day, or null if outside the grid's range.
export const weekOf = (day: string) => {
  const n = Math.round((mondayOf(parseKey(day)).getTime() - mondayOf(new Date()).getTime()) / (7 * 86_400_000))
  return n >= 0 && n <= MAX_WEEKS ? n : null
}
