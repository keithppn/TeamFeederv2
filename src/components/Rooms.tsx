// 04 — Rooms
import { buttonVariants } from '@/components/ui/button'
import { amberCls, pillCls } from '@/components/form'
import type { Room } from '@/lib/booking'
import { cn } from '@/lib/utils'

export function Rooms({ rooms, onSee }: { rooms: Room[]; onSee: (roomId: string) => void }) {
  return (
    <section id="rooms" className="px-[5vw] pt-14">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
        <div className="flex max-w-[640px] flex-col gap-2.5">
          <h2 className="text-[clamp(30px,3.4vw,44px)] font-extrabold tracking-tight">Find the right room</h2>
          <p className="text-lg font-medium leading-relaxed text-muted-foreground">
            Every room, with the details you need to choose before you request a time.
          </p>
        </div>
        {rooms.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
            {rooms.map((r) => (
              <article key={r.id} className="flex flex-col gap-3.5 rounded-[22px] bg-card p-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[22px] font-extrabold">{r.name}</h3>
                  <p className="font-medium text-muted-foreground">{r.location}</p>
                </div>
                <p className="font-bold">Seats {r.capacity}</p>
                <div className="flex flex-wrap gap-2">
                  {r.equipment.map((e) => (
                    <span key={e} className="rounded-full bg-secondary px-3 py-1 text-[13px] font-semibold">{e}</span>
                  ))}
                </div>
                <a href="#availability" onClick={() => onSee(r.id)}
                  className={cn(buttonVariants(), pillCls, amberCls, 'mt-auto')}>
                  See availability
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-[22px] bg-card p-6 text-center font-semibold">No conference rooms are listed right now.</p>
        )}
      </div>
    </section>
  )
}
