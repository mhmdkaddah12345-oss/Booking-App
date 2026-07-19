-- Tracks which plan (monthly / half_year / yearly) an owner said they paid
-- for when they report a bank transfer, so the admin knows how many days to
-- extend when confirming — instead of always assuming a 30-day renewal.
alter table business add column if not exists payment_pending_plan text;
