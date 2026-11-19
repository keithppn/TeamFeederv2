// 02 — Staff workspace data. RLS limits every select to the caller's rooms.
import { fmtDay, parseKey, rangeLabel, type Room } from '@/lib/booking'
import { supabase } from '@/lib/supabase'

export type Status = 'pending' | 'approved' | 'declined'
export type WsRoom = Room & { active: boolean }
export type Booking = {
  id: string; tx: string; room_id: string; day: string; start_slot: number; end_slot: number
  name: string; dept: string; email: string; phone: string; purpose: string; attendees: number | null
  status: Status; reason: string; created_at: string; decided_at: string | null; created_by: string
}
export type Inquiry = {
  id: string; name: string; email: string; room_id: string | null; tx: string | null
  message: string; status: 'open' | 'answered'; response: string; created_at: string
}
export type MailRow = {
  id: string; kind: 'received' | 'approved' | 'declined'; booking_id: string | null; room_id: string
  to_email: string; tx: string; reason: string; created_at: string
}
export type AuditRow = { id: string; actor_name: string; text: string; created_at: string }
export type Admin = { id: string; name: string; email: string }
export type Assign = { user_id: string; room_id: string }

export type WsData = {
  rooms: WsRoom[]; assign: Assign[]; bookings: Booking[]; inquiries: Inquiry[]
  mail: MailRow[]; audit: AuditRow[]; admins: Admin[]
}

const none = Promise.resolve({ data: [] as never[] })

export async function loadWorkspace(isSuper: boolean): Promise<WsData> {
  const [rooms, assign, bookings, inquiries, mail, audit, admins] = await Promise.all([
    supabase.from('rooms').select('id, name, location, capacity, equipment, active').order('name'),
    supabase.from('room_admins').select('user_id, room_id'),
    supabase.from('bookings')
      .select('id, tx, room_id, day, start_slot, end_slot, name, dept, email, phone, purpose, attendees, status, reason, created_at, decided_at, created_by')
      .order('created_at', { ascending: false }),
    supabase.from('inquiries').select('id, name, email, room_id, tx, message, status, response, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('mail_log').select('id, kind, booking_id, room_id, to_email, tx, reason, created_at')
      .order('created_at', { ascending: false }).limit(50),
    isSuper ? supabase.from('audit_log').select('id, actor_name, text, created_at').order('created_at', { ascending: false }).limit(8) : none,
    isSuper ? supabase.rpc('list_admins') : none,
  ])
  return {
    rooms: (rooms.data ?? []) as WsRoom[],
    assign: (assign.data ?? []) as Assign[],
    bookings: (bookings.data ?? []) as Booking[],
    inquiries: (inquiries.data ?? []) as Inquiry[],
    mail: (mail.data ?? []) as MailRow[],
    audit: (audit.data ?? []) as AuditRow[],
    admins: (admins.data ?? []) as Admin[],
  }
}

type Msgs = { unavailable?: string; forbidden?: string }

// Calls a staff RPC. Returns [data, null] on success, or [null, a message for the user].
export async function rpcData<T>(fn: string, args: Record<string, unknown>, msgs: Msgs = {}): Promise<[T | null, string | null]> {
  const { data, error } = await supabase.rpc(fn, args)
  if (!error) return [data as T, null]
  const m = error.message
  if (m.includes('unavailable')) return [null, msgs.unavailable ?? 'That time overlaps an approved booking.']
  if (m.includes('forbidden')) return [null, msgs.forbidden ?? "You don't have access to that room."]
  if (m.startsWith('invalid: ')) {
    const t = m.slice('invalid: '.length)
    return [null, t.charAt(0).toUpperCase() + t.slice(1) + '.']
  }
  return [null, 'Something went wrong. Please try again.']
}

// Same, when only the error matters. Returns null on success.
export const callRpc = async (fn: string, args: Record<string, unknown>, msgs: Msgs = {}) =>
  (await rpcData(fn, args, msgs))[1]

export const whenOf = (b: Pick<Booking, 'day' | 'start_slot' | 'end_slot'>) =>
  `${fmtDay(parseKey(b.day))} · ${rangeLabel(b.start_slot, b.end_slot)}`

const pad = (n: number) => String(n).padStart(2, '0')
export const hhmm = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
