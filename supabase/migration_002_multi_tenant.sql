-- Multi-tenant migration: add owner login + slug to business, add a
-- sessions table for real per-business logins (replacing the shared
-- dashboard password). This is additive only — it does not touch any
-- existing bookings, services, employees, or waitlist data.

alter table business add column if not exists slug text;
alter table business add column if not exists owner_email text;
alter table business add column if not exists password_hash text;

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Attach a real login to your existing business (Mohammad's Salon) without
-- touching any of its existing bookings/services/employees.
update business
set
  slug = 'mohammads-salon',
  owner_email = 'mhmdkaddah12345@gmail.com',
  password_hash = '82a9b472cccf366c6b35b422bc2f3340:bcdf417a7074ff76ab638372625828dcfec07c0ec8e8528d84fcb64d56b4ec25dd8757ce3863f570c343be3c1b9f082631655748fa34f66f4d9be773a8ab932e'
where slug is null;

alter table business alter column slug set not null;
alter table business alter column owner_email set not null;
alter table business alter column password_hash set not null;
alter table business add constraint business_slug_unique unique (slug);
alter table business add constraint business_owner_email_unique unique (owner_email);
