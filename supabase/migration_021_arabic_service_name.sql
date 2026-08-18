-- Optional Arabic version of a service's name, shown on the public booking
-- page when a customer views it in Arabic. Falls back to the default
-- (English) name when not filled in, same pattern as business name_ar/about_ar.
alter table services add column name_ar text;
