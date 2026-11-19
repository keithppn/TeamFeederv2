-- 02 Staff workspace: real email delivery. Run after 003_staff_workspace.sql.
-- The send-booking-email edge function sets these after it tries to deliver a mail_log row.
alter table public.mail_log
  add column sent_at timestamptz,
  add column error text not null default '';
