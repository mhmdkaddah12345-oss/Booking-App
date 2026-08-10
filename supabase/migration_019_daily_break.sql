-- Optional recurring daily break (e.g. a lunch break) blocked out of every
-- day's availability, on top of the business's regular open/close hours.
-- Null on both means no break is configured.
alter table business add column break_start_time time;
alter table business add column break_end_time time;
