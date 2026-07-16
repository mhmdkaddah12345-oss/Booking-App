-- The admin session cookie used to just be the raw ADMIN_PASSWORD value
-- (documented reason: middleware runs on the Edge runtime, which can't use
-- Node's crypto/Buffer the same way). That meant the actual admin password
-- travelled in a cookie on every request. Mirrors the owner `sessions`
-- table instead: a random opaque token that reveals nothing if it leaks,
-- and can be individually revoked.

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
