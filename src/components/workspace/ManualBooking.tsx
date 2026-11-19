// 02 — Manual booking tab: staff create an approved booking directly.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FormError, inputCls, pillCls, selectCls } from '@/components/form'
import {
  SLOTS, dkey, durOptions, fmtDay, nextWeekday, parseKey, rangeLabel, startOptions, validateBooking, type BookingForm,
} from '@/lib/booking'
import { rpcData, type WsRoom } from './data'

const person = { name: '', dept: '', email: '', phone: '', purpose: '', attendees: '' }

export function ManualBooking({ rooms, onChanged }: { rooms: WsRoom[]; onChanged: () => void }) {
  const [f, setF] = useState<BookingForm>(() => ({
    roomId: '', day: dkey(nextWeekday(new Date())), start: '2', dur: '2', ...person,
  }))
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ tx: string; summary: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const roomId = f.roomId || rooms[0]?.id || ''
  const room = rooms.find((r) => r.id === roomId)
  const set = (k: keyof BookingForm) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!room) { setError('You can only create bookings for rooms assigned to you.'); setDone(null); return }
    const v = validateBooking({ ...f, roomId }, room)
    const first = Object.values(v)[0]
    if (first) { setError(first); setDone(null); return }
    const s = parseInt(f.start, 10)
    const end = Math.min(SLOTS, s + parseInt(f.dur, 10))
    setBusy(true)
    const [tx, err] = await rpcData<string>('staff_create_booking', {
      p_room: roomId, p_day: f.day, p_start: s, p_end: end,
      p_name: f.name.trim(), p_dept: f.dept.trim(), p_email: f.email.trim(),
      p_phone: f.phone.trim(), p_purpose: f.purpose.trim(),
      p_attendees: f.attendees.trim() ? parseInt(f.attendees, 10) : null,
    }, {
      unavailable: 'That schedule is unavailable: it overlaps an approved booking.',
      forbidden: 'You can only create bookings for rooms assigned to you.',
    })
    setBusy(false)
    if (err || !tx) { setError(err ?? 'Something went wrong. Please try again.'); setDone(null); return }
    setError('')
    setDone({ tx, summary: `${room.name} · ${fmtDay(parseKey(f.day))} · ${rangeLabel(s, end)}` })
    setF((p) => ({ ...p, ...person }))
    onChanged()
  }

  return (
    <form noValidate onSubmit={submit} className="flex max-w-[760px] flex-col gap-4">
      <p className="font-medium text-muted-foreground">
        Create a booking directly. It is saved as approved and gets a transaction number to give to the Client.
        You can only pick rooms assigned to you.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        <Field label="Room">
          <select className={selectCls} value={roomId} onChange={set('roomId')}>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <Input className={inputCls} type="date" min={dkey(new Date())} value={f.day} onChange={set('day')} />
        </Field>
        <Field label="Start">
          <select className={selectCls} value={f.start} onChange={set('start')}>
            {startOptions.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Length">
          <select className={selectCls} value={f.dur} onChange={set('dur')}>
            {durOptions.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Name"><Input className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <Field label="Department"><Input className={inputCls} value={f.dept} onChange={set('dept')} /></Field>
        <Field label="Email"><Input className={inputCls} type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone"><Input className={inputCls} type="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Attendees"><Input className={inputCls} inputMode="numeric" value={f.attendees} onChange={set('attendees')} /></Field>
        <Field label="Purpose"><Input className={inputCls} value={f.purpose} onChange={set('purpose')} /></Field>
      </div>
      <FormError>{error}</FormError>
      <div><Button type="submit" className={pillCls} disabled={busy}>Create approved booking</Button></div>
      {done && (
        <div className="flex flex-col gap-1.5 rounded-[18px] bg-secondary p-[18px]">
          <span className="font-semibold">Booking created. Give this transaction number to the Client:</span>
          <span className="font-mono text-[28px] font-extrabold tracking-wider">{done.tx}</span>
          <span className="text-muted-foreground">{done.summary}</span>
        </div>
      )}
    </form>
  )
}
