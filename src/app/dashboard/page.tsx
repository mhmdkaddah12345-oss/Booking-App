"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  id: string;
  date: string;
  time: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
};

type WaitlistEntry = {
  id: string;
  date: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  status: "waiting" | "notified";
  notifiedTime?: string;
};

const ROW_HEIGHT_PX = 56;

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

export default function DashboardPage() {
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  function loadDashboard() {
    setLoading(true);
    Promise.all([fetch("/api/business").then((r) => r.json()), fetch("/api/dashboard").then((r) => r.json())])
      .then(([businessData, dashboardData]) => {
        setStartHour(businessData.business.startHour);
        setEndHour(businessData.business.endHour);
        setOffDays(businessData.business.offDays);
        setBookings(dashboardData.bookings);
        setWaitlist(dashboardData.waitlist);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
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

  const laterDates = Array.from(new Set(bookings.filter((b) => b.date > lastGridDate).map((b) => b.date))).sort();

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Owner dashboard</h1>
          <div className="flex gap-4">
            <Link href="/dashboard/settings" className="text-sm font-medium text-zinc-600 hover:underline">
              Settings
            </Link>
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:underline">
              Customer booking page →
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-zinc-200">
              <div className="grid" style={{ gridTemplateColumns: "50px repeat(5, minmax(110px, 1fr))" }}>
                <div />
                {fiveDays.map((d) => (
                  <div key={d.date} className="pb-2 text-center text-sm font-medium">
                    <span className={d.closed ? "text-zinc-300" : "text-zinc-800"}>{d.label}</span>
                  </div>
                ))}

                <div className="relative" style={{ height: gridHeightPx }}>
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute right-1 -translate-y-1/2 text-xs text-zinc-400"
                      style={{ top: i * ROW_HEIGHT_PX }}
                    >
                      {formatHourLabel(h)}
                    </div>
                  ))}
                </div>

                {fiveDays.map((day) => (
                  <div key={day.date} className="relative border-l border-zinc-100" style={{ height: gridHeightPx }}>
                    {hours.map((h, i) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-zinc-100"
                        style={{ top: i * ROW_HEIGHT_PX }}
                      />
                    ))}
                    {bookingsByDate(day.date).map((b) => {
                      const startMinutesFromOpen = timeToMinutes(b.time) - startHour * 60;
                      const topPx = (startMinutesFromOpen / 60) * ROW_HEIGHT_PX;
                      const heightPx = Math.max((b.durationMinutes / 60) * ROW_HEIGHT_PX, 18);
                      const isSelected = selectedBookingId === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBookingId(isSelected ? null : b.id)}
                          className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1 text-left text-[10px] leading-tight transition-colors ${
                            isSelected ? "bg-amber-500 text-white" : "bg-zinc-900 text-white hover:bg-zinc-700"
                          }`}
                          style={{ top: topPx, height: heightPx }}
                        >
                          {b.time} {b.customerName}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {selectedBooking && (
              <div className="mt-2 rounded-xl bg-white p-4 ring-1 ring-zinc-200">
                <p className="text-sm font-medium text-zinc-800">{selectedBooking.serviceName}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedBooking.date} at {selectedBooking.time} ({selectedBooking.durationMinutes} min)
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {selectedBooking.customerName} ({selectedBooking.customerPhone})
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleCancel(selectedBooking.id)}
                    disabled={busyId === selectedBooking.id}
                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {busyId === selectedBooking.id ? "Cancelling..." : "Cancel booking"}
                  </button>
                  <button
                    onClick={() => setSelectedBookingId(null)}
                    className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-zinc-200">
              <h2 className="text-sm font-semibold text-zinc-800">Waitlist</h2>
              {waitlist.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">No one is waiting.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {waitlist.map((w) => (
                    <li
                      key={w.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        w.status === "notified" ? "bg-amber-50" : "bg-zinc-50"
                      }`}
                    >
                      <span className="text-zinc-700">
                        <span className="font-medium text-zinc-800">{w.date}</span> — {w.customerName} (
                        {w.customerPhone}) — {w.serviceName} ({w.durationMinutes} min)
                        {w.status === "notified" && (
                          <span className="ml-2 font-medium text-amber-700">— notified for {w.notifiedTime}</span>
                        )}
                      </span>
                      {w.status === "notified" && (
                        <button
                          onClick={() => handleConfirmWaitlist(w.id)}
                          disabled={busyId === w.id}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                          {busyId === w.id ? "..." : "Confirm into slot"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-zinc-200">
              <h2 className="text-sm font-semibold text-zinc-800">Later appointments</h2>
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
                            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                          >
                            <span>
                              <span className="font-medium text-zinc-800">{b.time}</span>{" "}
                              <span className="text-zinc-500">
                                ({b.durationMinutes} min, {b.serviceName})
                              </span>{" "}
                              <span className="text-zinc-600">
                                — {b.customerName} ({b.customerPhone})
                              </span>
                            </span>
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={busyId === b.id}
                              className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
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
          </>
        )}
      </div>
    </div>
  );
}
