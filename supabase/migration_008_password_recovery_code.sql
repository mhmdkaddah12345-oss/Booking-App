-- Admin-mediated "forgot password" without the admin ever seeing the
-- owner's new password: admin generates a one-time recovery code (hashed,
-- like a password), sends it to the owner manually, and the owner uses it
-- to set their own new password on a public page. The code is cleared
-- after use (or expiry) so it can't be replayed.

alter table business add column if not exists reset_code_hash text;
alter table business add column if not exists reset_code_expires_at timestamptz;
