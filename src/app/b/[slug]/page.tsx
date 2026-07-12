"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Slot = { time: string; available: boolean };
type Service = { id: string; name: string; durationMinutes: number };

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

export default function BookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [businessName, setBusinessName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const [locked, setLocked] = useState(false);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookedId, setBookedId] = useState<string | null>(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  useEffect(() => {
    fetch(`/api/business?slug=${slug}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setBusinessName(data.business.name);
        setLocked(data.business.subscriptionStatus === "expired");
        setOffDays(data.business.offDays);
        setServices(data.business.services);
        setSelectedServiceId(data.business.services[0]?.id ?? "");
      });
  }, [slug]);

  useEffect(() => {
    if (!selectedDate || !selectedServiceId) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    setFormError(null);
    setSuccessMessage(null);
    setBookedId(null);
    setJoiningWaitlist(false);
    fetch(`/api/slots?slug=${slug}&date=${selectedDate}&serviceId=${selectedServiceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots);
        setFullyBooked(data.fullyBooked);
        setDayClosed(data.closed);
      })
      .finally(() => setSlotsLoading(false));
  }, [slug, selectedDate, selectedServiceId]);

  function refreshSlots() {
    fetch(`/api/slots?slug=${slug}&date=${selectedDate}&serviceId=${selectedServiceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots);
        setFullyBooked(data.fullyBooked);
        setDayClosed(data.closed);
      });
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          date: selectedDate,
          time: selectedTime,
          serviceId: selectedServiceId,
          customerName: name,
          customerPhone: phone,
          note,
        }),
      });
      if (res.status === 409) {
        setFormError("Sorry, that slot was just taken. Please pick another time.");
        setSelectedTime(null);
        refreshSlots();
        return;
      }
      if (!res.ok) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      const data = await res.json();
      setSuccessMessage(`You're booked for ${selectedDate} at ${selectedTime}.`);
      setBookedId(data.booking.id);
      setSelectedTime(null);
      setName("");
      setPhone("");
      setNote("");
      refreshSlots();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          date: selectedDate,
          serviceId: selectedServiceId,
          customerName: name,
          customerPhone: phone,
          note,
        }),
      });
      if (!res.ok) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      setSuccessMessage("You're on the waitlist. We'll message you if a slot opens up.");
      setJoiningWaitlist(false);
      setName("");
      setPhone("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
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
    const date = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      date,
      label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
      closed: offDays.includes(d.getDay()),
    };
  });

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <p className="text-sm text-zinc-500">We couldn&apos;t find that business.</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <p className="text-sm text-zinc-500">This booking page is temporarily unavailable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold text-zinc-900">{businessName || "Loading..."}</h1>
        <p className="mt-1 text-sm text-zinc-500">Choose a service, then pick a day and time.</p>

        <label className="mt-6 flex flex-col gap-1 text-sm text-zinc-600">
          Service
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.durationMinutes} min
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex items-center gap-2">
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
              calendarOpen ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-100"
            }`}
          >
            📅
          </button>
        </div>

        {calendarOpen && (
          <div className="mt-2 rounded-xl bg-paper p-4 ring-1 ring-zinc-200">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                disabled={isAtCurrentMonth}
                className="rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              <p className="text-sm font-semibold text-zinc-800">
                {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
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

        <div className="mt-6 rounded-xl bg-paper p-4 ring-1 ring-zinc-200">
          {slotsLoading ? (
            <p className="text-sm text-zinc-500">Loading times...</p>
          ) : dayClosed ? (
            <p className="text-sm font-medium text-zinc-800">We&apos;re closed on this day.</p>
          ) : fullyBooked ? (
            <div>
              <p className="text-sm font-medium text-zinc-800">
                This day is fully booked for this service.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Join the waitlist and we&apos;ll message you if a slot opens up.
              </p>
              {!joiningWaitlist ? (
                <button
                  onClick={() => {
                    setJoiningWaitlist(true);
                    setSuccessMessage(null);
                  }}
                  className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Join waitlist
                </button>
              ) : (
                <form onSubmit={submitWaitlist} className="mt-3 flex flex-col gap-3">
                  <input
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    required
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Note for the business (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {submitting ? "Joining..." : "Confirm waitlist spot"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoiningWaitlist(false)}
                      className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => {
                    setSelectedTime(slot.time);
                    setSuccessMessage(null);
                    setFormError(null);
                  }}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                    !slot.available
                      ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                      : selectedTime === slot.time
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}

          {selectedTime && !fullyBooked && (
            <form onSubmit={submitBooking} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
              <p className="text-sm font-medium text-zinc-800">
                Booking {selectedDate} at {selectedTime}
              </p>
              <input
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Note for the business (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Confirm booking"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTime(null)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {successMessage && (
            <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              <p>{successMessage}</p>
              {bookedId && (
                <Link href={`/manage/${bookedId}`} className="mt-1 block underline">
                  Manage or cancel this booking
                </Link>
              )}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-400">
          Powered by{" "}
          <Link href="/" className="font-medium text-zinc-500 hover:underline">
            Maw3ed
          </Link>
        </p>
      </div>
    </div>
  );
}
