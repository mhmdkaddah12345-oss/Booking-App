-- Consolidated schema snapshot — this reflects the full current state of
-- the live database (as of migration_019) in one file, for setting up a
-- fresh environment from scratch. It intentionally does NOT match the
-- individual migration_NNN_*.sql files one-for-one (those are the actual
-- history and should stay as-is); this file is a single point-in-time
-- consolidation of what running all of them in order produces.
--
-- Do not run this against a database that already has these tables —
-- it's additive-vs-empty, not idempotent-vs-partially-migrated. For an
-- existing database, run any migration_NNN files it's missing instead.

create extension if not exists btree_gist;
create extension if not exists pgcrypto; -- gen_random_uuid()

drop table if exists schedule_exceptions cascade;
drop table if exists faqs cascade;
drop table if exists gallery_photos cascade;
drop table if exists contact_messages cascade;
drop table if exists push_subscriptions cascade;
drop table if exists admin_sessions cascade;
drop table if exists sessions cascade;
drop table if exists waitlist cascade;
drop table if exists bookings cascade;
drop table if exists employees cascade;
drop table if exists services cascade;
drop table if exists platform_settings cascade;
drop table if exists business cascade;

-- One row per tenant. Everything else in the schema is scoped to a
-- business_id (either directly or via a foreign key chain).
create table business (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_hour int not null,
  end_hour int not null,
  slot_granularity_minutes int not null default 15,
  off_days int[] not null default '{}', -- days of week closed, 0=Sunday..6=Saturday

  -- Recurring daily break (e.g. lunch) — null on both means no break.
  break_start_time time,
  break_end_time time,

  -- Owner login.
  slug text not null unique,
  owner_email text not null unique,
  owner_phone text,
  password_hash text, -- null until the platform admin activates the account

  -- Password recovery (admin-issued one-time code, owner sets their own new password).
  reset_code_hash text,
  reset_code_expires_at timestamptz,

  -- Subscription/billing. A business is "expired" (locked) once both
  -- trial_ends_at and paid_until are in the past.
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  paid_until timestamptz,
  payment_pending_since timestamptz,
  payment_pending_plan text,

  -- Booking page customization.
  about text,
  hero_image_url text,
  hero_image_path text,
  logo_url text,
  logo_path text,
  accent_color text,

  -- Let customers pick a specific staff member instead of always
  -- auto-assigning whoever's free. Off by default.
  allow_employee_choice boolean not null default false
);

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  name text not null,
  duration_minutes int not null,
  price_usd numeric(10,2) -- optional, shown to customers alongside duration
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  name text not null
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  date date not null,
  time time not null,
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  duration_minutes int not null,
  customer_name text not null,
  customer_phone text not null,
  note text,
  employee_id uuid references employees(id) on delete set null,
  employee_name text not null,
  status text not null default 'booked' check (status in ('pending', 'booked', 'cancelled')),
  time_range tsrange generated always as (
    tsrange((date + time)::timestamp, (date + time)::timestamp + make_interval(mins => duration_minutes))
  ) stored
);

-- DB-level guarantee against double-booking the same employee for
-- overlapping times, even under simultaneous requests — 'pending' bookings
-- hold the slot exactly like 'booked' ones do.
alter table bookings
  add constraint no_overlapping_bookings
  exclude using gist (employee_id with =, time_range with &&)
  where (status in ('pending', 'booked'));

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  date date not null,
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  duration_minutes int not null,
  customer_name text not null,
  customer_phone text not null,
  note text,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'confirmed')),
  created_at timestamptz not null default now(),
  notified_time time
);

-- Owner login sessions — a random opaque token backed by this table rather
-- than a signed cookie, so a session can be individually revoked (e.g. on
-- password change) without needing a shared secret rotation.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Same pattern for the platform admin login (single shared ADMIN_PASSWORD
-- env var, but the cookie itself is an opaque session token, not the
-- password).
create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Owner-side web push subscriptions (e.g. "New booking request"). A
-- business can have several — logged in on phone + desktop.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_business_id_idx on push_subscriptions(business_id);

-- One-off schedule exceptions on top of the weekly off_days: a specific
-- date can be closed entirely (start_time/end_time both null) or just have
-- a busy time range blocked out (both set) while the rest of the day stays
-- open per the business's regular hours.
create table schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now()
);

create index schedule_exceptions_business_date_idx on schedule_exceptions(business_id, date);

create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  url text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Single-row table of platform-wide settings (e.g. payment instructions
-- shown to owners on the Billing page), editable from /admin.
create table platform_settings (
  id boolean primary key default true check (id),
  payment_instructions text
);
insert into platform_settings (id, payment_instructions) values (true, null);

-- Landing page "Contact us" form submissions, reviewed by the platform
-- admin in /admin — no outbound email service wired up.
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
