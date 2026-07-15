-- Owner-side web push notifications (e.g. "New booking request"). Each row
-- is one browser/device subscription; a business can have several (owner
-- logged in on phone + desktop). endpoint is unique per subscription.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_business_id_idx on push_subscriptions(business_id);
