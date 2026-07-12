-- Collect the owner's phone number at signup so the platform admin can
-- reach out directly (WhatsApp/call) before activating their account.
-- Additive only — nullable, so existing businesses are unaffected.

alter table business add column if not exists owner_phone text;
