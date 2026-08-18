-- Optional Arabic versions of the business name and About blurb, shown on
-- the public booking page when a customer views it in Arabic. Falls back
-- to the default (English) name/about when not filled in. The primary
-- `name` column stays the single canonical name used everywhere else
-- (dashboard, admin, slugs, WhatsApp messages, login) — this only affects
-- what a customer sees on the booking page itself.
alter table business add column name_ar text;
alter table business add column about_ar text;
