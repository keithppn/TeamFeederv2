-- 05 Availability. Run after 001_init.sql.

-- Public grid data for one room and date range. Only time and status; never name, email or purpose.
create or replace function public.room_slots(p_room uuid, p_from date, p_to date)
returns table (day date, start_slot int, end_slot int, status text)
language sql stable security definer set search_path = public
as $$
  select b.day, b.start_slot, b.end_slot, b.status
  from bookings b join rooms r on r.id = b.room_id
  where b.room_id = p_room and r.active
    and b.day between p_from and p_to
    and p_to - p_from <= 62 -- one call covers at most ~2 months
    and b.status <> 'declined';
$$;
grant execute on function public.room_slots(uuid, date, date) to anon, authenticated;

-- track_booking also returns room_id so the grid can jump to the tracked room.
drop function if exists public.track_booking(text);
create function public.track_booking(p_tx text)
returns table (status text, room_id uuid, room_name text, day date, start_slot int, end_slot int,
               dept text, purpose text, reason text)
language sql stable security definer set search_path = public
as $$
  select b.status, b.room_id, r.name, b.day, b.start_slot, b.end_slot, b.dept, b.purpose, b.reason
  from bookings b join rooms r on r.id = b.room_id
  where b.tx = upper(p_tx);
$$;
grant execute on function public.track_booking(text) to anon, authenticated;
