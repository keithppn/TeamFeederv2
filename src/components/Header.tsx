// 01 — Header & navigation
import { Button } from '@/components/ui/button'
import { amberCls, pillCls } from '@/components/form'
import type { Profile } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navCls = 'border-b-[3px] border-transparent py-2.5 font-semibold text-foreground no-underline hover:border-accent'

export type View = 'public' | 'workspace'

export function Header({ profile, view, onView, onSignIn, onSignOut }: {
  profile: Profile | null; view: View; onView: (v: View) => void
  onSignIn: () => void; onSignOut: () => void
}) {
  // Public anchors switch back to the public page; the href still sets the hash App scrolls to.
  const link = (href: string, label: string, active = false) => (
    <a className={cn(navCls, active && 'border-accent')} href={href} aria-current={active ? 'page' : undefined}
      onClick={() => onView('public')}>{label}</a>
  )
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 px-[5vw] py-4 sm:py-5 lg:gap-y-4">
      <a href="#top" aria-label="BookRoom home" className="inline-flex items-center gap-3 text-foreground no-underline">
        <svg viewBox="0 0 54 54" fill="none" aria-hidden="true" className="size-10 sm:size-[54px]">
          <rect x="4" y="9" width="46" height="41" rx="9" fill="#FDF3E0" stroke="#1B2F5E" strokeWidth="3.5" />
          <path d="M17 3v11M37 3v11" stroke="#1B2F5E" strokeWidth="4" strokeLinecap="round" />
          <path d="M4 21h46" stroke="#1B2F5E" strokeWidth="3" />
          {[12, 23, 34].map((x) => <rect key={x} x={x} y="27" width="8" height="8" rx="2" fill="#F5A623" />)}
          {[12, 23].map((x) => <rect key={x} x={x} y="38" width="8" height="7" rx="2" fill="#F5A623" />)}
        </svg>
        <span className="text-2xl font-extrabold tracking-tight sm:text-[32px]">Book<span className="text-accent">Room</span></span>
      </a>
      <nav aria-label="Primary" className="order-3 flex basis-full gap-x-6 overflow-x-auto text-base [scrollbar-width:none] lg:order-none lg:basis-auto lg:flex-wrap lg:gap-x-9 lg:overflow-visible lg:text-[17px] [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap">
        {link('#top', 'Home', view === 'public')}
        {link('#rooms', 'Rooms')}
        {link('#availability', 'Availability')}
        {link('#how', 'How it works')}
        {link('#faq', 'FAQ')}
        {link('#contact', 'Contact')}
        {profile && (
          <button type="button" className={cn(navCls, 'cursor-pointer', view === 'workspace' && 'border-accent')}
            aria-current={view === 'workspace' ? 'page' : undefined} onClick={() => onView('workspace')}>
            Workspace
          </button>
        )}
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
