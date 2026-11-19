# BookRoom — Conference Room Booking

React + Vite + TypeScript + shadcn/ui + Supabase. Design follows the original single-file prototype.

Built sections (from the section specs): **01 Header**, **03 Hero & tracker**, **10 Booking dialog**, **11 Inquiry dialog**, **12 Staff sign-in**, **04 Rooms**.
Not built yet: 02 Staff workspace, 05 Availability grid, 06 How it works, 07 FAQ, 08 Contact, 09 Footer.

## Setup

1. **Supabase**
   1. In the dashboard, Authentication → Add user, create these with password `demo1234` (auto-confirm):
      `super@bookroom.example`, `admin1@bookroom.example`, `admin2@bookroom.example`.
   2. SQL editor: run `supabase/migrations/001_init.sql`, then `supabase/seed.sql`.
2. `cp .env.example .env` and fill in your project URL and anon key (Settings → API).
3. `npm install`
4. `npm run dev`

`npm run test` runs helper tests, `npm run build` type-checks and builds.

## How it maps to the sections

| Section | File | Notes |
|---|---|---|
| 01 | `src/components/Header.tsx` | Contact opens the inquiry dialog (08 not built). Other nav anchors wait for their sections. |
| 03 | `src/components/Hero.tsx`, `Tracker.tsx` | **Book a Room** opens the booking dialog (no grid yet). Tracker calls `track_booking`. |
| 04 | `src/components/Rooms.tsx` | Cards for active rooms; **See availability** jumps to `#availability`. |
| 10 | `src/components/BookingDialog.tsx` | Calls `create_booking`; shows phone, purpose, attendees too. Email is a preview only. |
| 11 | `src/components/InquiryDialog.tsx` | Inserts into `inquiries`. |
| 12 | `src/components/SignInDialog.tsx`, `src/hooks/useAuth.ts` | Supabase Auth; only users with a `profiles` row can sign in. |
| 00 | `src/lib/booking.ts`, `src/components/form.tsx`, `src/index.css` | Shared helpers, field styles, colour tokens. |

## Security model

- Visitors cannot read `bookings`. They go through `security definer` RPCs:
  `create_booking`, `track_booking` (no name/email returned), `pending_overlap`.
- `create_booking` re-checks dates, hours, capacity and approved-booking overlap on the server, and generates the `BK-` number.
- `inquiries`: insert only for visitors.

## Known limits

- Tracker lockout (5 unknown codes → 1 minute) is client-side only.
- No email is sent; the dialog shows what would be sent.
- Demo codes and demo logins are visible in the UI; remove before launch.
