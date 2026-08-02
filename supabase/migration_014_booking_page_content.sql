-- Content for the richer customer-facing booking page: an about blurb, a
-- hero photo, a gallery, and an FAQ list that owners fill in from Settings.
alter table business add column about text;
alter table business add column hero_image_url text;
alter table business add column hero_image_path text;

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
