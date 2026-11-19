import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Availability, weekOf } from '@/components/Availability'
import { BookingDialog, type Preset } from '@/components/BookingDialog'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { InquiryDialog } from '@/components/InquiryDialog'
import { Rooms } from '@/components/Rooms'
import { SignInDialog } from '@/components/SignInDialog'
import type { Tracked } from '@/components/Tracker'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/hooks/useAuth'
import type { Room } from '@/lib/booking'
import { supabase } from '@/lib/supabase'

export default function App() {
  const { profile, signIn, signOut } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [dialog, setDialog] = useState<'booking' | 'inquiry' | 'signin' | null>(null)
  // 05 Availability: selected room, week offset, slot preset for the dialog, tracked booking.
  const [selRoom, setSelRoom] = useState<string | null>(null)
  const [week, setWeek] = useState(0)
  const [preset, setPreset] = useState<Preset | undefined>()
  const [tracked, setTracked] = useState<Tracked | null>(null)
  const [trackerKey, setTrackerKey] = useState(0)
  const [version, setVersion] = useState(0) // bump to refetch grid slots
  const room = rooms.find((r) => r.id === selRoom) ?? rooms[0]

  const onTracked = (t: Tracked | null) => {
    setTracked(t)
    if (!t) return
    if (rooms.some((r) => r.id === t.room_id)) setSelRoom(t.room_id)
    const w = weekOf(t.day)
    if (w !== null) setWeek(w)
  }

  useEffect(() => {
    supabase.from('rooms').select('id, name, location, capacity, equipment').order('name')
      .then(({ data }) => setRooms((data as Room[] | null) ?? []))
  }, [])

  const toggle = (name: NonNullable<typeof dialog>) => (open: boolean) => setDialog(open ? name : null)

  return (
    <div id="top" className="min-h-screen">
      <Header
        profile={profile}
        onSignIn={() => setDialog('signin')}
        onSignOut={async () => { await signOut(); toast('Signed out.') }}
        onContact={() => setDialog('inquiry')}
      />
      <main>
        <Hero onBook={() => { setPreset(undefined); setDialog('booking') }} onTracked={onTracked} trackerKey={trackerKey} />
        <Rooms rooms={rooms} onSee={setSelRoom} />
        <Availability
          rooms={rooms} room={room} onSelRoom={setSelRoom} week={week} onWeek={setWeek}
          tracked={tracked} onClearTracked={() => { setTracked(null); setTrackerKey((k) => k + 1) }}
          onPick={(roomId, day, start) => { setPreset({ roomId, day, start }); setDialog('booking') }}
          version={version}
        />
      </main>
      <BookingDialog open={dialog === 'booking'} onOpenChange={toggle('booking')} rooms={rooms}
        preset={preset} onBooked={() => setVersion((v) => v + 1)} />
      <InquiryDialog open={dialog === 'inquiry'} onOpenChange={toggle('inquiry')} rooms={rooms} />
      <SignInDialog open={dialog === 'signin'} onOpenChange={toggle('signin')} signIn={signIn}
        onSignedIn={(p) => toast(`Signed in as ${p.name}.`)} />
      <Toaster />
    </div>
  )
}
