// 06 — How it works (static three-step explainer)
const steps = [
  { title: 'Pick a room and time', text: 'Browse the weekly grid and choose an open slot. No account needed.' },
  { title: 'Send your request', text: 'Fill in a short form. You get a transaction number right away. Keep it safe.' },
  { title: 'Track the decision', text: 'Type your transaction number in the Track field at the top of the page to see if it is pending, booked or declined.' },
]

export function HowItWorks() {
  return (
    <section id="how" className="px-[5vw] pt-12 sm:pt-[72px]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
        <h2 className="text-[clamp(30px,3.4vw,44px)] font-extrabold tracking-tight">How it works</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-col gap-3 rounded-[22px] bg-card p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent text-xl font-extrabold">{i + 1}</span>
              <h3 className="text-xl font-extrabold">{s.title}</h3>
              <p className="font-medium leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
