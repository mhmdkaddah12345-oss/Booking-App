-- Lets an owner opt in to letting customers pick a specific staff member
-- when booking, instead of always auto-assigning whoever's free. Off by
-- default so existing businesses keep today's auto-assign behavior.
alter table business add column allow_employee_choice boolean not null default false;
