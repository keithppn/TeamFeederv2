// 03 — Hero
import { ArrowRightIcon, CalendarCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tracker, type Tracked } from '@/components/Tracker'

// trackerKey: changing it clears the tracker (used by the Clear button in 05 Availability).
export function Hero({ onBook, onTracked, trackerKey }: {
  onBook: () => void; onTracked?: (t: Tracked | null) => void; trackerKey?: number
}) {
  return (
    <section aria-labelledby="hero-title" className="flex flex-wrap items-stretch overflow-hidden pl-[5vw]">
      <div className="flex max-w-[780px] flex-[1_1_520px] flex-col items-start justify-center gap-5 pb-8 pr-[5vw] pt-6 sm:gap-7 sm:pb-[72px] sm:pt-12 lg:pr-6">
        <span className="inline-flex items-center gap-3 rounded-full bg-[#FBE9C8] py-2.5 pl-4 pr-5 text-[15px] font-semibold sm:py-3 sm:pl-[18px] sm:pr-[22px] sm:text-[17px]">
          <CalendarCheckIcon className="size-[26px]" strokeWidth={2} aria-hidden="true" />
          Smart Booking. Better Meetings.
        </span>
        <h1 id="hero-title" className="text-[clamp(40px,5.4vw,78px)] font-extrabold leading-[1.06] tracking-[-0.025em]">
          Conference<br />Room Booking<br /><span className="text-[#C27C00]">Made Easy</span>
        </h1>
        <p className="max-w-[520px] text-lg font-medium sm:text-xl leading-relaxed text-muted-foreground">
          Book conference rooms, manage your meetings, and boost productivity — all in one place.
        </p>
        <div className="flex w-full max-w-[420px] flex-col gap-5 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6 sm:gap-y-4">
          {/* mt = tracker label (22px) + gap (8px): lines the button up with the field, not the whole tracker */}
          <Button onClick={onBook} className="h-[60px] w-full gap-2 sm:mt-[30px] sm:w-auto rounded-full px-[34px] text-lg font-bold">
            Book a Room <ArrowRightIcon className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
          </Button>
          <Tracker key={trackerKey} onTracked={onTracked} />
        </div>
      </div>
      <div className="relative min-h-[260px] flex-[1.35_1_520px] sm:min-h-[360px] lg:min-h-[440px]">
        <img
          src="/hero.jpg"
          alt="A team meeting around a conference table while a presenter points to a booking calendar on a screen"
          className="absolute inset-0 size-full object-cover object-top [mask-image:linear-gradient(to_bottom,transparent_0,#000_25%)] lg:object-left lg:[mask-image:linear-gradient(to_right,transparent_0,#000_20%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[90px] bg-gradient-to-b from-background to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  )
}
