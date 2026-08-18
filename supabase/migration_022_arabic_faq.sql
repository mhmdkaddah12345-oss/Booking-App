-- Optional Arabic versions of an FAQ's question/answer, shown on the public
-- booking page when a customer views it in Arabic. Falls back to the
-- default (English) text when not filled in, same pattern as
-- business name_ar/about_ar and services.name_ar.
alter table faqs add column question_ar text;
alter table faqs add column answer_ar text;
