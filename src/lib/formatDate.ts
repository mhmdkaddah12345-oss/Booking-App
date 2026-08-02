// Consistent "2 Aug 2026" style everywhere a booking/waitlist date is
// displayed as information (lists, modals, WhatsApp messages) — as
// opposed to compact UI chrome like quick-day pills or calendar headers,
// which keep their own denser formats.
//
// en-GB (not the default "undefined"/en-US locale) is what actually
// produces day-month-year order in English — the default renders
// "Aug 2, 2026" instead. Arabic locales already order day-month-year
// natively; ar-u-nu-latn keeps Latin digits for the day/year, matching
// the numeral style used for prices/times elsewhere.
export function formatDisplayDate(dateStr: string, lang: "en" | "ar"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = lang === "ar" ? "ar-u-nu-latn" : "en-GB";
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

// Same format, for a full ISO timestamp (e.g. trial_ends_at, paid_until)
// rather than a plain "YYYY-MM-DD" date.
export function formatDisplayDateTime(iso: string, lang: "en" | "ar" = "en"): string {
  const locale = lang === "ar" ? "ar-u-nu-latn" : "en-GB";
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}
