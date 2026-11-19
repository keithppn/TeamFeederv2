// 01 — Header & navigation
import { Button } from '@/components/ui/button'
import { amberCls, pillCls } from '@/components/form'
import type { Profile } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navCls = 'border-b-[3px] border-transparent py-2.5 font-semibold text-foreground no-underline hover:border-accent'

export function Header({ profile, onSignIn, onSignOut }: {
  profile: Profile | null; onSignIn: () => void; onSignOut: () => void
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-[5vw] py-5">
      <a href="#top" aria-label="BookRoom home" className="inline-flex items-center gap-3 text-foreground no-underline">
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
          <rect x="4" y="9" width="46" height="41" rx="9" fill="#FDF3E0" stroke="#1B2F5E" strokeWidth="3.5" />
          <path d="M17 3v11M37 3v11" stroke="#1B2F5E" strokeWidth="4" strokeLinecap="round" />
          <path d="M4 21h46" stroke="#1B2F5E" strokeWidth="3" />
          {[12, 23, 34].map((x) => <rect key={x} x={x} y="27" width="8" height="8" rx="2" fill="#F5A623" />)}
          {[12, 23].map((x) => <rect key={x} x={x} y="38" width="8" height="7" rx="2" fill="#F5A623" />)}
        </svg>
        <span className="text-[32px] font-extrabold tracking-tight">Book<span className="text-accent">Room</span></span>
      </a>
      <nav aria-label="Primary" className="flex flex-wrap gap-x-9 gap-y-1 text-[17px]">
        <a className={cn(navCls, 'border-accent')} href="#top">Home</a>
        <a className={navCls} href="#rooms">Rooms</a>
        <a className={navCls} href="#availability">Availability</a>
        <a className={navCls} href="#how">How it works</a>
        <a className={navCls} href="#faq">FAQ</a>
        <a className={navCls} href="#contact">Contact</a>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        {profile ? (
          <>
            <span className="text-[15px] font-semibold">
              {profile.name} · {profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
            <Button variant="outline" className={cn(pillCls, 'border-2 border-primary bg-transparent')} onClick={onSignOut}>
              Sign out
            </Button>
          </>
        ) : (
          <Button className={cn(pillCls, amberCls)} onClick={onSignIn}>Sign In</Button>
        )}
      </div>
    </header>
  )
}
