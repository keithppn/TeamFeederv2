import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Availability, weekOf } from '@/components/Availability'
import { BookingDialog, type Preset } from '@/components/BookingDialog'
import { Contact } from '@/components/Contact'
import { Faq } from '@/components/Faq'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Header, type View } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { HowItWorks } from '@/components/HowItWorks'
import { InquiryDialog } from '@/components/InquiryDialog'
import { Rooms } from '@/components/Rooms'
import { SignInDialog } from '@/components/SignInDialog'
import type { Tracked } from '@/components/Tracker'
import { Toaster } from '@/components/ui/sonner'
import { Workspace } from '@/components/workspace/Workspace'
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
  // 02: staff switch between the public page and the workspace with the header's Workspace tab.
  const [viewState, setView] = useState<View>('public')
  const view: View = profile ? viewState : 'public'

  useEffect(() => {
    // After switching views, land on the anchor the nav link set (or the top).
    const el = view === 'public' && location.hash ? document.getElementById(location.hash.slice(1)) : null
    if (el) el.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [view])

  const onTracked = (t: Tracked | null) => {
    setTracked(t)
    if (!t) return
    if (rooms.some((r) => r.id === t.room_id)) setSelRoom(t.room_id)
    const w = weekOf(t.day)
    if (w !== null) setWeek(w)
  }

  useEffect(() => {
    // active filter: staff can read inactive rooms too, but the public sections never show them.
    supabase.from('rooms').select('id, name, location, capacity, equipment').eq('active', true).order('name')
      .then(({ data }) => setRooms((data as Room[] | null) ?? []))
  }, [version]) // reload after staff room edits

  const toggle = (name: NonNullable<typeof dialog>) => (open: boolean) => setDialog(open ? name : null)

  return (
    <div id="top" className="min-h-screen">
      <Header
        profile={profile}
        view={view}
        onView={setView}
        onSignIn={() => setDialog('signin')}
        onSignOut={async () => { await signOut(); toast('Signed out.') }}
        onSignOut={async () => { await signOut(); setView('public'); toast('Signed out.') }}
        onContact={() => setDialog('inquiry')}
      />
      {profile && view === 'workspace' ? (
        <Workspace key={profile.id} profile={profile} onChanged={() => setVersion((v) => v + 1)} />
      ) : (
      <main>
        <Hero onBook={() => { setPreset(undefined); setDialog('booking') }} onTracked={onTracked} trackerKey={trackerKey} />
        <Rooms rooms={rooms} onSee={setSelRoom} />
        <Availability
          rooms={rooms} room={room} onSelRoom={setSelRoom} week={week} onWeek={setWeek}
          tracked={tracked} onClearTracked={() => { setTracked(null); setTrackerKey((k) => k + 1) }}
          onPick={(roomId, day, start) => { setPreset({ roomId, day, start }); setDialog('booking') }}
          version={version}
        />
        <HowItWorks />
        <Faq />
        <Contact onInquiry={() => setDialog('inquiry')} />
      </main>
      <Footer onSignIn={profile ? undefined : () => setDialog('signin')} />
      )}
      <BookingDialog open={dialog === 'booking'} onOpenChange={toggle('booking')} rooms={rooms}
        preset={preset} onBooked={() => setVersion((v) => v + 1)} />
      <InquiryDialog open={dialog === 'inquiry'} onOpenChange={toggle('inquiry')} rooms={rooms} />
      <SignInDialog open={dialog === 'signin'} onOpenChange={toggle('signin')} signIn={signIn}
        onSignedIn={(p) => { setView('workspace'); toast(`Signed in as ${p.name}.`) }} />
      <Toaster />
    </div>
  )
}
