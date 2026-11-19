// 09 — Footer
import { Button, buttonVariants } from '@/components/ui/button'
import { pillCls } from '@/components/form'
import { cn } from '@/lib/utils'

const ghostCls = cn(pillCls, 'border-2 border-primary bg-transparent')

// onSignIn is undefined once staff are signed in, which hides the sign-in button.
export function Footer({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <footer className="px-[5vw] pb-10">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 font-medium text-muted-foreground">
        <span>BookRoom · Conference room booking for your departments</span>
        <span className="flex flex-wrap gap-3">
          <a href="#track" className={cn(buttonVariants({ variant: 'outline' }), ghostCls, 'text-primary')}>Track booking</a>
          {onSignIn && <Button variant="outline" className={ghostCls} onClick={onSignIn}>Staff sign in</Button>}
        </span>
      </div>
    </footer>
  )
}
