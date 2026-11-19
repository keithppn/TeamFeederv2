-- BookRoom schema: sections 01, 03, 10, 11, 12.
-- Slots: 0..18, 30 minutes each from 08:00 (slot 18 = 17:00 closing).

create extension if not exists pgcrypto with schema extensions;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  capacity int not null check (capacity >= 1),
  equipment text[] not null default '{}',
  active boolean not null default true
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tx text not null unique check (tx ~ '^BK-[0-9A-HJKMNP-TV-Z]{10}$'),
  room_id uuid not null references public.rooms(id),
  day date not null,
  start_slot int not null check (start_slot between 0 and 17),
  end_slot int not null check (end_slot between 1 and 18 and end_slot > start_slot),
  name text not null check (length(name) between 1 and 200),
  dept text not null check (length(dept) between 1 and 200),
  email text not null check (length(email) between 3 and 320),
  phone text not null default '',
  purpose text not null default '',
  attendees int check (attendees >= 1),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reason text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  created_by text not null default 'client'
);
create index bookings_room_day on public.bookings (room_id, day);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  email text not null check (length(email) between 3 and 320),
  room_id uuid references public.rooms(id),
  tx text check (tx is null or tx ~ '^BK-[0-9A-HJKMNP-TV-Z]{10}$'),
  message text not null check (length(message) between 1 and 5000),
  status text not null default 'open' check (status in ('open', 'answered')),
  response text not null default '',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'super_admin'))
);

-- RLS: visitors never read bookings directly; they go through the RPCs below.
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.inquiries enable row level security;
alter table public.profiles enable row level security;

create policy "active rooms are public" on public.rooms
  for select to anon, authenticated using (active);

create policy "anyone can send an inquiry" on public.inquiries
  for insert to anon, authenticated
  with check (status = 'open' and response = '');

create policy "staff read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- Create a pending booking. Only approved bookings block a time.
create or replace function public.create_booking(
  p_room uuid, p_day date, p_start int, p_end int,
  p_name text, p_dept text, p_email text,
  p_phone text default '', p_purpose text default '', p_attendees int default null
) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_cap int;
  v_tx text;
  v_alpha constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_bytes bytea;
  i int;
begin
  if p_day < current_date or extract(isodow from p_day) > 5 then
    raise exception 'invalid: choose a weekday from today onward';
  end if;
  if p_start < 0 or p_end > 18 or p_end <= p_start then
    raise exception 'invalid: time outside open hours';
  end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid: email';
  end if;

  -- Lock the room row so two requests cannot both pass the overlap check.
  select capacity into v_cap from rooms where id = p_room and active for update;
  if not found then
    raise exception 'invalid: room';
  end if;
  if p_attendees is not null and (p_attendees < 1 or p_attendees > v_cap) then
    raise exception 'invalid: attendees';
  end if;

  if exists (
    select 1 from bookings
    where room_id = p_room and day = p_day and status = 'approved'
      and p_start < end_slot and start_slot < p_end
  ) then
    raise exception 'unavailable';
  end if;

  loop
    v_bytes := gen_random_bytes(10);
    v_tx := 'BK-';
    for i in 0..9 loop
      v_tx := v_tx || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from bookings where tx = v_tx);
  end loop;

  insert into bookings (tx, room_id, day, start_slot, end_slot, name, dept, email, phone, purpose, attendees)
  values (v_tx, p_room, p_day, p_start, p_end, trim(p_name), trim(p_dept), lower(trim(p_email)),
          coalesce(trim(p_phone), ''), coalesce(trim(p_purpose), ''), p_attendees);
  return v_tx;
end;
$$;

-- Public status lookup by transaction number. Never returns name or email.
create or replace function public.track_booking(p_tx text)
returns table (status text, room_name text, day date, start_slot int, end_slot int,
               dept text, purpose text, reason text)
language sql stable security definer set search_path = public
as $$
  select b.status, r.name, b.day, b.start_slot, b.end_slot, b.dept, b.purpose, b.reason
  from bookings b join rooms r on r.id = b.room_id
  where b.tx = upper(p_tx);
$$;

-- True if another pending request overlaps this time (drawer shows a note).
create or replace function public.pending_overlap(p_room uuid, p_day date, p_start int, p_end int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from bookings
    where room_id = p_room and day = p_day and status = 'pending'
      and p_start < end_slot and start_slot < p_end
  );
$$;

grant execute on function public.create_booking(uuid, date, int, int, text, text, text, text, text, int) to anon, authenticated;
grant execute on function public.track_booking(text) to anon, authenticated;
grant execute on function public.pending_overlap(uuid, date, int, int) to anon, authenticated;
