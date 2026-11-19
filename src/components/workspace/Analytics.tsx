// 02 — Analytics tab.
import type { Booking } from './data'
import { Badge, h3Cls, Stat, Stats } from './ui'

export function Analytics({ bookings, inquiryCount, roomIds, rn }: {
  bookings: Booking[]; inquiryCount: number; roomIds: string[]; rn: (id: string | null) => string
}) {
  const count = (s: Booking['status']) => bookings.filter((b) => b.status === s).length
  // Average decision time counts Client requests only; manual bookings are approved at creation.
  const decided = bookings.filter((b) => b.decided_at && b.created_by === 'client')
  const avgH = decided.length
    ? decided.reduce((t, b) => t + (Date.parse(b.decided_at!) - Date.parse(b.created_at)) / 3_600_000, 0) / decided.length
    : null
  const avg = avgH == null ? '—' : avgH < 1 ? `${Math.round(avgH * 60)} min` : `${avgH.toFixed(1)} hrs`
  const perRoom = roomIds.map((id) => ({ id, label: rn(id), count: bookings.filter((b) => b.room_id === id).length }))
  const max = Math.max(1, ...perRoom.map((p) => p.count))

  return (
    <div className="flex flex-col gap-5">
      <Stats>
        <Stat value={bookings.length} label="Total requests" />
        <Stat value={avg} label="Avg. request-to-decision" />
        <Stat value={inquiryCount} label="Inquiries" />
      </Stats>
      <div className="flex flex-wrap gap-3">
        <Badge tone="pending">Pending {count('pending')}</Badge>
        <Badge tone="approved">Approved {count('approved')}</Badge>
        <Badge tone="declined">Declined {count('declined')}</Badge>
      </div>
      <h3 className={h3Cls}>Bookings per room</h3>
      <div className="flex flex-col gap-2.5">
        {perRoom.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3.5">
            <span className="flex-[0_0_160px] font-semibold">{p.label}</span>
            <div className="h-[18px] flex-[1_1_200px] overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((p.count / max) * 100)}%` }} />
            </div>
            <span className="flex-[0_0_32px] text-right font-bold">{p.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
