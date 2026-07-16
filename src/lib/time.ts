// Vercel's serverless functions run in UTC regardless of where the request
// comes from. Every business using this app is in Lebanon (Asia/Beirut,
// UTC+2/+3 with DST), so any "what time is it right now" check for booking
// eligibility must be computed in that timezone explicitly — using the
// server's raw local time would treat already-passed slots as still
// bookable for a few hours around the UTC/Beirut offset each day.

const BUSINESS_TIMEZONE = "Asia/Beirut";

export function beirutNow(): { dateStr: string; minutesSinceMidnight: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour")) % 24; // some ICU implementations report midnight as "24"
  const minute = Number(get("minute"));
  return { dateStr, minutesSinceMidnight: hour * 60 + minute };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Monday–Sunday range (as date strings) containing "today" in Beirut time — used for "this week" dashboard stats. */
export function beirutWeekRange(): { weekStart: string; weekEnd: string } {
  const { dateStr } = beirutNow();
  const [y, m, d] = dateStr.split("-").map(Number);
  const current = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = current.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(current);
  monday.setUTCDate(current.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const fmt = (dt: Date) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
}
