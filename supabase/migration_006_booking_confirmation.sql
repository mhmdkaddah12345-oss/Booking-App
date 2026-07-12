-- Owner confirmation for bookings. Adds a "pending" status between a
-- customer's request and the owner's acceptance. Pending bookings still
-- hold the time slot (no double-booking risk) — the exclusion constraint
-- now applies to both 'pending' and 'booked', not just 'booked'.
--
-- Existing rows are untouched: they're already 'booked' or 'cancelled',
-- which both remain valid values, so no data migration is needed.

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending', 'booked', 'cancelled'));

alter table bookings drop constraint if exists no_overlapping_bookings;
alter table bookings add constraint no_overlapping_bookings
  exclude using gist (employee_id with =, time_range with &&)
  where (status in ('pending', 'booked'));
