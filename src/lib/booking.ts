// Shared booking helpers, ported from the prototype (00 — Overview & shared).
export const SLOT_MIN = 30
export const DAY_START = 480 // 08:00 in minutes
export const SLOTS = 18 // 08:00 – 17:00

export const TX_RE = /^BK-[0-9A-HJKMNP-TV-Z]{10}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export type Room = { id: string; name: string; location: string; capacity: number; equipment: string[] }

export type BookingForm = {
  roomId: string
  day: string
  start: string
  dur: string
  name: string
  dept: string
  email: string
  phone: string
  purpose: string
  attendees: string
}

const pad = (n: number) => String(n).padStart(2, '0')
export const dkey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const fmtDay = (d: Date) => `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`

export const slotLabel = (s: number) => {
  const m = DAY_START + s * SLOT_MIN
  const h = Math.floor(m / 60)
  return `${h % 12 || 12}:${pad(m % 60)} ${h >= 12 ? 'PM' : 'AM'}`
}
export const rangeLabel = (s: number, e: number) => `${slotLabel(s)} – ${slotLabel(e)}`

export const nextWeekday = (d: Date) => {
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (b.getDay() === 6) b.setDate(b.getDate() + 2)
  else if (b.getDay() === 0) b.setDate(b.getDate() + 1)
  return b
}

export const startOptions = Array.from({ length: SLOTS }, (_, s) => ({ v: String(s), label: slotLabel(s) }))
export const durOptions = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1
  const label = n % 2 ? (n === 1 ? '30 min' : `${Math.floor(n / 2)} hr 30 min`) : `${n / 2} ${n === 2 ? 'hour' : 'hours'}`
  return { v: String(n), label }
})

// Tracker input: visitor types the 10 characters after "BK-"; a pasted full number still works.
export const normalizeTrackCode = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/\s/g, '')
    .replace(/^BK-/, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^0-9A-HJKMNP-TV-Z]/g, '')
    .slice(0, 10)

export function validateBooking(f: BookingForm, room: Room | undefined, todayKey = dkey(new Date())) {
  const err: Partial<Record<keyof BookingForm | 'time', string>> = {}
  const s = parseInt(f.start, 10)
  const len = parseInt(f.dur, 10)
  if (!f.name.trim()) err.name = 'Please enter your name.'
  if (!f.dept.trim()) err.dept = 'Please enter your department.'
  if (!EMAIL_RE.test(f.email.trim())) err.email = 'Enter a valid email, like name@company.com.'
  if (f.phone.trim() && f.phone.replace(/\D/g, '').length < 7) err.phone = 'Enter a phone number with at least 7 digits.'
  if (f.attendees.trim()) {
    const att = parseInt(f.attendees, 10)
    if (!(att >= 1)) err.attendees = 'Enter the number of attendees, 1 or more.'
    else if (room && att > room.capacity)
      err.attendees = `${room.name} seats ${room.capacity}. Choose a bigger room or fewer attendees.`
  }
  if (!room) err.time = 'Choose a room.'
  else if (!f.day || f.day < todayKey || [0, 6].includes(parseKey(f.day).getDay()))
    err.time = 'Choose a weekday from today onward.'
  else if (s + len > SLOTS) err.time = 'That runs past closing at 5:00 PM. Start earlier or shorten the meeting.'
  return err
}

export type MailPreview = { to: string; subject: string; body: string }

// Builds the email the system would send. Nothing is delivered (prototype behaviour).
export function buildMailPreview(
  kind: 'received' | 'unavailable',
  b: { name: string; email: string; roomName: string; day: string; start: number; end: number; tx?: string },
): MailPreview {
  const when = `${fmtDay(parseKey(b.day))}, ${rangeLabel(b.start, b.end)}`
  const hi = `Hi ${b.name},\n\n`
  const sig = '\n\nBookRoom'
  if (kind === 'received')
    return {
      to: b.email,
      subject: `We received your booking request ${b.tx}`,
      body: `${hi}Your request for ${b.roomName} on ${when} is pending approval.\nTransaction number: ${b.tx}\nKeep it. Type it into the Track field on the home page to check your booking.${sig}`,
    }
  return {
    to: b.email,
    subject: 'Your booking could not be completed',
    body: `${hi}Sorry, ${b.roomName} on ${when} is no longer available. No booking was made. Please choose another time.${sig}`,
  }
}
