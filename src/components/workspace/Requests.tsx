// 02 — Requests tab: approve / decline, plus the email log.
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, inputCls, pillCls, selectCls } from '@/components/form'
import { buildMailPreview } from '@/lib/booking'
import { cn } from '@/lib/utils'
import { callRpc, hhmm, whenOf, type Booking, type MailRow } from './data'
import { Badge, Chip, ghostCls, h3Cls, mutedCls, rowCls } from './ui'

const STATUS_LABEL = { pending: 'Pending', approved: 'Approved', declined: 'Declined' }
const MAIL_BADGE = {
  received: ['pending', 'Received'], approved: ['approved', 'Approved'], declined: ['declined', 'Declined'],
} as const

export function Requests({ bookings, mail, rn, onChanged }: {
  bookings: Booking[]; mail: MailRow[]; rn: (id: string | null) => string; onChanged: () => void
}) {
  const [status, setStatus] = useState<'all' | Booking['status']>('all')
  const [q, setQ] = useState('')
  const [declining, setDeclining] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const needle = q.trim().toLowerCase()
  const rows = bookings.filter((b) => (status === 'all' || b.status === status)
    && (!needle || b.tx.toLowerCase().includes(needle) || b.name.toLowerCase().includes(needle)))

  const approve = async (b: Booking) => {
    setBusy(true)
    const err = await callRpc('approve_booking', { p_id: b.id }, {
      unavailable: "Can't approve: this time now conflicts with an approved booking.",
    })
    setBusy(false)
    if (err) { toast(err); return }
    toast(`Approved ${b.tx}. The time now shows as Booked. Email queued for ${b.email}.`)
    onChanged()
  }

  const decline = async (b: Booking) => {
    if (!reason.trim()) { toast('Please add a reason so the Client knows why.'); return }
    setBusy(true)
    const err = await callRpc('decline_booking', { p_id: b.id, p_reason: reason.trim() })
    setBusy(false)
    if (err) { toast(err); return }
    setDeclining(null); setReason('')
    toast(`Declined ${b.tx}. Email queued for ${b.email}.`)
    onChanged()
  }

  const byId = new Map(bookings.map((b) => [b.id, b]))
  const log = mail.slice(0, 6) // shortcut: last 6 only, as in the prototype; confirm with stakeholders.

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        <Field label="Status" className="flex-[0_1_200px]">
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All</option><option value="pending">Pending</option>
            <option value="approved">Approved</option><option value="declined">Declined</option>
          </select>
        </Field>
        <Field label="Search by transaction number or name" className="flex-[1_1_260px]">
          <Input className={inputCls} type="search" placeholder="BK-… or name" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
      </div>

      {rows.map((b) => (
        <div key={b.id} className={rowCls}>
          <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
            <span className="font-mono font-bold tracking-wider">{b.tx}</span>
            <span className="font-semibold">{b.name} · {b.dept}</span>
            <span className="text-sm text-muted-foreground">{whenOf(b)}</span>
            <span className="text-sm text-muted-foreground">{b.purpose}</span>
          </div>
          <Chip>{rn(b.room_id)}</Chip>
          <Badge tone={b.status}>{STATUS_LABEL[b.status]}</Badge>
          {b.status === 'pending' && declining !== b.id && (
            <div className="flex flex-wrap gap-2">
              <Button className={pillCls} disabled={busy} onClick={() => approve(b)}>Approve</Button>
              <Button variant="outline" className={cn(pillCls, ghostCls)} disabled={busy}
                onClick={() => { setDeclining(b.id); setReason('') }}>Decline</Button>
            </div>
          )}
          {b.status === 'declined' && (
            <span className="flex-[1_1_200px] text-sm text-muted-foreground">Reason: {b.reason || 'No reason recorded'}</span>
          )}
          {declining === b.id && (
            <div className="flex flex-[1_1_100%] flex-wrap items-end gap-2.5">
              <Field label="Reason for declining (shown to the Client)" className="flex-[1_1_260px]">
                <Input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <Button className={pillCls} disabled={busy} onClick={() => decline(b)}>Confirm decline</Button>
              <Button variant="outline" className={cn(pillCls, ghostCls)} onClick={() => { setDeclining(null); setReason('') }}>Cancel</Button>
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && (
        <p className="rounded-2xl bg-secondary p-7 text-center font-semibold text-muted-foreground">No requests match these filters.</p>
      )}

      <h3 className={cn(h3Cls, 'mt-2')}>Email log</h3>
      <p className="text-[13px] font-medium text-muted-foreground">
        Prototype only: these are the emails the system would send to Clients. Nothing is actually delivered.
      </p>
      {log.map((m) => {
        const b = m.booking_id ? byId.get(m.booking_id) : undefined
        const subject = b
          ? buildMailPreview(m.kind, { name: b.name, email: m.to_email, roomName: rn(m.room_id), day: b.day,
            start: b.start_slot, end: b.end_slot, tx: m.tx, reason: m.reason }).subject
          : m.tx
        const [tone, label] = MAIL_BADGE[m.kind]
        return (
          <div key={m.id} className={rowCls}>
            <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[3px]">
              <span className="font-bold">{subject}</span>
              <span className="text-sm text-muted-foreground">To {m.to_email} · {hhmm(m.created_at)}</span>
            </div>
            <Badge tone={tone}>{label}</Badge>
          </div>
        )
      })}
      {log.length === 0 && <p className={mutedCls}>No emails yet.</p>}
    </div>
  )
}
