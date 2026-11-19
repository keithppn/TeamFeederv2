// 07 — FAQ (static accordion using native <details>/<summary>)
const faqs = [
  {
    q: 'Do I need an account to book?',
    a: 'No. You send a request and receive a transaction number. That number, plus the email you used, is how you check on it later.',
  },
  {
    q: 'Who approves my request?',
    a: 'An Admin responsible for that room reviews it. Until then it shows as Pending on the grid. Only approved bookings block a time.',
  },
  {
    q: 'I lost my transaction number. What now?',
    a: 'Send an inquiry with your name and email. An Admin can look up the booking and share the number with you.',
  },
  {
    q: 'What if my request is declined?',
    a: 'Tracking your booking shows the status and the reason given, and the time is free for others to request.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="px-[5vw] pt-12 sm:pt-[72px]">
      <div className="mx-auto flex max-w-[900px] flex-col gap-5">
        <h2 className="text-[clamp(30px,3.4vw,44px)] font-extrabold tracking-tight">Questions, answered</h2>
        <div className="rounded-[22px] bg-card px-4 py-2 sm:px-6">
          {faqs.map((f) => (
            <details key={f.q} className="border-b-[1.5px] border-[#F0E6D2] last:border-b-0">
              <summary className="flex min-h-11 cursor-pointer items-center text-lg font-bold">{f.q}</summary>
              <p className="pb-[18px] font-medium leading-[1.7] text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
