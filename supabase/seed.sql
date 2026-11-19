-- Demo data. Run after migrations/001_init.sql.
-- First create these 3 users (Dashboard -> Authentication -> Add user, password demo1234, auto-confirm):
--   super@bookroom.example, admin1@bookroom.example, admin2@bookroom.example

-- Safe to re-run: existing rooms (by name) and bookings (by tx) are skipped.
insert into public.rooms (name, location, capacity, equipment)
select v.name, v.location, v.capacity, v.equipment
from (values
  ('Boardroom A', 'Floor 3, East Wing', 12, '{Display,"Video conferencing",Whiteboard}'::text[]),
  ('Meeting Room B', 'Floor 2, Main Hall', 8, '{Display,Whiteboard}'::text[]),
  ('Huddle Room C', 'Floor 2, Annex', 4, '{Display}'::text[]),
  ('Training Room D', 'Floor 1, West Wing', 24, '{Projector,Microphones,"Flexible seating"}'::text[])
) as v(name, location, capacity, equipment)
where not exists (select 1 from public.rooms r where r.name = v.name);

-- Days are offsets from Monday of the current week (next week's Monday on weekends), like the prototype.
insert into public.bookings (tx, room_id, day, start_slot, end_slot, name, dept, email, phone, purpose, attendees,
                             status, reason, created_at, decided_at)
select v.tx, r.id, date_trunc('week', current_date + 2)::date + v.d, v.s, v.e, v.name, v.dept, v.email,
       '0917 555 0100', v.purpose, v.att, v.status, v.reason,
       now() - make_interval(hours => v.ago),
       case when v.after is null then null else now() - make_interval(hours => v.ago - v.after) end
from (values
  ('BK-7F3K9Q2M4X', 'Boardroom A', 0, 2, 6, 'Maria Santos', 'Finance', 'maria.santos@example.com', 'Budget review', 8, 'approved', '', 30, 3),
  ('BK-2H8D5N6RWA', 'Boardroom A', 2, 10, 14, 'Jose Reyes', 'HR', 'jose.reyes@example.com', 'Onboarding session', 10, 'approved', '', 52, 5),
  ('BK-9C4M7T1VZE', 'Boardroom A', 3, 4, 6, 'Liza Tan', 'IT', 'liza.tan@example.com', 'Sprint planning', 6, 'pending', '', 5, null),
  ('BK-5P2X8G3KJB', 'Meeting Room B', 1, 0, 3, 'Paolo Garcia', 'Operations', 'paolo.garcia@example.com', 'Ops stand-up', 6, 'approved', '', 40, 2),
  ('BK-3R6W9Y4DNQ', 'Meeting Room B', 4, 12, 16, 'Maria Santos', 'Finance', 'maria.santos@example.com', 'Audit prep', 5, 'pending', '', 9, null),
  ('BK-8T1B4F7HSC', 'Huddle Room C', 0, 12, 14, 'Liza Tan', 'IT', 'liza.tan@example.com', 'Vendor call', 3, 'declined', 'Room is closed for maintenance that afternoon.', 26, 4),
  ('BK-6M3Z2E9QVD', 'Huddle Room C', 3, 2, 8, 'Jose Reyes', 'HR', 'jose.reyes@example.com', 'Interview panel', 3, 'approved', '', 60, 6),
  ('BK-4K7J5A8XPG', 'Training Room D', 2, 4, 8, 'Carlo Mendoza', 'Operations', 'carlo.mendoza@example.com', 'Safety training', 20, 'pending', '', 20, null)
) as v(tx, room, d, s, e, name, dept, email, purpose, att, status, reason, ago, after)
join (select distinct on (name) id, name from public.rooms order by name, id) r on r.name = v.room
on conflict (tx) do nothing;

insert into public.profiles (id, name, role)
select u.id, p.name, p.role
from auth.users u
join (values
  ('vestiljohnmichaeljv@gmail.com', 'John Michael Vestil', 'super_admin'),
  ('reymondxtrm@gmail.com', 'Reymond Ricaborda', 'admin'),
  ('jumarebejenia@gmail.com', 'Jumare Bejenia', 'admin')
) as p(email, name, role) on u.email = p.email
on conflict (id) do update set name = excluded.name, role = excluded.role;

-- Room assignments for the Admins above (needs 003_staff_workspace.sql), like the prototype:
-- first Admin -> Boardroom A and Meeting Room B, second Admin -> Meeting Room B and Huddle Room C.
insert into public.room_admins (user_id, room_id)
select u.id, r.id
from auth.users u
join (values
  ('reymondxtrm@gmail.com', 'Boardroom A'),
  ('reymondxtrm@gmail.com', 'Meeting Room B'),
  ('jumarebejenia@gmail.com', 'Meeting Room B'),
  ('jumarebejenia@gmail.com', 'Huddle Room C')
) as a(email, room) on u.email = a.email
join public.rooms r on r.name = a.room
on conflict do nothing;
