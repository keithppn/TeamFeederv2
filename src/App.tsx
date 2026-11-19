import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BookingDialog } from '@/components/BookingDialog'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { InquiryDialog } from '@/components/InquiryDialog'
import { Rooms } from '@/components/Rooms'
import { SignInDialog } from '@/components/SignInDialog'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/hooks/useAuth'
import type { Room } from '@/lib/booking'
import { supabase } from '@/lib/supabase'

export default function App() {
  const { profile, signIn, signOut } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [dialog, setDialog] = useState<'booking' | 'inquiry' | 'signin' | null>(null)

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
        <Hero onBook={() => setDialog('booking')} />
        {/* 05 Availability wires onSee to its room selection. */}
        <Rooms rooms={rooms} onSee={() => {}} />
      </main>
      <BookingDialog open={dialog === 'booking'} onOpenChange={toggle('booking')} rooms={rooms} />
      <InquiryDialog open={dialog === 'inquiry'} onOpenChange={toggle('inquiry')} rooms={rooms} />
      <SignInDialog open={dialog === 'signin'} onOpenChange={toggle('signin')} signIn={signIn}
        onSignedIn={(p) => toast(`Signed in as ${p.name}.`)} />
      <Toaster />
    </div>
  )
}
