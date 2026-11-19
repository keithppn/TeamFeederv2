// 03 — Booking tracker (part of the hero)
import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { fmtDay, normalizeTrackCode, parseKey, rangeLabel } from '@/lib/booking'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Row = {
  status: 'pending' | 'approved' | 'declined'
  room_id: string; room_name: string; day: string; start_slot: number; end_slot: number
  dept: string; purpose: string; reason: string
}
export type Tracked = Row & { tx: string }

const MAX_MISSES = 5

// onTracked reports the found booking (or null) so 05 Availability can show it.
export function Tracker({ onTracked }: { onTracked?: (t: Tracked | null) => void }) {
  const [code, setCode] = useState('')
  const [misses, setMisses] = useState<string[]>([])
  const [nudge, setNudge] = useState(false)
  const [found, setFound] = useState<Row | null | undefined>(undefined) // undefined = not looked up
  const latest = useRef('')
  const lockTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const locked = misses.length >= MAX_MISSES

  useEffect(() => () => clearTimeout(lockTimer.current), [])

  const onChange = async (raw: string) => {
    const next = normalizeTrackCode(raw)
    setCode(next)
    setNudge(false)
    setFound(undefined)
    onTracked?.(null)
    latest.current = next
    if (next.length !== 10 || locked) return
    const { data } = await supabase.rpc('track_booking', { p_tx: `BK-${next}` })
    if (latest.current !== next) return // a newer keystroke won
    const row = (data as Row[] | null)?.[0] ?? null
    setFound(row)
    onTracked?.(row && { ...row, tx: `BK-${next}` })
    if (!row) {
      // shortcut: lockout is client-side only (a reload resets it); a real limit needs an edge function or DB rate limit.
      setMisses((m) => {
        if (m.includes(next)) return m
        const n = [...m, next]
        if (n.length === MAX_MISSES) {
          clearTimeout(lockTimer.current)
          lockTimer.current = setTimeout(() => setMisses([]), 60_000)
        }
        return n
      })
    }
  }

  const onSearch = () => {
    if (code.length < 10) setNudge(true)
    inputRef.current?.focus()
  }

  let tone: 'idle' | 'ok' | 'pend' | 'bad' = 'idle'
  let msg = ''
  let detail = ''
  if (locked) {
    tone = 'bad'; msg = 'Too many attempts. Please wait a minute and try again.'
  } else if (nudge && code.length < 10) {
    tone = 'bad'; msg = 'Enter all 10 characters, then search'
  } else if (code && code.length < 10) {
    msg = `${code.length} of 10 characters`
  } else if (found === null) {
    tone = 'bad'; msg = 'Booking not found'; detail = 'Check the number and try again.'
  } else if (found) {
    const place = `${found.room_name} · ${fmtDay(parseKey(found.day))} · ${rangeLabel(found.start_slot, found.end_slot)}`
    if (found.status === 'approved') { tone = 'ok'; msg = 'Successfully booked'; detail = place }
    else if (found.status === 'pending') { tone = 'pend'; msg = 'Pending approval'; detail = place }
    else { tone = 'bad'; msg = 'Declined'; detail = place + (found.reason ? ` · Reason: ${found.reason}` : '') }
  }

  const ring = {
    idle: 'border-primary',
    ok: 'border-success shadow-[0_0_0_4px_rgba(30,142,62,.22)]',
    pend: 'border-warning shadow-[0_0_0_4px_rgba(245,166,35,.3)]',
    bad: 'border-destructive shadow-[0_0_0_4px_rgba(179,38,30,.18)]',
  }[tone]
  const msgColor = { idle: 'text-muted-foreground', ok: 'text-[#13692B]', pend: 'text-[#8A5300]', bad: 'text-destructive' }[tone]

  return (
    <div id="track" className="flex w-full flex-col gap-2 sm:max-w-[400px] sm:flex-[1_1_300px]">
      <label htmlFor="track-input" className="text-[15px] font-bold leading-[22px]">Track your booking: type the 10 characters after BK-</label>
      <div className="relative">
        <span aria-hidden="true" className="absolute inset-y-0 left-[26px] flex items-center text-base font-extrabold tracking-wider text-muted-foreground">BK-</span>
        <input
          id="track-input" ref={inputRef} type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false}
          placeholder="7F3K9Q2M4X" aria-describedby="track-msg" aria-invalid={tone === 'bad'}
          value={code} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSearch() } }}
          className={cn(
            'h-[60px] w-full rounded-full border-[3px] bg-white pl-[70px] pr-[60px] text-base font-bold uppercase tracking-wider outline-none placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground',
            ring,
          )}
        />
        <button type="button" aria-label="Check booking status" onClick={onSearch}
          className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full bg-primary text-white">
          <SearchIcon className="size-[22px]" strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
      <p id="track-msg" role="status" aria-live="polite" className={cn('pl-1.5 text-[17px] font-extrabold empty:hidden', msgColor)}>{msg}</p>
      {detail && <p className="pl-1.5 text-sm font-semibold text-muted-foreground">{detail}</p>}
    </div>
  )
}
