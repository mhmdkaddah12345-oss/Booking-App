-- Lets an owner pick their own accent color for their public booking page
-- instead of the site-wide default terracotta.
alter table business add column accent_color text;
