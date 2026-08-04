-- Optional business logo, shown on the booking page instead of the
-- generated initials badge (header, hero mockup avatar, footer).
alter table business add column logo_url text;
alter table business add column logo_path text;
