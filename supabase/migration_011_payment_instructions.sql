-- Payments are now limited to OMT and Whish Money (bank transfer removed
-- from the flow) — rename the column so it matches what it actually holds.
alter table platform_settings rename column bank_transfer_instructions to payment_instructions;
