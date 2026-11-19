// 10 — Booking drawer (request a room)
import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BrDialogContent, Field, FormError, MailPreviewBox, inputCls, pillCls, selectCls } from '@/components/form'
import {
  SLOTS, buildMailPreview, dkey, durOptions, fmtDay, nextWeekday, parseKey, rangeLabel, startOptions, validateBooking,
  type BookingForm, type MailPreview, type Room,
} from '@/lib/booking'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Errors = ReturnType<typeof validateBooking> & { conflict?: string; form?: string }
type Conf = { tx: string; email: string; summary: string }

const blank = (roomId: string): BookingForm => ({
  roomId, day: dkey(nextWeekday(new Date())), start: '4', dur: '2', // 10:00, 1 hour
  name: '', dept: '', email: '', phone: '', purpose: '', attendees: '',
})

export function BookingDialog({ open, onOpenChange, rooms }: {
  open: boolean; onOpenChange: (open: boolean) => void; rooms: Room[]
}) {
  const [f, setF] = useState<BookingForm>(() => blank(''))
  const [err, setErr] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [mail, setMail] = useState<MailPreview | null>(null)
  const [conf, setConf] = useState<Conf | null>(null)
  const [copyMsg, setCopyMsg] = useState('')
  const [pendingHere, setPendingHere] = useState(false)

  // Fresh form each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setF(blank(rooms[0]?.id ?? '')); setErr({}); setMail(null); setConf(null); setCopyMsg(''); setSubmitting(false)
  }, [open, rooms])

  const room = rooms.find((r) => r.id === f.roomId)
  const s = parseInt(f.start, 10)
  const e = Math.min(SLOTS, s + parseInt(f.dur, 10))

  useEffect(() => {
    if (!open || !room || !f.day) return
    let live = true
    supabase.rpc('pending_overlap', { p_room: room.id, p_day: f.day, p_start: s, p_end: e })
      .then(({ data }) => { if (live) setPendingHere(data === true) })
    return () => { live = false }
  }, [open, room, f.day, s, e])

  const set = (k: keyof BookingForm) => (ev: { target: { value: string } }) => setF((p) => ({ ...p, [k]: ev.target.value }))
  const summary = `${room?.name ?? 'Choose a room'}${f.day ? ` · ${fmtDay(parseKey(f.day))}` : ''} · ${rangeLabel(s, e)}`

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (submitting) return
    const v = validateBooking(f, room)
    if (Object.keys(v).length || !room) { setErr(v); return }
    setSubmitting(true); setErr({})
    const { data, error } = await supabase.rpc('create_booking', {
      p_room: room.id, p_day: f.day, p_start: s, p_end: e,
      p_name: f.name.trim(), p_dept: f.dept.trim(), p_email: f.email.trim(),
      p_phone: f.phone.trim(), p_purpose: f.purpose.trim(),
      p_attendees: f.attendees.trim() ? parseInt(f.attendees, 10) : null,
    })
    setSubmitting(false)
    const who = { name: f.name.trim(), email: f.email.trim().toLowerCase(), roomName: room.name, day: f.day, start: s, end: e }
    if (error) {
      if (error.message.includes('unavailable')) {
        setMail(buildMailPreview('unavailable', who))
        setErr({ conflict: 'That schedule is no longer available. No booking was made. Please choose another time.' })
      } else {
        setErr({ form: 'Something went wrong sending your request. Please check the details and try again.' })
      }
      return
    }
    const tx = data as string
    setMail(buildMailPreview('received', { ...who, tx }))
    setConf({ tx, email: who.email, summary })
  }

  const copyTx = async () => {
    try {
      await navigator.clipboard.writeText(conf?.tx ?? '')
      setCopyMsg('Copied to clipboard.')
    } catch {
      setCopyMsg('Copy was blocked. Please select and copy the number above.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BrDialogContent title={conf ? 'Booking request sent' : 'Request a room'} description={conf ? conf.summary : summary}>
        {!conf ? (
          <form noValidate onSubmit={submit} className="flex flex-col gap-4">
            {pendingHere && (
              <p className="rounded-xl bg-[#FDE3A9] px-3.5 py-3 text-sm font-semibold">
                Another request is already pending for this time. You can still send yours; an Admin will decide.
              </p>
            )}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
              <Field label="Room">
                <select className={selectCls} value={f.roomId} onChange={set('roomId')}>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} (seats {r.capacity})</option>)}
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
            </div>
            <FormError>{err.time}</FormError>
            <Field label="Your name" error={err.name}>
              <Input className={inputCls} autoComplete="name" value={f.name} onChange={set('name')} />
            </Field>
            <Field label="Gmail / email" error={err.email}
              hint="We email this address when your request is received, approved or declined. You also use it to track your booking.">
              <Input className={inputCls} type="email" autoComplete="email" placeholder="you@gmail.com" value={f.email} onChange={set('email')} />
            </Field>
            <Field label="Department" error={err.dept}>
              <Input className={inputCls} value={f.dept} onChange={set('dept')} />
            </Field>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
              <Field label="Phone (optional)" error={err.phone}>
                <Input className={inputCls} type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
              </Field>
              <Field label="Attendees (optional)" error={err.attendees}>
                <Input className={inputCls} inputMode="numeric" value={f.attendees} onChange={set('attendees')} />
              </Field>
            </div>
            <Field label="Purpose (optional)">
              <Input className={inputCls} value={f.purpose} onChange={set('purpose')} />
            </Field>
            <FormError>{err.conflict ?? err.form}</FormError>
            {mail && <MailPreviewBox mail={mail} label="Email preview. This prototype does not actually send mail." />}
            <Button type="submit" disabled={submitting} className="h-[60px] rounded-full px-[34px] text-lg font-bold">
              {submitting ? 'Sending…' : 'Send booking request'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-[18px]">
            <div className="flex items-center gap-2.5 text-lg font-bold">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent">
                <CheckIcon className="size-5" strokeWidth={3} aria-hidden="true" />
              </span>
              Request sent. It is now pending.
            </div>
            <div className="flex flex-col gap-2.5 rounded-[20px] bg-secondary p-[22px]">
              <span className="font-semibold">Your transaction number</span>
              <span className="break-all font-mono text-[clamp(24px,5vw,34px)] font-extrabold tracking-wider">{conf.tx}</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button className={pillCls} onClick={copyTx}>
                  <CopyIcon className="size-[18px]" aria-hidden="true" /> Copy number
                </Button>
                <span role="status" className="text-sm font-semibold">{copyMsg}</span>
              </div>
            </div>
            {mail && <MailPreviewBox mail={mail} label="Confirmation email preview. This prototype does not actually send mail." />}
            <p className="font-semibold leading-relaxed">
              Keep this number. Type it into the Track field on the home page to check your booking. We also emailed it
              to <span className="underline">{conf.email}</span>.
            </p>
            <Button variant="outline" className={cn(pillCls, 'border-2 border-primary bg-transparent')} onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </BrDialogContent>
    </Dialog>
  )
}
