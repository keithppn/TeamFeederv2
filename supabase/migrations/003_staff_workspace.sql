-- 02 Staff workspace. Run after 002_availability.sql.
-- Staff read their scope through RLS; every change goes through a security definer RPC
-- that checks the caller's role and room assignment.

create table public.room_admins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  primary key (user_id, room_id)
);

-- Emails the system would send. Nothing is delivered; the workspace shows this log.
create table public.mail_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('received', 'approved', 'declined')),
  booking_id uuid references public.bookings(id) on delete cascade,
  room_id uuid not null references public.rooms(id),
  to_email text not null,
  tx text not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.room_admins enable row level security;
alter table public.mail_log enable row level security;
alter table public.audit_log enable row level security;

-- ---------- role helpers (used by policies, so callable by signed-in users) ----------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from profiles where id = auth.uid()) $$;

create or replace function public.is_super() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin') $$;

-- Super Admins act on every room; Admins only on rooms assigned to them.
create or replace function public.can_act(p_room uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select is_super() or exists (select 1 from room_admins where user_id = auth.uid() and room_id = p_room) $$;

-- ---------- read access for staff ----------
create policy "staff read all rooms" on public.rooms
  for select to authenticated using (is_staff());
create policy "staff read bookings in their rooms" on public.bookings
  for select to authenticated using (can_act(room_id));
create policy "staff read inquiries in their rooms" on public.inquiries
  for select to authenticated using (case when room_id is null then is_super() else can_act(room_id) end);
create policy "staff read mail log in their rooms" on public.mail_log
  for select to authenticated using (can_act(room_id));
create policy "super admins read audit log" on public.audit_log
  for select to authenticated using (is_super());
create policy "staff read room assignments" on public.room_admins
  for select to authenticated using (is_staff());

-- ---------- internal helpers (only called from the RPCs below) ----------
create or replace function public.log_audit(p_text text) returns void
language sql security definer set search_path = public
as $$
  insert into audit_log (actor, actor_name, text)
  select auth.uid(), coalesce((select name from profiles where id = auth.uid()), 'System'), p_text;
$$;

create or replace function public.new_tx() returns text
language plpgsql volatile security definer set search_path = public, extensions
as $$
declare
  v_alpha constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_bytes bytea;
  v_tx text;
  i int;
begin
  loop
    v_bytes := gen_random_bytes(10);
    v_tx := 'BK-';
    for i in 0..9 loop
      v_tx := v_tx || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from bookings where tx = v_tx);
  end loop;
  return v_tx;
end;
$$;

-- Shared server-side checks for a new booking. Locks the room row so two requests
-- cannot both pass the overlap check. Only approved bookings block a time.
create or replace function public.check_booking(p_room uuid, p_day date, p_start int, p_end int,
                                                p_email text, p_attendees int) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_cap int;
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
end;
$$;

revoke execute on function public.log_audit(text) from public, anon, authenticated;
revoke execute on function public.new_tx() from public, anon, authenticated;
revoke execute on function public.check_booking(uuid, date, int, int, text, int) from public, anon, authenticated;

-- ---------- visitor booking: same behaviour as 001, now also logs the "received" email ----------
create or replace function public.create_booking(
  p_room uuid, p_day date, p_start int, p_end int,
  p_name text, p_dept text, p_email text,
  p_phone text default '', p_purpose text default '', p_attendees int default null
) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_tx text;
  v_id uuid;
begin
  perform check_booking(p_room, p_day, p_start, p_end, p_email, p_attendees);
  v_tx := new_tx();
  insert into bookings (tx, room_id, day, start_slot, end_slot, name, dept, email, phone, purpose, attendees)
  values (v_tx, p_room, p_day, p_start, p_end, trim(p_name), trim(p_dept), lower(trim(p_email)),
          coalesce(trim(p_phone), ''), coalesce(trim(p_purpose), ''), p_attendees)
  returning id into v_id;
  insert into mail_log (kind, booking_id, room_id, to_email, tx)
  values ('received', v_id, p_room, lower(trim(p_email)), v_tx);
  return v_tx;
end;
$$;

-- ---------- staff RPCs ----------
create or replace function public.approve_booking(p_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  b bookings;
begin
  select * into b from bookings where id = p_id for update;
  if not found or not can_act(b.room_id) then raise exception 'forbidden'; end if;
  if b.status <> 'pending' then raise exception 'invalid: only pending requests can be approved'; end if;
  perform 1 from rooms where id = b.room_id for update;
  if exists (
    select 1 from bookings
    where room_id = b.room_id and day = b.day and status = 'approved' and id <> b.id
      and b.start_slot < end_slot and start_slot < b.end_slot
  ) then
    raise exception 'unavailable';
  end if;
  update bookings set status = 'approved', decided_at = now() where id = p_id;
  insert into mail_log (kind, booking_id, room_id, to_email, tx) values ('approved', b.id, b.room_id, b.email, b.tx);
  perform log_audit('approved ' || b.tx);
end;
$$;

create or replace function public.decline_booking(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  b bookings;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  select * into b from bookings where id = p_id for update;
  if not found or not can_act(b.room_id) then raise exception 'forbidden'; end if;
  if b.status <> 'pending' then raise exception 'invalid: only pending requests can be declined'; end if;
  if v_reason = '' then raise exception 'invalid: please add a reason so the Client knows why'; end if;
  update bookings set status = 'declined', decided_at = now(), reason = v_reason where id = p_id;
  insert into mail_log (kind, booking_id, room_id, to_email, tx, reason)
  values ('declined', b.id, b.room_id, b.email, b.tx, v_reason);
  perform log_audit('declined ' || b.tx);
end;
$$;

-- Manual booking: saved as approved; created_by holds the staff user id.
create or replace function public.staff_create_booking(
  p_room uuid, p_day date, p_start int, p_end int,
  p_name text, p_dept text, p_email text,
  p_phone text default '', p_purpose text default '', p_attendees int default null
) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_tx text;
begin
  if not can_act(p_room) then raise exception 'forbidden'; end if;
  perform check_booking(p_room, p_day, p_start, p_end, p_email, p_attendees);
  v_tx := new_tx();
  insert into bookings (tx, room_id, day, start_slot, end_slot, name, dept, email, phone, purpose, attendees,
                        status, decided_at, created_by)
  values (v_tx, p_room, p_day, p_start, p_end, trim(p_name), trim(p_dept), lower(trim(p_email)),
          coalesce(trim(p_phone), ''), coalesce(trim(p_purpose), ''), p_attendees,
          'approved', now(), auth.uid()::text);
  perform log_audit('created manual booking ' || v_tx);
  return v_tx;
end;
$$;

create or replace function public.reply_inquiry(p_id uuid, p_text text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  i inquiries;
begin
  select * into i from inquiries where id = p_id for update;
  if not found or not (case when i.room_id is null then is_super() else can_act(i.room_id) end) then
    raise exception 'forbidden';
  end if;
  if trim(coalesce(p_text, '')) = '' then raise exception 'invalid: write a reply first'; end if;
  update inquiries set status = 'answered', response = trim(p_text) where id = p_id;
  perform log_audit('answered an inquiry from ' || i.name);
end;
$$;

create or replace function public.add_room(p_name text, p_capacity int, p_location text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_super() then raise exception 'forbidden'; end if;
  if trim(coalesce(p_name, '')) = '' or p_capacity is null or p_capacity < 1 then
    raise exception 'invalid: enter a room name and a capacity of 1 or more';
  end if;
  insert into rooms (name, capacity, location)
  values (trim(p_name), p_capacity, coalesce(nullif(trim(p_location), ''), 'Location to be added'))
  returning id into v_id;
  perform log_audit('added room ' || trim(p_name));
  return v_id;
end;
$$;

create or replace function public.update_room(p_id uuid, p_name text, p_capacity int, p_location text,
                                              p_active boolean) returns void
language plpgsql security definer set search_path = public
as $$
declare
  r rooms;
begin
  if not is_super() then raise exception 'forbidden'; end if;
  if trim(coalesce(p_name, '')) = '' or p_capacity is null or p_capacity < 1 then
    raise exception 'invalid: enter a room name and a capacity of 1 or more';
  end if;
  select * into r from rooms where id = p_id for update;
  if not found then raise exception 'invalid: room'; end if;
  update rooms set name = trim(p_name), capacity = p_capacity, location = trim(coalesce(p_location, '')),
                   active = p_active
  where id = p_id;
  if r.active <> p_active then
    perform log_audit(case when p_active then 'activated ' else 'deactivated ' end || r.name);
  end if;
end;
$$;

create or replace function public.set_room_admin(p_user uuid, p_room uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user text;
  v_room text;
begin
  if not is_super() then raise exception 'forbidden'; end if;
  select name into v_user from profiles where id = p_user and role = 'admin';
  if not found then raise exception 'invalid: admin'; end if;
  select name into v_room from rooms where id = p_room;
  if not found then raise exception 'invalid: room'; end if;
  if p_on then
    insert into room_admins (user_id, room_id) values (p_user, p_room) on conflict do nothing;
    perform log_audit('assigned ' || v_room || ' to ' || v_user);
  else
    delete from room_admins where user_id = p_user and room_id = p_room;
    perform log_audit('removed ' || v_room || ' from ' || v_user);
  end if;
end;
$$;

-- Admins with their sign-in email, for the Super Admin's assignment table.
create or replace function public.list_admins() returns table (id uuid, name text, email text)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not is_super() then raise exception 'forbidden'; end if;
  return query
    select p.id, p.name, u.email::text
    from profiles p join auth.users u on u.id = p.id
    where p.role = 'admin'
    order by p.name;
end;
$$;

revoke execute on function public.approve_booking(uuid) from public, anon;
revoke execute on function public.decline_booking(uuid, text) from public, anon;
revoke execute on function public.staff_create_booking(uuid, date, int, int, text, text, text, text, text, int) from public, anon;
revoke execute on function public.reply_inquiry(uuid, text) from public, anon;
revoke execute on function public.add_room(text, int, text) from public, anon;
revoke execute on function public.update_room(uuid, text, int, text, boolean) from public, anon;
revoke execute on function public.set_room_admin(uuid, uuid, boolean) from public, anon;
revoke execute on function public.list_admins() from public, anon;
grant execute on function public.approve_booking(uuid) to authenticated;
grant execute on function public.decline_booking(uuid, text) to authenticated;
grant execute on function public.staff_create_booking(uuid, date, int, int, text, text, text, text, text, int) to authenticated;
grant execute on function public.reply_inquiry(uuid, text) to authenticated;
grant execute on function public.add_room(text, int, text) to authenticated;
grant execute on function public.update_room(uuid, text, int, text, boolean) to authenticated;
grant execute on function public.set_room_admin(uuid, uuid, boolean) to authenticated;
grant execute on function public.list_admins() to authenticated;
