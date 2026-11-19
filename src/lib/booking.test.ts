import { describe, expect, it } from 'vitest'
import { durOptions, normalizeTrackCode, slotLabel, validateBooking, type BookingForm, type Room } from './booking'

const room: Room = { id: 'r1', name: 'Huddle Room C', location: '', capacity: 4, equipment: [] }
const base: BookingForm = {
  roomId: 'r1', day: '2026-11-23', start: '4', dur: '2', name: 'Liza', dept: 'IT',
  email: 'liza@example.com', phone: '', purpose: '', attendees: '',
}
const today = '2026-11-19' // Thursday

describe('normalizeTrackCode', () => {
  it('strips BK- prefix, spaces and maps confusable letters', () => {
    expect(normalizeTrackCode('bk-7f3k 9q2m4x')).toBe('7F3K9Q2M4X')
    expect(normalizeTrackCode('O1IL')).toBe('0111')
    expect(normalizeTrackCode('7F3K9Q2M4XEXTRA')).toBe('7F3K9Q2M4X')
    expect(normalizeTrackCode('U!@#')).toBe('') // U is not Crockford
  })
})

describe('validateBooking', () => {
  it('accepts a valid weekday request', () => {
    expect(validateBooking(base, room, today)).toEqual({})
  })
  it('rejects weekends and past days', () => {
    expect(validateBooking({ ...base, day: '2026-11-21' }, room, today).time).toMatch(/weekday/)
    expect(validateBooking({ ...base, day: '2026-11-18' }, room, today).time).toMatch(/weekday/)
  })
  it('rejects meetings running past 5 PM', () => {
    expect(validateBooking({ ...base, start: '17', dur: '2' }, room, today).time).toMatch(/closing/)
    expect(validateBooking({ ...base, start: '16', dur: '2' }, room, today).time).toBeUndefined()
  })
  it('checks capacity, email and required fields', () => {
    const e = validateBooking({ ...base, attendees: '5', email: 'nope', name: ' ', dept: '' }, room, today)
    expect(e.attendees).toMatch(/seats 4/)
    expect(e.email).toBeDefined()
    expect(e.name).toBeDefined()
    expect(e.dept).toBeDefined()
  })
})

describe('labels', () => {
  it('formats slots and durations', () => {
    expect(slotLabel(0)).toBe('8:00 AM')
    expect(slotLabel(18)).toBe('5:00 PM')
    expect(durOptions.map((o) => o.label).slice(0, 3)).toEqual(['30 min', '1 hour', '1 hr 30 min'])
  })
})
