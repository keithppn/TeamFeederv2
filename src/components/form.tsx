import type { ReactNode } from 'react'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { MailPreview } from '@/lib/booking'
import { cn } from '@/lib/utils'

// Shared field look from the prototype's .inp / .field / .err / .hint classes.
export const inputCls = 'h-11 rounded-xl border-[1.5px] border-input bg-white px-3.5 text-base font-medium md:text-base'
export const selectCls = cn(inputCls, 'w-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50')
export const pillCls = 'h-11 rounded-full px-6 text-base font-bold'
export const amberCls = 'bg-accent text-accent-foreground hover:bg-[#E69A15]'

export function Field({ label, error, hint, children, className }: {
  label: string; error?: string; hint?: string; children: ReactNode; className?: string
}) {
  return (
    <Label className={cn('flex-col items-stretch gap-1.5 text-sm font-semibold leading-normal select-auto', className)}>
      {label}
      {children}
      {hint && <span className="text-[13px] font-medium text-muted-foreground">{hint}</span>}
      {error && <span className="text-[13px] font-semibold text-destructive">{error}</span>}
    </Label>
  )
}

export function FormError({ children }: { children?: string }) {
  if (!children) return null
  return <p role="alert" className="text-[13px] font-semibold text-destructive">{children}</p>
}

export function BrDialogContent({ title, description, children, className }: {
  title: string; description?: string; children: ReactNode; className?: string
}) {
  return (
    <DialogContent className={cn('max-h-[92vh] overflow-auto rounded-3xl bg-white p-7 sm:max-w-[540px]', className)}>
      <DialogHeader className="pr-8">
        <DialogTitle className="text-[28px] font-extrabold leading-tight tracking-tight">{title}</DialogTitle>
        {description && <DialogDescription className="text-base font-medium">{description}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  )
}

export function MailPreviewBox({ mail, label }: { mail: MailPreview; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border-[1.5px] border-dashed border-input p-3.5 text-sm">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span><strong>To:</strong> {mail.to}</span>
      <strong>{mail.subject}</strong>
      <span className="whitespace-pre-line text-muted-foreground">{mail.body}</span>
    </div>
  )
}
