// 12 — Staff sign-in dialog
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BrDialogContent, Field, FormError, inputCls, pillCls } from '@/components/form'
import type { Profile } from '@/hooks/useAuth'

export function SignInDialog({ open, onOpenChange, signIn, onSignedIn }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  signIn: (email: string, password: string) => Promise<Profile | null>
  onSignedIn: (p: Profile) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setEmail(''); setPassword(''); setError('') }
  }, [open])

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setBusy(true)
    const p = await signIn(email, password)
    setBusy(false)
    if (!p) { setError('That email and password do not match a staff account.'); return }
    onOpenChange(false)
    onSignedIn(p)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BrDialogContent title="Staff sign in" description="For Admins and Super Admins. Clients do not need an account." className="sm:max-w-[460px]">
        <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
          <Field label="Email">
            <Input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" disabled={busy} className={pillCls}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          {/* Remove before launch (see 12 — open tasks). */}
          <div className="rounded-[14px] bg-secondary p-3.5 text-[13px] font-medium leading-relaxed text-muted-foreground">
            Prototype logins, password <strong>demo1234</strong>:<br />
            admin1@bookroom.example (Admin, rooms A and B)<br />
            admin2@bookroom.example (Admin, rooms B and C)<br />
            super@bookroom.example (Super Admin)
          </div>
        </form>
      </BrDialogContent>
    </Dialog>
  )
}
