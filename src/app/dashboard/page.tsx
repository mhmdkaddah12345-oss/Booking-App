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

type DayData = {
  date: string;
  bookings: Booking[];
  waitlist: WaitlistEntry[];
};

export default function DashboardPage() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function loadDashboard() {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setDays(data.days))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
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

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
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
        ) : days.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">No upcoming bookings or waitlist entries yet.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            {days.map((day) => (
              <div key={day.date} className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
                <h2 className="text-lg font-semibold text-zinc-800">{day.date}</h2>

                {day.bookings.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-400">No bookings.</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2">
                    {day.bookings.map((b) => (
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
                )}

                {day.waitlist.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Waitlist</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {day.waitlist.map((w) => (
                        <li
                          key={w.id}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                            w.status === "notified" ? "bg-amber-50" : "bg-zinc-50"
                          }`}
                        >
                          <span className="text-zinc-700">
                            {w.customerName} ({w.customerPhone}) — {w.serviceName} ({w.durationMinutes} min)
                            {w.status === "notified" && (
                              <span className="ml-2 font-medium text-amber-700">
                                — notified for {w.notifiedTime}
                              </span>
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
