-- Phase 1 schema: single business, services, employees, bookings, waitlist.
-- The EXCLUDE constraint on bookings is the DB-level guarantee against
-- double-booking the same employee for overlapping times, even under
-- simultaneous requests -- this replaces the in-memory check the app used
-- to do in application code.

create extension if not exists btree_gist;

drop table if exists waitlist cascade;
drop table if exists bookings cascade;
drop table if exists employees cascade;
drop table if exists services cascade;
drop table if exists business cascade;

create table business (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_hour int not null,
  end_hour int not null,
  slot_granularity_minutes int not null default 15,
  off_days int[] not null default '{}'
);

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  name text not null,
  duration_minutes int not null
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
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  time_range tsrange generated always as (
    tsrange((date + time)::timestamp, (date + time)::timestamp + make_interval(mins => duration_minutes))
  ) stored
);

alter table bookings
  add constraint no_overlapping_bookings
  exclude using gist (employee_id with =, time_range with &&)
  where (status = 'booked');

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

-- Seed data matching what the app currently has configured.
do $$
declare
  biz_id uuid;
begin
  insert into business (name, start_hour, end_hour, off_days)
  values ('Mohammad''s Salon', 9, 18, array[0, 6])
  returning id into biz_id;

  insert into services (business_id, name, duration_minutes) values
    (biz_id, 'Haircut', 30),
    (biz_id, 'Coloring', 90),
    (biz_id, 'Blowout', 45),
    (biz_id, 'Nails', 30);

  insert into employees (business_id, name) values
    (biz_id, 'Staff Member 1'),
    (biz_id, 'Sarah');
end $$;
