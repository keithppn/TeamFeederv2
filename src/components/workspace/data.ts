// 02 — Staff workspace data. RLS limits every select to the caller's rooms.
import type { Room } from '@/lib/booking'
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

// Calls a staff RPC. Returns null on success, or a message for the user.
export async function callRpc(fn: string, args: Record<string, unknown>, msgs: { unavailable?: string; forbidden?: string } = {}) {
  const { error } = await supabase.rpc(fn, args)
  if (!error) return null
  const m = error.message
  if (m.includes('unavailable')) return msgs.unavailable ?? 'That time overlaps an approved booking.'
  if (m.includes('forbidden')) return msgs.forbidden ?? "You don't have access to that room."
  if (m.startsWith('invalid: ')) {
    const t = m.slice('invalid: '.length)
    return t.charAt(0).toUpperCase() + t.slice(1) + '.'
  }
  return 'Something went wrong. Please try again.'
}

const pad = (n: number) => String(n).padStart(2, '0')
export const hhmm = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
