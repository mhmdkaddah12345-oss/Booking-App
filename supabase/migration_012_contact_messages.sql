-- Landing page "Contact us" form submissions — no outbound email service,
-- just stored here for the platform admin to review in /admin.
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
