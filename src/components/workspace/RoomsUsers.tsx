// 02 — Rooms and users tab (Super Admin only): rooms, admin assignments, audit log.
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FormError, inputCls, pillCls } from '@/components/form'
import { cn } from '@/lib/utils'
import { callRpc, hhmm, type Admin, type Assign, type AuditRow, type WsRoom } from './data'
import { Badge, ghostCls, h3Cls, mutedCls, rowCls } from './ui'

export function RoomsUsers({ rooms, assign, admins, audit, onChanged }: {
  rooms: WsRoom[]; assign: Assign[]; admins: Admin[]; audit: AuditRow[]; onChanged: () => void
}) {
  const [add, setAdd] = useState({ name: '', capacity: '', location: '' })
  const [addErr, setAddErr] = useState('')

  const save = async (r: WsRoom, patch: Partial<Pick<WsRoom, 'name' | 'capacity' | 'location' | 'active'>>) => {
    const next = { ...r, ...patch }
    const err = await callRpc('update_room', {
      p_id: r.id, p_name: next.name, p_capacity: next.capacity, p_location: next.location, p_active: next.active,
    })
    if (err) { toast(err); return }
    onChanged()
  }

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const cap = parseInt(add.capacity, 10)
    if (!add.name.trim() || !(cap >= 1)) { setAddErr('Enter a room name and a capacity of 1 or more.'); return }
    const err = await callRpc('add_room', { p_name: add.name.trim(), p_capacity: cap, p_location: add.location.trim() })
    if (err) { setAddErr(err); return }
    setAdd({ name: '', capacity: '', location: '' }); setAddErr('')
    onChanged()
  }

  const toggle = async (userId: string, roomId: string, on: boolean) => {
    const err = await callRpc('set_room_admin', { p_user: userId, p_room: roomId, p_on: on })
    if (err) { toast(err); return }
    onChanged()
  }

  const assigned = (userId: string, roomId: string) => assign.some((a) => a.user_id === userId && a.room_id === roomId)
  const hasAdmin = (roomId: string) => assign.some((a) => a.room_id === roomId)

  return (
    <div className="flex flex-col gap-[22px]">
      <h3 className={h3Cls}>Rooms</h3>
      {rooms.map((r) => (
        // key includes saved values so the uncontrolled inputs reset after a reload.
        <div key={`${r.id}|${r.name}|${r.capacity}|${r.location}`} className={rowCls}>
          <Field label="Name" className="flex-[1_1_200px]">
            <Input className={inputCls} defaultValue={r.name}
              onBlur={(e) => { const v = e.target.value.trim(); if (!v) e.target.value = r.name; else if (v !== r.name) save(r, { name: v }) }} />
          </Field>
          <Field label="Capacity" className="flex-[0_1_110px]">
            <Input className={inputCls} inputMode="numeric" defaultValue={String(r.capacity)}
              onBlur={(e) => {
                const n = parseInt(e.target.value, 10)
                if (!(n >= 1)) e.target.value = String(r.capacity)
                else if (n !== r.capacity) save(r, { capacity: n })
              }} />
          </Field>
          <Field label="Location" className="flex-[1_1_180px]">
            <Input className={inputCls} defaultValue={r.location}
              onBlur={(e) => { const v = e.target.value.trim(); if (v !== r.location) save(r, { location: v }) }} />
          </Field>
          {r.active && !hasAdmin(r.id) && <Badge tone="pending">No Admin assigned</Badge>}
          <Button variant="outline" className={cn(pillCls, ghostCls)} onClick={() => save(r, { active: !r.active })}>
            {r.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ))}

      <form noValidate onSubmit={addRoom} className="flex flex-wrap items-end gap-3">
        <Field label="New room name" className="flex-[1_1_200px]">
          <Input className={inputCls} value={add.name} onChange={(e) => setAdd((a) => ({ ...a, name: e.target.value }))} />
        </Field>
        <Field label="Capacity" className="flex-[0_1_110px]">
          <Input className={inputCls} inputMode="numeric" value={add.capacity} onChange={(e) => setAdd((a) => ({ ...a, capacity: e.target.value }))} />
        </Field>
        <Field label="Location" className="flex-[1_1_180px]">
          <Input className={inputCls} value={add.location} onChange={(e) => setAdd((a) => ({ ...a, location: e.target.value }))} />
        </Field>
        <Button type="submit" className={pillCls}>Add room</Button>
      </form>
      <FormError>{addErr}</FormError>

      <h3 className={h3Cls}>Admins and their rooms</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Admin</th>
              {rooms.map((r) => <th key={r.id} scope="col" className="px-3 py-2 text-center">{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {admins.map((u) => (
              <tr key={u.id} className="border-t-[1.5px] border-border">
                <th scope="row" className="px-3 py-2.5 text-left font-semibold">
                  {u.name}<br /><span className="text-[13px] font-medium text-muted-foreground">{u.email}</span>
                </th>
                {rooms.map((r) => (
                  <td key={r.id} className="px-3 py-2.5 text-center">
                    <input type="checkbox" className="size-6 accent-primary" aria-label={`${u.name} manages ${r.name}`}
                      checked={assigned(u.id, r.id)} onChange={(e) => toggle(u.id, r.id, e.target.checked)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">A change here applies on the Admin's very next request.</p>

      <h3 className={h3Cls}>Audit log</h3>
      <div className="flex flex-col gap-1.5">
        {audit.map((a) => (
          <div key={a.id} className="text-sm">
            <span className="text-muted-foreground">{hhmm(a.created_at)}</span> · <strong>{a.actor_name}</strong> {a.text}
          </div>
        ))}
        {audit.length === 0 && <p className={mutedCls}>No changes recorded yet.</p>}
      </div>
    </div>
  )
}
