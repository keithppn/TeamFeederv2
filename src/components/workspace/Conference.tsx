// 02 — My Conference tab: counters, upcoming bookings, inquiries with replies.
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, inputCls, pillCls } from '@/components/form'
import { dkey } from '@/lib/booking'
import { callRpc, whenOf, type Booking, type Inquiry } from './data'
import { Chip, h3Cls, mutedCls, rowCls, Stat, Stats } from './ui'

export function Conference({ bookings, inquiries, rn, onChanged }: {
  bookings: Booking[]; inquiries: Inquiry[]; rn: (id: string | null) => string; onChanged: () => void
}) {
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const todayKey = dkey(new Date())
  const upcoming = bookings
    .filter((b) => b.status === 'approved' && b.day >= todayKey)
    .sort((a, b) => a.day.localeCompare(b.day) || a.start_slot - b.start_slot)

  const send = async (i: Inquiry) => {
    const text = (replies[i.id] ?? '').trim()
    if (!text) { toast('Write a reply first.'); return }
    setBusy(true)
    const err = await callRpc('reply_inquiry', { p_id: i.id, p_text: text })
    setBusy(false)
    if (err) { toast(err); return }
    toast('Reply saved.')
    onChanged()
  }

  return (
    <div className="flex flex-col gap-5">
      <Stats>
        <Stat value={bookings.filter((b) => b.status === 'pending').length} label="Pending requests" />
        <Stat value={upcoming.length} label="Upcoming approved" />
        <Stat value={inquiries.filter((i) => i.status === 'open').length} label="Open inquiries" />
      </Stats>

      <h3 className={h3Cls}>Today and upcoming bookings</h3>
      {upcoming.map((b) => (
        <div key={b.id} className={rowCls}>
          <div className="flex flex-[1_1_220px] flex-col gap-[3px]">
            <span className="font-bold">{whenOf(b)}</span>
            <span className="text-sm text-muted-foreground">{b.name} · {b.purpose}</span>
          </div>
          <Chip>{rn(b.room_id)}</Chip>
          <span className="font-mono text-sm tracking-wider">{b.tx}</span>
        </div>
      ))}
      {upcoming.length === 0 && <p className={mutedCls}>Nothing approved from today onward.</p>}

      <h3 className={h3Cls}>Inquiries</h3>
      {inquiries.map((i) => (
        <div key={i.id} className={`${rowCls} items-start`}>
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
            <span className="font-bold">{i.name} <span className="font-medium text-muted-foreground">· {i.email}</span></span>
            <span>{i.message}</span>
            {i.tx && <span className="font-mono text-[13px] text-muted-foreground">Refers to {i.tx}</span>}
            {i.status === 'answered' && <span className="text-sm text-muted-foreground">Reply: {i.response}</span>}
          </div>
          <Chip>{rn(i.room_id)}</Chip>
          {i.status === 'open' && (
            <div className="flex flex-[1_1_100%] flex-wrap items-end gap-2.5">
              <Field label="Reply" className="flex-[1_1_260px]">
                <Input className={inputCls} value={replies[i.id] ?? ''}
                  onChange={(e) => setReplies((r) => ({ ...r, [i.id]: e.target.value }))} />
              </Field>
              <Button className={pillCls} disabled={busy} onClick={() => send(i)}>Send reply and mark answered</Button>
            </div>
          )}
        </div>
      ))}
      {inquiries.length === 0 && <p className={mutedCls}>No inquiries for this selection.</p>}
    </div>
  )
}
