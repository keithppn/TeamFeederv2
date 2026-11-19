import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Profile = { id: string; name: string; role: 'admin' | 'super_admin' }

const loadProfile = async (id: string) =>
  (await supabase.from('profiles').select('id, name, role').eq('id', id).maybeSingle()).data as Profile | null

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the query: supabase-js warns against awaiting inside this callback.
      setTimeout(async () => setProfile(session ? await loadProfile(session.user.id) : null), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Only staff with a profile row may sign in; anyone else is signed straight back out.
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error || !data.user) return null
    const p = await loadProfile(data.user.id)
    if (!p) await supabase.auth.signOut()
    else setProfile(p)
    return p
  }

  const signOut = () => supabase.auth.signOut()

  return { profile, signIn, signOut }
}
