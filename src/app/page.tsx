"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Day = { date: string; label: string };
type Slot = { time: string; available: boolean };
type Service = { id: string; name: string; durationMinutes: number };

export default function BookingPage() {
  const [businessName, setBusinessName] = useState<string>("");
  const [days, setDays] = useState<Day[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        setBusinessName(data.business.name);
        setDays(data.days);
        setSelectedDate(data.days[0]?.date ?? "");
        setServices(data.business.services);
        setSelectedServiceId(data.business.services[0]?.id ?? "");
      });
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedServiceId) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    setFormError(null);
    setSuccessMessage(null);
    setJoiningWaitlist(false);
    fetch(`/api/slots?date=${selectedDate}&serviceId=${selectedServiceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots);
        setFullyBooked(data.fullyBooked);
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedServiceId]);

  function refreshSlots() {
    fetch(`/api/slots?date=${selectedDate}&serviceId=${selectedServiceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots);
        setFullyBooked(data.fullyBooked);
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
          date: selectedDate,
          time: selectedTime,
          serviceId: selectedServiceId,
          customerName: name,
          customerPhone: phone,
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
      setSuccessMessage(`You're booked for ${selectedDate} at ${selectedTime}.`);
      setSelectedTime(null);
      setName("");
      setPhone("");
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
          date: selectedDate,
          serviceId: selectedServiceId,
          customerName: name,
          customerPhone: phone,
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">{businessName || "Loading..."}</h1>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:underline">
            Owner dashboard →
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-500">Choose a service, then pick a day and time.</p>

        <div className="mt-6 flex flex-col gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedServiceId(s.id)}
              className={`rounded-lg px-4 py-3 text-left text-sm font-medium ring-1 transition-colors ${
                selectedServiceId === s.id
                  ? "bg-zinc-900 text-white ring-zinc-900"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {s.name} <span className="opacity-70">— {s.durationMinutes} min</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedDate === d.date
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-zinc-200">
          {slotsLoading ? (
            <p className="text-sm text-zinc-500">Loading times...</p>
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
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              {successMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
