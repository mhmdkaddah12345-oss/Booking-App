import { landingCopy, Lang } from "@/lib/landingTranslations";
import { cardClass, cardAccentBarClass, cardTopBorderClass, statTileClass } from "@/lib/ui";
import { IconCalendar, IconChartBar, IconTrendingUp, IconUsers } from "./icons";

// Same palette used to color-code staff on the real dashboard calendar
// (src/app/dashboard/page.tsx — EMPLOYEE_COLORS).
const EMPLOYEE_COLORS = ["#b5654f", "#46614f", "#b98b3e"];

// Sample bookings for the calendar mockup, as (day offset from today,
// minutes since 9:00am, duration minutes, customer name, staff color index).
// Kept well inside a 9am-5pm (480-minute) window so nothing clips.
const CALENDAR_BOOKINGS: {
  dayOffset: number;
  startMin: number;
  durationMin: number;
  name: string;
  colorIndex: number;
}[] = [
  { dayOffset: 0, startMin: 30, durationMin: 30, name: "Layla Haddad", colorIndex: 0 },
  { dayOffset: 0, startMin: 120, durationMin: 60, name: "Nour Fares", colorIndex: 1 },
  { dayOffset: 0, startMin: 270, durationMin: 30, name: "Maya Saade", colorIndex: 2 },
  { dayOffset: 1, startMin: 0, durationMin: 30, name: "Karim Zein", colorIndex: 1 },
  { dayOffset: 1, startMin: 210, durationMin: 60, name: "Rita Aoun", colorIndex: 0 },
  { dayOffset: 2, startMin: 60, durationMin: 60, name: "Sami Khoury", colorIndex: 2 },
  { dayOffset: 2, startMin: 330, durationMin: 30, name: "Dana Fakih", colorIndex: 0 },
  { dayOffset: 3, startMin: 150, durationMin: 30, name: "Yara Nassar", colorIndex: 1 },
  { dayOffset: 4, startMin: 240, durationMin: 60, name: "Elie Sarkis", colorIndex: 2 },
  { dayOffset: 4, startMin: 420, durationMin: 30, name: "Ghida Rahal", colorIndex: 0 },
];

const CALENDAR_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const CALENDAR_WINDOW_MIN = 480; // 9am-5pm

// A static recreation of the real owner dashboard/reports/customers pages —
// same component classes as the real app (cardClass, statTileClass, etc.),
// just fed made-up demo numbers — wrapped in the same "browser window"
// chrome as BookingPreviewMockup so the two previews read as one pair.
function BrowserFrame({
  url,
  children,
  className = "",
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-zinc-200 ${className}`}>
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span dir="ltr" className="ms-2 truncate rounded-full bg-white px-3 py-1 text-[11px] text-zinc-400 ring-1 ring-zinc-200">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={statTileClass}>
      <p className="text-lg font-semibold tabular-nums text-zinc-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

export default function DashboardPreviewMockup({ lang = "en" }: { lang?: Lang }) {
  const t = landingCopy[lang].ownerMockup;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dateLocale = lang === "ar" ? "ar" : "en";

  const today = new Date();
  const calendarDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return { offset: i, label: i === 0 ? t.today : d.toLocaleDateString(dateLocale, { weekday: "short" }) };
  });

  return (
    <div dir={dir} className={`flex flex-col gap-5 ${lang === "ar" ? "lang-ar" : ""}`}>
      <BrowserFrame url="app.maw3edapp.com/dashboard">
        <div className={`${cardClass} rounded-none ring-0`}>
          <div className={cardAccentBarClass} />
          <div className="p-4 text-start sm:p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
              <IconChartBar className="h-4 w-4 text-zinc-500" />
              {t.dashboardTitle}
            </h3>
            <p className="mt-2 text-xs font-medium text-zinc-500">{t.weekAtGlance}</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <StatTile label={t.statAppointments} value={18} />
              <StatTile label={t.statPending} value={2} />
              <StatTile label={t.statCancelled} value={1} />
              <StatTile label={t.statWaitlist} value={3} />
            </div>

            <p className="mt-4 text-xs font-medium text-zinc-500">{t.today}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {t.todayBookings.map((b) => (
                <div
                  key={b.time}
                  className="flex items-center justify-between rounded-lg bg-zinc-900/[0.06] px-3 py-2 text-xs"
                >
                  <span className="font-medium text-zinc-800">
                    {b.time} — {b.name}
                  </span>
                  <span className="text-zinc-500">{b.service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BrowserFrame>

      <BrowserFrame url="app.maw3edapp.com/dashboard">
        <div className={`${cardClass} rounded-none ring-0`}>
          <div className={cardTopBorderClass} />
          <div className="p-4 text-start sm:p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
              <IconCalendar className="h-4 w-4 text-zinc-500" />
              {t.calendarTitle}
            </h3>
            <div dir="ltr" className="mt-3 overflow-x-auto">
              <div className="grid min-w-[480px]" style={{ gridTemplateColumns: "44px repeat(5, minmax(0, 1fr))" }}>
                <div />
                {calendarDays.map((d) => (
                  <div key={d.offset} className="pb-2 text-center text-[11px] font-medium">
                    <span
                      className={
                        d.offset === 0
                          ? "rounded-full bg-zinc-900 px-2 py-0.5 text-white"
                          : "text-zinc-600"
                      }
                    >
                      {d.label}
                    </span>
                  </div>
                ))}

                <div className="relative" style={{ height: 176 }}>
                  {CALENDAR_HOURS.map((h, i) => (
                    <div
                      key={h}
                      className="absolute right-1 -translate-y-1/2 text-[10px] font-medium text-zinc-400"
                      style={{ top: `${(i / (CALENDAR_HOURS.length - 1)) * 100}%` }}
                    >
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {calendarDays.map((d) => (
                  <div
                    key={d.offset}
                    className={`relative border-l border-zinc-100 ${d.offset === 0 ? "bg-zinc-50/60" : ""}`}
                    style={{ height: 176 }}
                  >
                    {CALENDAR_HOURS.slice(0, -1).map((h, i) => (
                      <div
                        key={h}
                        className="pointer-events-none absolute left-0 right-0 border-t border-zinc-100"
                        style={{ top: `${(i / (CALENDAR_HOURS.length - 1)) * 100}%` }}
                      />
                    ))}
                    {CALENDAR_BOOKINGS.filter((b) => b.dayOffset === d.offset).map((b) => (
                      <div
                        key={`${b.dayOffset}-${b.startMin}-${b.name}`}
                        className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-md border-l-2 px-1 py-0.5 text-[10px] font-medium leading-tight text-zinc-800 shadow-sm"
                        style={{
                          top: `${(b.startMin / CALENDAR_WINDOW_MIN) * 100}%`,
                          height: `${Math.max((b.durationMin / CALENDAR_WINDOW_MIN) * 100, 8)}%`,
                          backgroundColor: `${EMPLOYEE_COLORS[b.colorIndex]}22`,
                          borderLeftColor: EMPLOYEE_COLORS[b.colorIndex],
                        }}
                      >
                        {b.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>

      <div className="grid gap-5 sm:grid-cols-2">
        <BrowserFrame url="app.maw3edapp.com/reports">
          <div className={`${cardClass} rounded-none ring-0`}>
            <div className={cardTopBorderClass} />
            <div className="p-4 text-start">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconTrendingUp className="h-4 w-4 text-zinc-500" />
                {t.reportsTitle}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <StatTile label={t.statRevenue} value="$845" />
                <StatTile label={t.statBookings} value={32} />
              </div>
              <p className="mt-3 text-[11px] font-medium text-zinc-500">{t.revenueByService}</p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {t.services.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-lg bg-zinc-900/[0.06] px-3 py-1.5 text-xs"
                  >
                    <span className="text-zinc-700">{s.name}</span>
                    <span className="font-medium text-zinc-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </BrowserFrame>

        <BrowserFrame url="app.maw3edapp.com/customers">
          <div className={`${cardClass} rounded-none ring-0`}>
            <div className={cardTopBorderClass} />
            <div className="p-4 text-start">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconUsers className="h-4 w-4 text-zinc-500" />
                {t.customersTitle}
              </h3>
              <div className="mt-2 flex flex-col gap-1.5">
                {t.customersList.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-1.5 text-xs"
                  >
                    <span className="text-zinc-700">{c.name}</span>
                    <span className="text-zinc-500">{c.visits}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}
