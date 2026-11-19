// 02 Staff workspace: emails the Client about their booking (received / approved / declined).
// Body: { booking_id }. Sends the latest unsent mail_log row for that booking.
// The caller's JWT is used for the read, so RLS limits staff to their own rooms.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'
import nodemailer from 'npm:nodemailer@6.9.16'
import { buildMailPreview } from '../../../src/lib/booking.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const env = (k: string) => Deno.env.get(k) ?? ''
// Supabase blocks outbound port 587 from edge functions, so use 465 (implicit TLS).
const smtp = nodemailer.createTransport({
  host: env('EMAIL_SERVER') || 'smtp.gmail.com',
  port: Number(env('EMAIL_PORT') || 465),
  secure: true,
  auth: { user: env('EMAIL_USER'), pass: env('EMAIL_PASSWORD') },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return reply(200, 'ok')
  const auth = req.headers.get('Authorization') ?? ''
  const { booking_id } = await req.json().catch(() => ({}))
  if (typeof booking_id !== 'string') return reply(400, { error: 'booking_id required' })

  const asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: auth } } })
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

  // Staff only: RLS returns nothing for bookings outside the caller's rooms.
  const { data: b } = await asUser.from('bookings')
    .select('id, name, email, day, start_slot, end_slot, tx, reason, room_id').eq('id', booking_id).maybeSingle()
  if (!b) return reply(403, { error: 'forbidden' })
  const { data: mail } = await asUser.from('mail_log').select('id, kind, to_email, reason')
    .eq('booking_id', b.id).is('sent_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!mail) return reply(200, { sent: false, error: 'Nothing to send.' })

  // Claim the row first so two clicks never send twice.
  const { data: claimed } = await admin.from('mail_log').update({ sent_at: new Date().toISOString(), error: '' })
    .eq('id', mail.id).is('sent_at', null).select('id')
  if (!claimed?.length) return reply(200, { sent: false, error: 'Already sent.' })

  const { data: room } = await asUser.from('rooms').select('name').eq('id', b.room_id).maybeSingle()
  const m = buildMailPreview(mail.kind, { name: b.name, email: mail.to_email, roomName: room?.name ?? 'your room',
    day: b.day, start: b.start_slot, end: b.end_slot, tx: b.tx, reason: mail.reason })
  try {
    await smtp.sendMail({ from: `BookRoom <${env('EMAIL_USER')}>`, to: m.to, subject: m.subject, text: m.body })
    return reply(200, { sent: true })
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    await admin.from('mail_log').update({ sent_at: null, error }).eq('id', mail.id)
    return reply(200, { sent: false, error })
  }
})
