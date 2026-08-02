-- Optional price shown to customers alongside each service's duration.
alter table services add column price_usd numeric(10,2);
