"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OwnerNav from "@/components/OwnerNav";
import {
  cardClass,
  cardAccentBarClass,
  listRowHoverClass,
  pulsingDotClass,
  primaryButtonClass,
  dangerButtonClass,
  ghostButtonClass,
} from "@/lib/ui";
import { IconChartBar, IconClock, IconUsers, IconCalendar } from "@/components/icons";

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
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center">
      <p className={`text-2xl font-semibold ${accent ? "text-amber-600" : "text-zinc-900"}`}>{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("trial");
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  function loadDashboard(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    Promise.all([fetch("/api/business").then((r) => r.json()), fetch("/api/dashboard").then((r) => r.json())])
      .then(([businessData, dashboardData]) => {
        setStartHour(businessData.business.startHour);
        setEndHour(businessData.business.endHour);
        setOffDays(businessData.business.offDays);
        setEmployees(businessData.business.employees);
        setSubscriptionStatus(businessData.business.subscriptionStatus);
        setTrialDaysLeft(businessData.business.trialDaysLeft);
        setBookings(dashboardData.bookings);
        setWaitlist(dashboardData.waitlist);
        setStats(dashboardData.stats);
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
    setBusyId(id);
    try {
      await fetch(`/api/waitlist/${id}/confirm`, { method: "POST" });
      loadDashboard();
    } finally {
      setBusyId(null);
    }
  }

  const today = new Date();
  const fiveDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      date,
      label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      closed: offDays.includes(d.getDay()),
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

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  // fiveDays[0] is always today, so the current-time line only ever applies
  // to the first column.
  const nowMinutesFromOpen = now.getHours() * 60 + now.getMinutes() - startHour * 60;
  const showNowLine = nowMinutesFromOpen >= 0 && nowMinutesFromOpen <= (endHour - startHour) * 60;
  const nowTopPx = (nowMinutesFromOpen / 60) * ROW_HEIGHT_PX;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <OwnerNav current="dashboard" />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Dashboard</h1>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : subscriptionStatus === "expired" ? (
          <div className={`mt-6 ${cardClass}`}>
            <div className={cardAccentBarClass} />
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-zinc-800">Your subscription has expired.</p>
              <p className="mt-1 text-sm text-zinc-500">
                Your dashboard and booking page are locked until you renew.
              </p>
              <Link href="/dashboard/billing" className={`mt-4 inline-block ${primaryButtonClass}`}>
                Go to Plan
              </Link>
            </div>
          </div>
        ) : (
          <>
            {subscriptionStatus === "trial" && trialDaysLeft <= 3 && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
                <span className={`${pulsingDotClass} bg-amber-500`} />
                Your free trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}.{" "}
                <Link href="/dashboard/billing" className="underline">
                  Renew now
                </Link>
              </div>
            )}

            {stats && (
              <div className={`mt-6 ${cardClass}`}>
                <div className={cardAccentBarClass} />
                <div className="p-4">
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                    <IconChartBar className="h-4 w-4 text-zinc-500" />
                    This week at a glance
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile label="Appointments" value={stats.appointmentsThisWeek} />
                    <StatTile label="Pending" value={stats.pendingCount} accent={stats.pendingCount > 0} />
                    <StatTile label="Cancelled" value={stats.cancelledThisWeek} />
                    <StatTile label="Waitlist" value={stats.waitlistCount} />
                  </div>
                </div>
              </div>
            )}

            {pendingBookings.length > 0 && (
              <div className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                  <IconClock className="h-4 w-4 text-amber-600" />
                  <span className={`${pulsingDotClass} bg-amber-500`} />
                  Pending Requests ({pendingBookings.length})
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {pendingBookings.map((b) => (
                    <li
                      key={b.id}
                      className={`flex flex-col gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between ${listRowHoverClass}`}
                    >
                      <span className="text-zinc-700">
                        <span className="font-medium text-zinc-800">
                          {b.date} at {b.time}
                        </span>{" "}
                        — {b.customerName} ({b.customerPhone}) — {b.serviceName} ({b.durationMinutes} min,{" "}
                        {b.employeeName})
                        {b.note && <span className="ml-2 italic text-zinc-500">&ldquo;{b.note}&rdquo;</span>}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {busyId === b.id ? "..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDecline(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {busyId === b.id ? "..." : "Decline"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="overflow-x-auto p-4">
                <div className="grid" style={{ gridTemplateColumns: "50px repeat(5, minmax(110px, 1fr))" }}>
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
                        {dayIndex === 0 ? "Today" : d.label}
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
                                  className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight shadow-sm transition-all duration-150 hover:z-20 hover:scale-[1.03] hover:shadow-md ${
                                    isSelected
                                      ? "scale-[1.03] border-zinc-900 bg-zinc-900 text-white shadow-md"
                                      : isPending
                                      ? "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                                      : "text-zinc-800 hover:brightness-95"
                                  }`}
                                >
                                  {isPending && (
                                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 align-middle" />
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
            </div>

            {selectedBooking && (
              <div className={`mt-2 ${cardClass}`}>
                <div className={cardAccentBarClass} />
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-800">{selectedBooking.serviceName}</p>
                    {selectedBooking.status === "pending" && (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        <span className={`${pulsingDotClass} bg-amber-500`} />
                        Awaiting your confirmation
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {selectedBooking.date} at {selectedBooking.time} ({selectedBooking.durationMinutes} min) —{" "}
                    {selectedBooking.employeeName}
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
                          {busyId === selectedBooking.id ? "..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDecline(selectedBooking.id)}
                          disabled={busyId === selectedBooking.id}
                          className={dangerButtonClass}
                        >
                          {busyId === selectedBooking.id ? "..." : "Decline"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancel(selectedBooking.id)}
                        disabled={busyId === selectedBooking.id}
                        className={dangerButtonClass}
                      >
                        {busyId === selectedBooking.id ? "Cancelling..." : "Cancel booking"}
                      </button>
                    )}
                    <button onClick={() => setSelectedBookingId(null)} className={ghostButtonClass}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconUsers className="h-4 w-4 text-zinc-500" />
                Waitlist
              </h2>
              {waitlist.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">No one is waiting.</p>
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
                        <span className="font-medium text-zinc-800">{w.date}</span> — {w.customerName} (
                        {w.customerPhone}) — {w.serviceName} ({w.durationMinutes} min)
                        {w.status === "notified" && (
                          <span className="ml-2 font-medium text-amber-700">— notified for {w.notifiedTime}</span>
                        )}
                        {w.note && <span className="ml-2 italic text-zinc-500">&ldquo;{w.note}&rdquo;</span>}
                      </span>
                      {w.status === "notified" && (
                        <button
                          onClick={() => handleConfirmWaitlist(w.id)}
                          disabled={busyId === w.id}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {busyId === w.id ? "..." : "Confirm into slot"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <IconCalendar className="h-4 w-4 text-zinc-500" />
                Later Appointments
              </h2>
              {laterDates.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">Nothing booked beyond the next 5 days.</p>
              ) : (
                <div className="mt-2 flex flex-col gap-4">
                  {laterDates.map((date) => (
                    <div key={date}>
                      <p className="text-sm font-semibold text-zinc-700">{date}</p>
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
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                  <span className={`${pulsingDotClass} bg-amber-500`} />
                                  Pending
                                </span>
                              )}
                              {b.note && <span className="ml-2 italic text-zinc-500">&ldquo;{b.note}&rdquo;</span>}
                            </span>
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={busyId === b.id}
                              className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              {busyId === b.id ? "..." : "Cancel"}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
