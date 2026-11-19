// 08 — Contact / inquiry call-to-action
import { Button } from '@/components/ui/button'
import { amberCls } from '@/components/form'
import { cn } from '@/lib/utils'

export function Contact({ onInquiry }: { onInquiry: () => void }) {
  return (
    <section id="contact" className="px-[5vw] py-[72px]">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-10 gap-y-6 rounded-[28px] bg-primary p-11 text-white">
        <div className="flex max-w-[620px] flex-col gap-2.5">
          <h2 className="text-[clamp(28px,3vw,40px)] font-extrabold tracking-tight">Not sure which room fits?</h2>
          <p className="text-lg font-medium leading-relaxed text-[#E8ECF6]">
            Send us an inquiry and the team will reply. You can add a transaction number if it is about a booking you already made.
          </p>
        </div>
        <Button onClick={onInquiry} className={cn('h-[60px] rounded-full px-[34px] text-lg font-bold', amberCls)}>
          Send an inquiry
        </Button>
      </div>
    </section>
  )
}
