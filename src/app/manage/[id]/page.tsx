"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { primaryButtonClass, dangerButtonClass, ghostButtonClass } from "@/lib/ui";

const ROOT_DOMAIN = "maw3edapp.com";

type Booking = {
  id: string;
  date: string;
  time: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  status: "pending" | "booked" | "cancelled";
};

type Slot = { time: string; available: boolean };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ManageBookingPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [rescheduling, setRescheduling] = useState(false);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function loadBooking() {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setBooking(data.booking);
          setSlug(data.business.slug);
          setOffDays(data.business.offDays);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!rescheduling || !selectedDate || !booking || !slug) return;
    setSlotsLoading(true);
    fetch(`/api/slots?slug=${slug}&date=${selectedDate}&serviceId=${booking.serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots);
        setFullyBooked(data.fullyBooked);
        setDayClosed(data.closed);
      })
      .finally(() => setSlotsLoading(false));
  }, [rescheduling, selectedDate, booking, slug]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      setStatusMessage("Your appointment has been cancelled.");
      loadBooking();
    } finally {
      setCancelling(false);
      setConfirmingCancel(false);
    }
  }

  function startReschedule() {
    setRescheduling(true);
    setSelectedDate(todayStr);
    setStatusMessage(null);
    setRescheduleError(null);
  }

  async function handlePickNewSlot(time: string) {
    setRescheduleError(null);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, time }),
    });
    if (res.status === 409) {
      setRescheduleError("Sorry, that slot was just taken. Please pick another time.");
      return;
    }
    if (!res.ok) {
      setRescheduleError("Something went wrong. Please try again.");
      return;
    }
    setRescheduling(false);
    setStatusMessage("Your appointment has been rescheduled.");
    loadBooking();
  }

  const isAtCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function goToPrevMonth() {
    if (isAtCurrentMonth) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const numDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekdayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];

  const quickDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()),
      label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
      closed: offDays.includes(d.getDay()),
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Manage Your Appointment</h1>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : notFound ? (
          <p className="mt-6 text-sm text-zinc-500">We couldn&apos;t find that booking.</p>
        ) : booking?.status === "cancelled" ? (
          <p className="mt-6 text-sm font-medium text-zinc-800">This booking has already been cancelled.</p>
        ) : (
          booking && (
            <div className="mt-6 rounded-xl bg-paper p-4 ring-1 ring-zinc-200">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-800">{booking.serviceName}</p>
                {booking.status === "pending" ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Pending confirmation
                  </span>
                ) : (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    Confirmed
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {booking.date} at {booking.time} ({booking.durationMinutes} min)
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Booked under {booking.customerName} ({booking.customerPhone})
              </p>
              {booking.note && <p className="mt-1 text-sm italic text-zinc-500">&ldquo;{booking.note}&rdquo;</p>}

              {statusMessage && (
                <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                  {statusMessage}
                </p>
              )}

              {!rescheduling && !confirmingCancel && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={startReschedule}
                    className={primaryButtonClass}
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setConfirmingCancel(true)}
                    className={dangerButtonClass}
                  >
                    Cancel appointment
                  </button>
                </div>
              )}

              {confirmingCancel && (
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4">
                  <p className="text-sm text-zinc-700">Are you sure you want to cancel?</p>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Yes, cancel it"}
                  </button>
                  <button
                    onClick={() => setConfirmingCancel(false)}
                    className={ghostButtonClass}
                  >
                    No, keep it
                  </button>
                </div>
              )}

              {rescheduling && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-2 overflow-x-auto pb-2">
                      {quickDays.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => {
                            setSelectedDate(d.date);
                            setCalendarOpen(false);
                          }}
                          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            selectedDate === d.date
                              ? "bg-zinc-900 text-white"
                              : d.closed
                              ? "bg-white text-zinc-400 ring-1 ring-zinc-200 hover:bg-zinc-100"
                              : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCalendarOpen((open) => !open)}
                      aria-label="Pick another date"
                      className={`shrink-0 rounded-full p-2 text-lg ring-1 transition-colors ${
                        calendarOpen
                          ? "bg-zinc-900 text-white ring-zinc-900"
                          : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      📅
                    </button>
                  </div>

                  {calendarOpen && (
                    <div className="mt-2 rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={goToPrevMonth}
                          disabled={isAtCurrentMonth}
                          className="rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ‹
                        </button>
                        <p className="text-sm font-semibold text-zinc-800">
                          {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <button
                          onClick={goToNextMonth}
                          className="rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                        >
                          ›
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
                        {WEEKDAY_LABELS.map((w) => (
                          <div key={w}>{w}</div>
                        ))}
                      </div>

                      <div className="mt-1 grid grid-cols-7 gap-1">
                        {cells.map((day, i) => {
                          if (day === null) return <div key={`blank-${i}`} />;
                          const dateStr = toDateStr(viewYear, viewMonth, day);
                          const isPast = dateStr < todayStr;
                          const isClosed = offDays.includes(new Date(viewYear, viewMonth, day).getDay());
                          const isSelected = dateStr === selectedDate;
                          return (
                            <button
                              key={dateStr}
                              disabled={isPast}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setCalendarOpen(false);
                              }}
                              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                                isPast
                                  ? "cursor-not-allowed text-zinc-200"
                                  : isSelected
                                  ? "bg-zinc-900 text-white"
                                  : isClosed
                                  ? "text-zinc-300 hover:bg-zinc-100"
                                  : "text-zinc-700 hover:bg-zinc-100"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    {slotsLoading ? (
                      <p className="text-sm text-zinc-500">Loading times...</p>
                    ) : dayClosed ? (
                      <p className="text-sm text-zinc-600">We&apos;re closed on this day.</p>
                    ) : fullyBooked ? (
                      <p className="text-sm text-zinc-600">This day is fully booked for this service.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => handlePickNewSlot(slot.time)}
                            className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                              !slot.available
                                ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                                : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                    {rescheduleError && <p className="mt-2 text-sm text-red-600">{rescheduleError}</p>}
                  </div>

                  <button
                    onClick={() => setRescheduling(false)}
                    className={`mt-3 ${ghostButtonClass}`}
                  >
                    Cancel reschedule
                  </button>
                </div>
              )}
            </div>
          )
        )}

        <p className="mt-8 text-center text-xs text-zinc-400">
          Powered by{" "}
          <a
            href={`https://${ROOT_DOMAIN}`}
            className="font-medium text-zinc-500 hover:underline"
          >
            Maw3ed
          </a>
        </p>
      </div>
    </div>
  );
}
