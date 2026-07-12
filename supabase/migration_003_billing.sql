-- Billing/subscription support. Additive only — does not touch existing
-- bookings, services, employees, or waitlist data.
--
-- Every business gets a 14-day free trial (trial_ends_at) starting now.
-- paid_until tracks how long they've paid for; when both trial_ends_at and
-- paid_until are in the past, the business is "expired" and both the
-- dashboard and the customer booking page lock until they pay again.
--
-- Existing businesses are grandfathered in with a long paid_until so this
-- migration never locks anyone out who was already using the app.

alter table business add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days');
alter table business add column if not exists paid_until timestamptz;
alter table business add column if not exists payment_pending_since timestamptz;

update business set paid_until = now() + interval '365 days' where paid_until is null;

-- Single-row table of platform-wide settings (e.g. bank transfer details
-- shown to owners on the Billing page), editable from /admin.
create table if not exists platform_settings (
  id boolean primary key default true check (id),
  bank_transfer_instructions text
);
insert into platform_settings (id, bank_transfer_instructions)
values (true, null)
on conflict (id) do nothing;
