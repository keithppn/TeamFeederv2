// 02 — Staff workspace (Admin / Super Admin), shown only when staff are signed in.
import { useCallback, useEffect, useState } from 'react'
import { Field, selectCls } from '@/components/form'
import type { Profile } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Analytics } from './Analytics'
import { Conference } from './Conference'
import { loadWorkspace, type WsData } from './data'
import { ManualBooking } from './ManualBooking'
import { Requests } from './Requests'
import { RoomsUsers } from './RoomsUsers'

type Tab = 'requests' | 'conf' | 'manual' | 'analytics' | 'admin'
const TABS: [Tab, string][] = [['requests', 'Requests'], ['conf', 'My Conference'], ['manual', 'Manual booking'], ['analytics', 'Analytics']]

export function Workspace({ profile, onChanged }: { profile: Profile; onChanged: () => void }) {
  const isSuper = profile.role === 'super_admin'
  const [d, setD] = useState<WsData | null>(null)
  const [tab, setTab] = useState<Tab>('requests')
  const [filter, setFilter] = useState('all')

  const reload = useCallback(() => { loadWorkspace(isSuper).then(setD) }, [isSuper])
  useEffect(reload, [reload])
  const changed = () => { reload(); onChanged() }

  const tabs = isSuper ? [...TABS, ['admin', 'Rooms and users'] as [Tab, string]] : TABS
  const now = tabs.some(([t]) => t === tab) ? tab : 'requests'

  const body = (() => {
    if (!d) return <p className="font-semibold text-muted-foreground">Loading…</p>
    const rn = (id: string | null) => d.rooms.find((r) => r.id === id)?.name ?? 'General'
    const scope = isSuper ? d.rooms.map((r) => r.id) : d.assign.filter((a) => a.user_id === profile.id).map((a) => a.room_id)
    const fRooms = filter !== 'all' && scope.includes(filter) ? [filter] : scope
    const inScope = (id: string) => fRooms.includes(id)
    const bookings = d.bookings.filter((b) => inScope(b.room_id))
    const inquiries = d.inquiries.filter((i) => (i.room_id ? inScope(i.room_id) : isSuper && filter === 'all'))
    const unassigned = d.rooms.filter((r) => r.active && !d.assign.some((a) => a.room_id === r.id))

    return (
      <>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="text-[30px] font-extrabold tracking-tight">{isSuper ? 'Super Admin workspace' : 'Admin workspace'}</h2>
            <p className="font-medium text-muted-foreground">
              {isSuper ? 'All rooms, users and settings.'
                : `Your assigned rooms: ${scope.length ? scope.map(rn).join(', ') : 'none yet. Ask a Super Admin to assign you.'}`}
            </p>
          </div>
          <Field label="Room" className="min-w-[220px]">
            <select className={selectCls} value={scope.includes(filter) ? filter : 'all'} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">{isSuper ? 'All rooms' : 'All my rooms'}</option>
              {scope.map((id) => <option key={id} value={id}>{rn(id)}</option>)}
            </select>
          </Field>
        </div>
        {isSuper && unassigned.length > 0 && (
          <p className="rounded-xl bg-[#FDE3A9] px-4 py-3 font-semibold">
            Heads up: {unassigned.map((r) => r.name).join(', ')} has no Admin. Requests for it are handled by the Super Admin.
          </p>
        )}
        <div role="tablist" aria-label="Workspace sections" className="flex flex-wrap gap-2">
          {tabs.map(([t, label]) => (
            <button key={t} role="tab" aria-selected={now === t} onClick={() => setTab(t)}
              className={cn('min-h-11 rounded-full px-[18px] text-[15px] font-bold', now === t ? 'bg-primary text-white' : 'bg-secondary')}>
              {label}
            </button>
          ))}
        </div>
        {now === 'requests' && <Requests bookings={bookings} mail={d.mail.filter((m) => inScope(m.room_id))} rn={rn} onChanged={changed} />}
        {now === 'conf' && <Conference bookings={bookings} inquiries={inquiries} rn={rn} onChanged={changed} />}
        {now === 'manual' && <ManualBooking rooms={d.rooms.filter((r) => r.active && scope.includes(r.id))} onChanged={changed} />}
        {now === 'analytics' && <Analytics bookings={bookings} inquiryCount={inquiries.length} roomIds={fRooms} rn={rn} />}
        {now === 'admin' && isSuper && <RoomsUsers rooms={d.rooms} assign={d.assign} admins={d.admins} audit={d.audit} onChanged={changed} />}
      </>
    )
  })()

  return (
    <section id="workspace" aria-label="Staff workspace" className="px-[5vw] pb-8 pt-6">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[22px] rounded-[26px] bg-white p-7 shadow-[0_10px_40px_rgba(27,47,94,.12)]">
        {body}
      </div>
    </section>
  )
}
