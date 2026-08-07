-- One-off schedule exceptions on top of the weekly off-days: a specific
-- date can be closed entirely (start_time/end_time both null) or just
-- have a busy time range blocked out (both set) while the rest of the
-- day stays open.
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
