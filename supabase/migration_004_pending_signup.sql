-- New signups no longer set their own password. Instead they land in a
-- "pending" state (password_hash is null) with no working login at all,
-- until the platform admin manually activates them from /admin — generating
-- a one-time password to hand over once payment is confirmed. Additive/loosening
-- only — does not touch any existing business's data or login.

alter table business alter column password_hash drop not null;
