"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OwnerNav from "@/components/OwnerNav";
import Reveal from "@/components/Reveal";
import {
  cardClass,
  cardAccentBarClass,
  listRowHoverClass,
  pulsingDotClass,
  primaryButtonClass,
  ghostButtonClass,
  dangerButtonClass,
  inputClass,
} from "@/lib/ui";
import { IconChartBar, IconClock, IconUsers, IconCalendar, IconPlus } from "@/components/icons";
import { whatsappLink, openWhatsApp } from "@/lib/whatsapp";
import { useOwnerLang } from "@/lib/useOwnerLang";
import { dashboardCopy, type Lang } from "@/lib/dashboardTranslations";
import { formatDisplayDate } from "@/lib/formatDate";

function greeting(t: { greetingMorning: string; greetingAfternoon: string; greetingEvening: string }) {
  const h = new Date().getHours();
  if (h < 12) return t.greetingMorning;
  if (h < 18) return t.greetingAfternoon;
  return t.greetingEvening;
}

// Counts a stat tile up from 0 to its real value on first paint instead of
// popping straight to the number — a small, cheap way to make the "at a
// glance" numbers feel alive rather than static. Skips the animation (jumps
// straight to the target) under reduced-motion.
function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let start: number | null = null;
    let raf: number;
    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

type Booking = {
  id: string;
  date: string;
  time: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  employeeId: string;
  employeeName: string;
  status: "pending" | "booked";
};

type Employee = { id: string; name: string };
type ScheduleException = { id: string; date: string; startTime: string | null; endTime: string | null; note: string | null };
type Service = { id: string; name: string; durationMinutes: number };
type Slot = { time: string; available: boolean };

type DashboardStats = {
  appointmentsThisWeek: number;
  pendingCount: number;
  cancelledThisWeek: number;
  waitlistCount: number;
};

type WaitlistEntry = {
  id: string;
  date: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  status: "waiting" | "notified";
  notifiedTime?: string;
};

const ROW_HEIGHT_PX = 56;

// Per-employee accent colors — cycles through if there are more employees
// than colors. Chosen to sit alongside the terracotta/cedar brand palette
// rather than introducing generic blues/purples.
const EMPLOYEE_COLORS = ["#b5654f", "#46614f", "#b98b3e", "#8c5b7a"];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHourLabel(h: number) {
  return `${pad2(h)}:00`;
}

type SubscriptionStatus = "trial" | "active" | "expired";

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const displayValue = useCountUp(value);
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:bg-zinc-100">
      <p className={`text-2xl font-semibold tabular-nums ${accent ? "text-amber-600" : "text-zinc-900"}`}>
        {displayValue}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [lang, setLang] = useOwnerLang();
  const t = dashboardCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dateLocale = lang === "ar" ? "ar-u-nu-latn" : undefined;

  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [scheduleExceptions, setScheduleExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("trial");
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [now, setNow] = useState(() => new Date());

  const [reserveOpen, setReserveOpen] = useState(false);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  function loadDashboard(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    Promise.all([
      fetch("/api/business").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/business/schedule-exceptions").then((r) => r.json()),
    ])
      .then(([businessData, dashboardData, exceptionsData]) => {
        setStartHour(businessData.business.startHour);
        setEndHour(businessData.business.endHour);
        setOffDays(businessData.business.offDays);
        setEmployees(businessData.business.employees);
        setServices(businessData.business.services);
        setBusinessName(businessData.business.name);
        setSubscriptionStatus(businessData.business.subscriptionStatus);
        setTrialDaysLeft(businessData.business.trialDaysLeft);
        setBookings(dashboardData.bookings);
        setWaitlist(dashboardData.waitlist);
        setStats(dashboardData.stats);
        setScheduleExceptions(exceptionsData.exceptions ?? []);
      })
      .finally(() => {
        if (!opts.silent) setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Keep the board current without a manual refresh: poll periodically, and
  // refetch immediately whenever the tab/app regains focus or visibility
  // (e.g. switching back after being away, or reopening the installed app).
  useEffect(() => {
    const interval = setInterval(() => loadDashboard({ silent: true }), 30_000);
    function handleRefocus() {
      if (document.visibilityState === "visible") loadDashboard({ silent: true });
    }
    document.addEventListener("visibilitychange", handleRefocus);
    window.addEventListener("focus", handleRefocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleRefocus);
      window.removeEventListener("focus", handleRefocus);
    };
  }, []);

  async function handleCancel(id: string) {
    const booking = bookings.find((b) => b.id === id);
    if (booking)
      openWhatsApp(
        whatsappLink(booking.customerPhone, t.message.cancelled({ ...booking, date: formatDisplayDate(booking.date, lang) }))
      );
    setBusyId(id);
    try {
      await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: { "x-dashboard-action": "1" },
      });
      setSelectedBookingId(null);
      loadDashboard();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAccept(id: string) {
    const booking = bookings.find((b) => b.id === id);
    // Fired before the first await — the booking data needed for the
    // message is already in hand, so there's no need to wait for the
    // confirm call to finish.
    if (booking)
      openWhatsApp(
        whatsappLink(booking.customerPhone, t.message.accepted({ ...booking, date: formatDisplayDate(booking.date, lang) }))
      );
    setBusyId(id);
    try {
      await fetch(`/api/bookings/${id}/confirm`, { method: "POST" });
      setSelectedBookingId(null);
      loadDashboard();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(id: string) {
    const booking = bookings.find((b) => b.id === id);
    if (booking)
      openWhatsApp(
        whatsappLink(booking.customerPhone, t.message.declined({ ...booking, date: formatDisplayDate(booking.date, lang) }))
      );
    setBusyId(id);
    try {
      await fetch(`/api/bookings/${id}/decline`, { method: "POST" });
      setSelectedBookingId(null);
      loadDashboard();
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmWaitlist(id: string) {
    const entry = waitlist.find((w) => w.id === id);
    if (entry)
      openWhatsApp(
        whatsappLink(entry.customerPhone, t.message.waitlistConfirmed({ ...entry, date: formatDisplayDate(entry.date, lang) }))
      );
    setBusyId(id);
    try {
      await fetch(`/api/waitlist/${id}/confirm`, { method: "POST" });
      loadDashboard();
    } finally {
      setBusyId(null);
    }
  }

  const fullDayExceptionDates = new Set(
    scheduleExceptions.filter((e) => !e.startTime && !e.endTime).map((e) => e.date)
  );
  const busyExceptionsFor = (date: string) =>
    scheduleExceptions.filter((e) => e.date === date && e.startTime && e.endTime);

  const today = new Date();
  const fiveDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      date,
      label: d.toLocaleDateString(dateLocale, { weekday: "short", month: "short", day: "numeric" }),
      closed: offDays.includes(d.getDay()) || fullDayExceptionDates.has(date),
    };
  });
  const lastGridDate = fiveDays[fiveDays.length - 1].date;

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const gridHeightPx = (endHour - startHour) * ROW_HEIGHT_PX;

  const bookingsByDate = (date: string) => bookings.filter((b) => b.date === date);
  const bookingsFor = (date: string, employeeId: string) =>
    bookings.filter((b) => b.date === date && b.employeeId === employeeId);

  const laterDates = Array.from(new Set(bookings.filter((b) => b.date > lastGridDate).map((b) => b.date))).sort();

  const pendingBookings = bookings
    .filter((b) => b.status === "pending")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // A pending request nobody Accepted/Declined before its own appointment
  // time arrived — flagged rather than auto-resolved, since silently
  // declining would fire an unreviewed "sorry, can't accommodate" WhatsApp
  // message to the customer.
  function isMissed(booking: Booking) {
    return new Date(`${booking.date}T${booking.time}`) < now;
  }

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  // fiveDays[0] is always today, so the current-time line only ever applies
  // to the first column.
  const nowMinutesFromOpen = now.getHours() * 60 + now.getMinutes() - startHour * 60;
  const showNowLine = nowMinutesFromOpen >= 0 && nowMinutesFromOpen <= (endHour - startHour) * 60;
  const nowTopPx = (nowMinutesFromOpen / 60) * ROW_HEIGHT_PX;

  return (
    <div dir={dir} className={`min-h-screen bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="mx-auto max-w-4xl">
        <OwnerNav current="dashboard" lang={lang} onToggleLang={() => setLang(lang === "en" ? "ar" : "en")} />
        <div className="mt-6 flex items-center justify-between">
          <div>
            {!loading && (
              <p className="text-sm font-medium text-zinc-500">
                {greeting(t)}
                {businessName ? `, ${businessName}` : ""}
              </p>
            )}
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900">
              {t.dashboard}
              {!loading && (
                <span
                  className="flex items-center gap-1 text-xs font-medium text-cedar"
                  title="Refreshes automatically"
                >
                  <span className={`${pulsingDotClass} bg-cedar`} />
                  {t.live}
                </span>
              )}
            </h1>
          </div>
          {!loading && subscriptionStatus !== "expired" && (
            <button
              onClick={() => setReserveOpen(true)}
              className={`flex items-center gap-1.5 ${primaryButtonClass}`}
            >
              <IconPlus className="h-4 w-4" />
              {t.reserveForCustomer}
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">{t.loading}</p>
        ) : subscriptionStatus === "expired" ? (
          <div className={`mt-6 ${cardClass}`}>
            <div className={cardAccentBarClass} />
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-zinc-800">{t.subscriptionExpiredTitle}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.subscriptionExpiredBody}</p>
              <Link href="/dashboard/billing" className={`mt-4 inline-block ${primaryButtonClass}`}>
                {t.goToPlan}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {subscriptionStatus === "trial" && trialDaysLeft <= 3 && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
                <span className={`${pulsingDotClass} bg-amber-500`} />
                {t.trialEnding(trialDaysLeft)}{" "}
                <Link href="/dashboard/billing" className="underline">
                  {t.renewNow}
                </Link>
              </div>
            )}

            {stats && (
              <Reveal className={`mt-6 ${cardClass}`}>
                <div className={cardAccentBarClass} />
                <div className="p-4">
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                    <IconChartBar className="h-4 w-4 text-zinc-500" />
                    {t.weekAtGlance}
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile label={t.statAppointments} value={stats.appointmentsThisWeek} />
                    <StatTile label={t.statPending} value={stats.pendingCount} accent={stats.pendingCount > 0} />
                    <StatTile label={t.statCancelled} value={stats.cancelledThisWeek} />
                    <StatTile label={t.statWaitlist} value={stats.waitlistCount} />
                  </div>
                </div>
              </Reveal>
            )}

            {pendingBookings.length > 0 && (
              <Reveal delayMs={60} className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                  <IconClock className="h-4 w-4 text-amber-600" />
                  <span className={`${pulsingDotClass} bg-amber-500`} />
                  {t.pendingRequests(pendingBookings.length)}
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {pendingBookings.map((b) => (
                    <li
                      key={b.id}
                      className={`flex flex-col gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between ${listRowHoverClass}`}
                    >
                      <span className="text-zinc-700">
                        <span className="font-medium text-zinc-800">
                          {formatDisplayDate(b.date, lang)} at {b.time}
                        </span>{" "}
                        — {b.customerName} ({b.customerPhone}) — {b.serviceName} ({b.durationMinutes} min,{" "}
                        {b.employeeName})
                        {isMissed(b) && (
                          <span className="ms-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            {t.missed}
                          </span>
                        )}
                        {b.note && <span className="ms-2 italic text-zinc-500">&ldquo;{b.note}&rdquo;</span>}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {busyId === b.id ? t.busy : t.accept}
                        </button>
                        <button
                          onClick={() => handleDecline(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {busyId === b.id ? t.busy : t.decline}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal delayMs={120} className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="overflow-x-auto p-4">
                <div dir="ltr" className="grid" style={{ gridTemplateColumns: "50px repeat(5, minmax(110px, 1fr))" }}>
                  <div />
                  {fiveDays.map((d, dayIndex) => (
                    <div key={d.date} className="pb-2 text-center text-sm font-medium">
                      <span
                        className={
                          dayIndex === 0
                            ? "rounded-full bg-zinc-900 px-2.5 py-1 text-white shadow-sm"
                            : d.closed
                            ? "text-zinc-300"
                            : "text-zinc-800"
                        }
                      >
                        {dayIndex === 0 ? t.today : d.label}
                      </span>
                      {employees.length > 1 && (
                        <div className="mt-1.5 flex">
                          {employees.map((emp, empIndex) => (
                            <span
                              key={emp.id}
                              className="flex flex-1 items-center justify-center gap-1 truncate text-[10px] font-normal text-zinc-500"
                            >
                              <span
                                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: EMPLOYEE_COLORS[empIndex % EMPLOYEE_COLORS.length] }}
                              />
                              {emp.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="relative" style={{ height: gridHeightPx }}>
                    {hours.map((h, i) => (
                      <div
                        key={h}
                        className="absolute right-1 -translate-y-1/2 text-xs font-medium tracking-wide text-zinc-400"
                        style={{ top: i * ROW_HEIGHT_PX }}
                      >
                        {formatHourLabel(h)}
                      </div>
                    ))}
                  </div>

                  {fiveDays.map((day, dayIndex) => (
                    <div
                      key={day.date}
                      className={`relative flex border-l border-zinc-100 ${dayIndex === 0 ? "bg-zinc-50/60" : ""}`}
                      style={{ height: gridHeightPx }}
                    >
                      {hours.slice(0, -1).map(
                        (h, i) =>
                          i % 2 === 1 && (
                            <div
                              key={`zebra-${h}`}
                              className="pointer-events-none absolute left-0 right-0 bg-zinc-100/40"
                              style={{ top: i * ROW_HEIGHT_PX, height: ROW_HEIGHT_PX }}
                            />
                          )
                      )}
                      {hours.map((h, i) => (
                        <div
                          key={h}
                          className="pointer-events-none absolute left-0 right-0 border-t border-zinc-100"
                          style={{ top: i * ROW_HEIGHT_PX }}
                        />
                      ))}
                      {busyExceptionsFor(day.date).map((ex) => {
                        const startMinutesFromOpen = timeToMinutes(ex.startTime!) - startHour * 60;
                        const endMinutesFromOpen = timeToMinutes(ex.endTime!) - startHour * 60;
                        const topPx = (startMinutesFromOpen / 60) * ROW_HEIGHT_PX;
                        const heightPx = Math.max(((endMinutesFromOpen - startMinutesFromOpen) / 60) * ROW_HEIGHT_PX, 18);
                        return (
                          <div
                            key={ex.id}
                            title={ex.note ?? t.busyBlockDefaultLabel}
                            className="pointer-events-none absolute inset-x-0 z-10 flex items-center justify-center overflow-hidden rounded-md px-1 text-center text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-300"
                            style={{
                              top: topPx,
                              height: heightPx,
                              backgroundColor: "rgba(113,113,122,0.12)",
                              backgroundImage:
                                "repeating-linear-gradient(45deg, rgba(63,63,70,0.12), rgba(63,63,70,0.12) 4px, transparent 4px, transparent 9px)",
                            }}
                          >
                            <span className="truncate">{ex.note || t.busyBlockDefaultLabel}</span>
                          </div>
                        );
                      })}
                      {dayIndex === 0 && showNowLine && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                          style={{ top: nowTopPx }}
                        >
                          <span className="-ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-900 shadow" />
                          <span className="h-px flex-1 bg-zinc-900" />
                        </div>
                      )}
                      {employees.map((emp, empIndex) => {
                        const color = EMPLOYEE_COLORS[empIndex % EMPLOYEE_COLORS.length];
                        return (
                          <div key={emp.id} className="relative flex-1 border-l border-zinc-50 first:border-l-0">
                            {bookingsFor(day.date, emp.id).map((b) => {
                              const startMinutesFromOpen = timeToMinutes(b.time) - startHour * 60;
                              const topPx = (startMinutesFromOpen / 60) * ROW_HEIGHT_PX;
                              const heightPx = Math.max((b.durationMinutes / 60) * ROW_HEIGHT_PX, 18);
                              const isSelected = selectedBookingId === b.id;
                              const isPending = b.status === "pending";
                              return (
                                <button
                                  key={b.id}
                                  onClick={() => setSelectedBookingId(isSelected ? null : b.id)}
                                  style={{
                                    top: topPx,
                                    height: heightPx,
                                    ...(isSelected || isPending
                                      ? undefined
                                      : { backgroundColor: `${color}22`, borderLeftColor: color }),
                                  }}
                                  className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-0.5 text-start text-[11px] font-medium leading-tight shadow-sm transition-all duration-150 hover:z-20 hover:scale-[1.03] hover:shadow-md ${
                                    isSelected
                                      ? "scale-[1.03] border-zinc-900 bg-zinc-900 text-white shadow-md"
                                      : isPending
                                      ? "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                                      : "text-zinc-800 hover:brightness-95"
                                  }`}
                                >
                                  {isPending && (
                                    <span className="me-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 align-middle" />
                                  )}
                                  {b.time} {b.customerName}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {selectedBooking && (
              <div
                className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8"
                onClick={() => setSelectedBookingId(null)}
              >
                <div
                  className={`w-full max-w-md ${cardClass} max-h-full overflow-y-auto`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cardAccentBarClass} />
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-800">{selectedBooking.serviceName}</p>
                      {selectedBooking.status === "pending" && (
                        <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <span className={`${pulsingDotClass} bg-amber-500`} />
                          {t.awaitingConfirmation}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatDisplayDate(selectedBooking.date, lang)} at {selectedBooking.time} (
                      {selectedBooking.durationMinutes} min) — {selectedBooking.employeeName}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {selectedBooking.customerName} ({selectedBooking.customerPhone})
                    </p>
                    {selectedBooking.note && (
                      <p className="mt-1 text-sm italic text-zinc-500">&ldquo;{selectedBooking.note}&rdquo;</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {selectedBooking.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleAccept(selectedBooking.id)}
                            disabled={busyId === selectedBooking.id}
                            className={primaryButtonClass}
                          >
                            {busyId === selectedBooking.id ? t.busy : t.accept}
                          </button>
                          <button
                            onClick={() => handleDecline(selectedBooking.id)}
                            disabled={busyId === selectedBooking.id}
                            className={dangerButtonClass}
                          >
                            {busyId === selectedBooking.id ? t.busy : t.decline}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancel(selectedBooking.id)}
                          disabled={busyId === selectedBooking.id}
                          className={dangerButtonClass}
                        >
                          {busyId === selectedBooking.id ? t.cancelling : t.cancelBooking}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReschedulingBooking(selectedBooking);
                          setSelectedBookingId(null);
                        }}
                        className={ghostButtonClass}
                      >
                        {t.reschedule}
                      </button>
                      <button onClick={() => setSelectedBookingId(null)} className={ghostButtonClass}>
                        {t.close}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Reveal delayMs={180} className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconUsers className="h-4 w-4 text-zinc-500" />
                {t.waitlist}
              </h2>
              {waitlist.length === 0 ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <IconUsers className="h-4 w-4 text-zinc-300" />
                  {t.noOneWaiting}
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {waitlist.map((w) => (
                    <li
                      key={w.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${listRowHoverClass} ${
                        w.status === "notified" ? "bg-amber-50" : "bg-zinc-50"
                      }`}
                    >
                      <span className="text-zinc-700">
                        <span className="font-medium text-zinc-800">{formatDisplayDate(w.date, lang)}</span> — {w.customerName} (
                        {w.customerPhone}) — {w.serviceName} ({w.durationMinutes} min)
                        {w.status === "notified" && (
                          <span className="ms-2 font-medium text-amber-700">{t.notifiedFor(w.notifiedTime ?? "")}</span>
                        )}
                        {w.note && <span className="ms-2 italic text-zinc-500">&ldquo;{w.note}&rdquo;</span>}
                      </span>
                      {w.status === "notified" && (
                        <div className="flex shrink-0 gap-2">
                          <a
                            href={whatsappLink(
                              w.customerPhone,
                              t.message.waitlistSlotOpen({ ...w, date: formatDisplayDate(w.date, lang) })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t.tellThemTitle}
                            className="flex items-center rounded-full bg-[#e7f7ee] px-3 py-1 text-xs font-medium text-[#1f7a4d] transition-all duration-150 hover:scale-[1.05] hover:bg-[#d5f2e2] active:scale-95"
                          >
                            {t.tellThem}
                          </a>
                          <button
                            onClick={() => handleConfirmWaitlist(w.id)}
                            disabled={busyId === w.id}
                            className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                          >
                            {busyId === w.id ? t.busy : t.confirmIntoSlot}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </Reveal>

            <Reveal delayMs={240} className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconCalendar className="h-4 w-4 text-zinc-500" />
                {t.laterAppointments}
              </h2>
              {laterDates.length === 0 ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <IconCalendar className="h-4 w-4 text-zinc-300" />
                  {t.nothingBeyond}
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-4">
                  {laterDates.map((date) => (
                    <div key={date}>
                      <p className="text-sm font-semibold text-zinc-700">{formatDisplayDate(date, lang)}</p>
                      <ul className="mt-1 flex flex-col gap-2">
                        {bookingsByDate(date).map((b) => (
                          <li
                            key={b.id}
                            className={`flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm ${listRowHoverClass}`}
                          >
                            <span>
                              <span className="font-medium text-zinc-800">{b.time}</span>{" "}
                              <span className="text-zinc-500">
                                ({b.durationMinutes} min, {b.serviceName}, {b.employeeName})
                              </span>{" "}
                              <span className="text-zinc-600">
                                — {b.customerName} ({b.customerPhone})
                              </span>
                              {b.status === "pending" && (
                                <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                  <span className={`${pulsingDotClass} bg-amber-500`} />
                                  {t.pending}
                                </span>
                              )}
                              {b.note && <span className="ms-2 italic text-zinc-500">&ldquo;{b.note}&rdquo;</span>}
                            </span>
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={busyId === b.id}
                              className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              {busyId === b.id ? t.busy : t.cancel}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </Reveal>
          </>
        )}
      </div>

      {reserveOpen && (
        <ReserveModal
          services={services}
          lang={lang}
          onClose={() => setReserveOpen(false)}
          onCreated={() => {
            setReserveOpen(false);
            loadDashboard({ silent: true });
          }}
        />
      )}

      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          lang={lang}
          onClose={() => setReschedulingBooking(null)}
          onRescheduled={() => {
            setReschedulingBooking(null);
            loadDashboard({ silent: true });
          }}
        />
      )}
    </div>
  );
}

function ReserveModal({
  services,
  lang,
  onClose,
  onCreated,
}: {
  services: Service[];
  lang: Lang;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = dashboardCopy[lang];

  const todayStr = (() => {
    const d = new Date();
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  })();

  const [date, setDate] = useState(todayStr);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const serviceIdsKey = selectedServiceIds.join(",");
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date || !serviceIdsKey) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedTime(null);
    setError(null);
    fetch(`/api/dashboard/slots?date=${date}&serviceIds=${serviceIdsKey}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setFullyBooked(data.fullyBooked);
        setDayClosed(data.closed);
      })
      .finally(() => setSlotsLoading(false));
  }, [date, serviceIdsKey]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime || selectedServiceIds.length === 0 || !customerName || !customerPhone) return;
    // Reserving can genuinely fail (the slot just got taken), so we only
    // open the wa.me link once we know the result — that would send a
    // false "you're booked in" if the reserve fails. openWhatsApp clicks a
    // real anchor rather than using window.open/location.href, which is
    // what keeps this dashboard tab in place on iOS instead of leaving it
    // stuck on about:blank or on wa.me once the owner switches back.
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time: selectedTime,
          serviceIds: selectedServiceIds,
          customerName,
          customerPhone,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "slot_taken" ? t.slotTaken : t.genericError);
        return;
      }
      onCreated();
      openWhatsApp(
        whatsappLink(
          customerPhone,
          t.message.reserved({
            customerName,
            date: formatDisplayDate(date, lang),
            time: selectedTime,
            serviceName: selectedServices.map((s) => s.name).join(" + "),
          })
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitToWaitlist() {
    if (selectedServiceIds.length === 0 || !customerName || !customerPhone) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          serviceIds: selectedServiceIds,
          customerName,
          customerPhone,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        setError(t.genericError);
        return;
      }
      onCreated();
      openWhatsApp(
        whatsappLink(
          customerPhone,
          t.message.addedToWaitlist({
            customerName,
            date: formatDisplayDate(date, lang),
            serviceName: selectedServices.map((s) => s.name).join(" + "),
          })
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}
    >
      <div className={`w-full max-w-md ${cardClass} max-h-full overflow-y-auto`}>
        <div className={cardAccentBarClass} />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">{t.reserveModalTitle}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label={t.close}>
              ✕
            </button>
          </div>

          <form
            onSubmit={
              fullyBooked
                ? (e) => {
                    e.preventDefault();
                    submitToWaitlist();
                  }
                : submit
            }
            className="mt-4 flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              {t.date}
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="relative">
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                {t.services}
                <button
                  type="button"
                  onClick={() => setServiceMenuOpen((v) => !v)}
                  className={`${inputClass} flex items-center justify-between bg-white text-start`}
                >
                  <span className={selectedServices.length === 0 ? "text-zinc-400" : "text-zinc-800"}>
                    {selectedServices.length === 0
                      ? t.selectServices
                      : t.servicesSummary(selectedServices.map((s) => s.name).join(" + "), totalDurationMinutes)}
                  </span>
                  <span className="ms-2 shrink-0 text-zinc-400">{serviceMenuOpen ? "▲" : "▼"}</span>
                </button>
              </label>

              {serviceMenuOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg bg-white p-2 shadow-lg ring-1 ring-zinc-200">
                  {services.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(s.id)}
                        onChange={() => toggleService(s.id)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {s.name} <span className="text-zinc-400">— {s.durationMinutes} min</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setServiceMenuOpen(false)}
                    className="mt-1 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-zinc-500 hover:bg-zinc-50"
                  >
                    {t.done}
                  </button>
                </div>
              )}
            </div>

            {selectedServiceIds.length > 0 && (
              <div>
                <p className="text-sm text-zinc-600">{t.time}</p>
                {slotsLoading ? (
                  <p className="mt-1 text-sm text-zinc-400">{t.loadingTimes}</p>
                ) : dayClosed ? (
                  <p className="mt-1 text-sm text-zinc-400">{t.closedThatDay}</p>
                ) : fullyBooked ? (
                  <div>
                    <p className="text-sm text-zinc-400">{t.fullyBookedThatDay}</p>
                    <p className="mt-1 text-sm text-zinc-400">{t.fullyBookedWaitlistPrompt}</p>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-400">{t.noTimesAvailable}</p>
                ) : (
                  <div dir="ltr" className="mt-1 grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150 ${
                          !slot.available
                            ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                            : selectedTime === slot.time
                            ? "scale-[1.05] bg-zinc-900 text-white"
                            : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:scale-[1.05] hover:bg-zinc-100 active:scale-95"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              {t.customerName}
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              {t.customerPhone}
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              {t.noteOptional}
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                disabled={
                  submitting ||
                  selectedServiceIds.length === 0 ||
                  !customerName ||
                  !customerPhone ||
                  (!fullyBooked && !selectedTime)
                }
                className={primaryButtonClass}
              >
                {fullyBooked
                  ? submitting
                    ? t.addingToWaitlist
                    : t.addToWaitlist
                  : submitting
                  ? t.reserving
                  : t.reserve}
              </button>
              <button type="button" onClick={onClose} className={ghostButtonClass}>
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({
  booking,
  lang,
  onClose,
  onRescheduled,
}: {
  booking: Booking;
  lang: Lang;
  onClose: () => void;
  onRescheduled: () => void;
}) {
  const t = dashboardCopy[lang];

  const todayStr = (() => {
    const d = new Date();
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  })();

  const [date, setDate] = useState(booking.date >= todayStr ? booking.date : todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSlotsLoading(true);
    setSelectedTime(null);
    setError(null);
    fetch(`/api/dashboard/slots?date=${date}&durationMinutes=${booking.durationMinutes}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setFullyBooked(data.fullyBooked);
        setDayClosed(data.closed);
      })
      .finally(() => setSlotsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-dashboard-action": "1" },
        body: JSON.stringify({ date, time: selectedTime }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "slot_taken" ? t.slotTaken : t.genericError);
        return;
      }
      onRescheduled();
      openWhatsApp(
        whatsappLink(
          booking.customerPhone,
          t.message.rescheduled({
            customerName: booking.customerName,
            date: formatDisplayDate(date, lang),
            time: selectedTime,
            serviceName: booking.serviceName,
          })
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}
    >
      <div className={`w-full max-w-md ${cardClass} max-h-full overflow-y-auto`}>
        <div className={cardAccentBarClass} />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">{t.rescheduleModalTitle}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label={t.close}>
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            {booking.serviceName} — {booking.customerName} ({booking.customerPhone})
          </p>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              {t.date}
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <div>
              <p className="text-sm text-zinc-600">{t.time}</p>
              {slotsLoading ? (
                <p className="mt-1 text-sm text-zinc-400">{t.loadingTimes}</p>
              ) : dayClosed ? (
                <p className="mt-1 text-sm text-zinc-400">{t.closedThatDay}</p>
              ) : fullyBooked ? (
                <p className="mt-1 text-sm text-zinc-400">{t.fullyBookedThatDay}</p>
              ) : slots.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-400">{t.noTimesAvailable}</p>
              ) : (
                <div dir="ltr" className="mt-1 grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150 ${
                        !slot.available
                          ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                          : selectedTime === slot.time
                          ? "scale-[1.05] bg-zinc-900 text-white"
                          : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:scale-[1.05] hover:bg-zinc-100 active:scale-95"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="mt-1 flex gap-2">
              <button type="submit" disabled={submitting || !selectedTime} className={primaryButtonClass}>
                {submitting ? t.rescheduling : t.confirmNewTime}
              </button>
              <button type="button" onClick={onClose} className={ghostButtonClass}>
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
