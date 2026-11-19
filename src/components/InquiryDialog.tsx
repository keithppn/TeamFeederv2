// 11 — Inquiry dialog
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BrDialogContent, Field, FormError, inputCls, pillCls, selectCls } from '@/components/form'
import { EMAIL_RE, TX_RE, type Room } from '@/lib/booking'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const empty = { name: '', email: '', roomId: '', tx: '', message: '' }
type Form = typeof empty

export function InquiryDialog({ open, onOpenChange, rooms }: {
  open: boolean; onOpenChange: (open: boolean) => void; rooms: Room[]
}) {
  const [f, setF] = useState<Form>(empty)
  const [err, setErr] = useState<Partial<Record<keyof Form | 'form', string>>>({})
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) { setF(empty); setErr({}); setDone(false) }
  }, [open])

  const set = (k: keyof Form) => (ev: { target: { value: string } }) => setF((p) => ({ ...p, [k]: ev.target.value }))

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const tx = f.tx.trim().toUpperCase()
    const e: typeof err = {}
    if (!f.name.trim()) e.name = 'Please enter your name.'
    if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email, like name@company.com.'
    if (tx && !TX_RE.test(tx)) e.tx = 'That does not look like a transaction number (BK- and 10 characters).'
    if (!f.message.trim()) e.message = 'Please write your question.'
    setErr(e)
    if (Object.keys(e).length) return
    setSending(true)
    const { error } = await supabase.from('inquiries').insert({
      name: f.name.trim(), email: f.email.trim(), room_id: f.roomId || null, tx: tx || null, message: f.message.trim(),
    })
    setSending(false)
    if (error) setErr({ form: 'Your inquiry could not be sent. Please try again.' })
    else setDone(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BrDialogContent title="Send an inquiry" description="Ask about a room, or ask for help finding a lost transaction number.">
        {done ? (
          <div role="status" className="flex flex-col gap-3.5">
            <p className="text-lg font-bold">Thanks, your inquiry was sent.</p>
            <p className="font-medium text-muted-foreground">We will reply to {f.email.trim()}.</p>
            <Button variant="outline" className={cn(pillCls, 'border-2 border-primary bg-transparent')} onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
            <Field label="Your name" error={err.name}>
              <Input className={inputCls} autoComplete="name" value={f.name} onChange={set('name')} />
            </Field>
            <Field label="Email" error={err.email}>
              <Input className={inputCls} type="email" autoComplete="email" value={f.email} onChange={set('email')} />
            </Field>
            <Field label="Room (optional)">
              <select className={selectCls} value={f.roomId} onChange={set('roomId')}>
                <option value="">General question</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Transaction number (optional)" error={err.tx}>
              <Input className={cn(inputCls, 'font-mono tracking-wider')} placeholder="BK-XXXXXXXXXX" value={f.tx} onChange={set('tx')} />
            </Field>
            <Field label="Message" error={err.message}>
              <Textarea className="min-h-24 rounded-xl border-[1.5px] border-input bg-white px-3.5 py-3 text-base font-medium md:text-base"
                value={f.message} onChange={set('message')} />
            </Field>
            <FormError>{err.form}</FormError>
            <Button type="submit" disabled={sending} className={pillCls}>{sending ? 'Sending…' : 'Send inquiry'}</Button>
          </form>
        )}
      </BrDialogContent>
    </Dialog>
  )
}
