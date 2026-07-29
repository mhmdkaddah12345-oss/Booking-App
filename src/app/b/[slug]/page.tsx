"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { inputClass, primaryButtonClass, ghostButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";
import { bookingCopy, Lang } from "@/lib/bookingPageTranslations";

const ROOT_DOMAIN = "maw3edapp.com";

type Slot = { time: string; available: boolean };
type Service = { id: string; name: string; durationMinutes: number };
type FoundBooking = {
  id: string;
  date: string;
  time: string;
  serviceName: string;
  durationMinutes: number;
  status: "pending" | "booked";
};

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

  const [lang, setLang] = useState<Lang>("en");
  const t = bookingCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dateLocale = t.localeTag;

  const [businessName, setBusinessName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const [locked, setLocked] = useState(false);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const serviceIdsKey = selectedServiceIds.join(",");
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

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

  const [findOpen, setFindOpen] = useState(false);
  const [findPhone, setFindPhone] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);
  const [foundBookings, setFoundBookings] = useState<FoundBooking[] | null>(null);

  async function handleFindBookings(e: React.FormEvent) {
    e.preventDefault();
    setFindLoading(true);
    setFindError(null);
    setFoundBookings(null);
    try {
      const res = await fetch(`/api/bookings/find?slug=${slug}&phone=${encodeURIComponent(findPhone)}`);
      const data = await res.json();
      if (!res.ok) {
        setFindError(t.find.genericError);
        return;
      }
      if (data.bookings.length === 0) {
        setFindError(t.find.noneFound);
        return;
      }
      setFoundBookings(data.bookings);
    } finally {
      setFindLoading(false);
    }
  }

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
        setSelectedServiceIds(data.business.services[0] ? [data.business.services[0].id] : []);
      });
  }, [slug]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  useEffect(() => {
    if (!selectedDate || !serviceIdsKey) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    setFormError(null);
    setSuccessMessage(null);
    setBookedId(null);
    setJoiningWaitlist(false);
    fetch(`/api/slots?slug=${slug}&date=${selectedDate}&serviceIds=${serviceIdsKey}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots);
        setFullyBooked(data.fullyBooked);
        setDayClosed(data.closed);
      })
      .finally(() => setSlotsLoading(false));
  }, [slug, selectedDate, serviceIdsKey]);

  function refreshSlots() {
    fetch(`/api/slots?slug=${slug}&date=${selectedDate}&serviceIds=${serviceIdsKey}`)
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
          serviceIds: selectedServiceIds,
          customerName: name,
          customerPhone: phone,
          note,
        }),
      });
      if (res.status === 409) {
        setFormError(t.messages.slotTaken);
        setSelectedTime(null);
        refreshSlots();
        return;
      }
      if (!res.ok) {
        setFormError(t.messages.genericError);
        return;
      }
      const data = await res.json();
      setSuccessMessage(t.messages.requestSent(selectedDate, selectedTime));
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
          serviceIds: selectedServiceIds,
          customerName: name,
          customerPhone: phone,
          note,
        }),
      });
      if (!res.ok) {
        setFormError(t.messages.genericError);
        return;
      }
      setSuccessMessage(t.messages.waitlistJoined);
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
      label: d.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric" }),
      closed: offDays.includes(d.getDay()),
    };
  });

  const LangToggle = (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
    >
      {t.langToggle}
    </button>
  );

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <p className="text-sm text-zinc-500">{t.notFound}</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <p className="text-sm text-zinc-500">{t.locked}</p>
      </div>
    );
  }

  return (
    <div dir={dir} className={`min-h-screen bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{businessName || t.loading}</h1>
            <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
          </div>
          {LangToggle}
        </div>

        <button
          type="button"
          onClick={() => setFindOpen((v) => !v)}
          className="mt-3 text-sm font-medium text-zinc-600 underline"
        >
          {t.findToggle}
        </button>

        {findOpen && (
          <div className={`mt-2 ${cardClass}`}>
            <div className={cardAccentBarClass} />
            <div className="p-4">
              <form onSubmit={handleFindBookings} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  {t.find.phoneLabel}
                  <input
                    required
                    placeholder={t.find.phonePlaceholder}
                    value={findPhone}
                    onChange={(e) => setFindPhone(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <button type="submit" disabled={findLoading} className={primaryButtonClass}>
                  {findLoading ? t.find.searching : t.find.findButton}
                </button>
              </form>
              {findError && <p className="mt-3 text-sm text-red-600">{findError}</p>}
              {foundBookings && (
                <ul className="mt-3 flex flex-col gap-2">
                  {foundBookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                    >
                      <span className="text-zinc-700">
                        <span className="font-medium text-zinc-800">
                          {b.date} {lang === "ar" ? "الساعة" : "at"} {b.time}
                        </span>{" "}
                        — {b.serviceName} ({b.durationMinutes} {lang === "ar" ? "د" : "min"})
                        {b.status === "pending" && (
                          <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {t.find.pending}
                          </span>
                        )}
                      </span>
                      <Link href={`/manage/${b.id}`} className="font-medium text-zinc-700 underline">
                        {t.find.manage}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="animate-step-in relative z-30 mt-6">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            {t.services.label}
            <button
              type="button"
              onClick={() => setServiceMenuOpen((v) => !v)}
              className={`${inputClass} flex items-center justify-between bg-white text-start`}
            >
              <span className={selectedServices.length === 0 ? "text-zinc-400" : "text-zinc-800"}>
                {selectedServices.length === 0
                  ? t.services.select
                  : `${selectedServices.map((s) => s.name).join(" + ")} — ${totalDurationMinutes} ${lang === "ar" ? "د" : "min"}`}
              </span>
              <span className="ms-2 shrink-0 text-zinc-400">{serviceMenuOpen ? "▲" : "▼"}</span>
            </button>
          </label>

          {serviceMenuOpen && (
            <div className="absolute start-0 end-0 z-20 mt-1 w-full rounded-lg bg-white p-2 shadow-lg ring-1 ring-zinc-200">
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
                  {s.name} <span className="text-zinc-400">— {s.durationMinutes} {lang === "ar" ? "د" : "min"}</span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setServiceMenuOpen(false)}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-zinc-500 hover:bg-zinc-50"
              >
                {t.services.done}
              </button>
            </div>
          )}

          {selectedServiceIds.length === 0 && (
            <p className="mt-1.5 text-xs text-red-600">{t.services.pickAtLeastOne}</p>
          )}
        </div>

        <div className="animate-step-in mt-6 flex items-center gap-2" style={{ animationDelay: "90ms" }}>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-2">
            {quickDays.map((d) => (
              <button
                key={d.date}
                onClick={() => {
                  setSelectedDate(d.date);
                  setCalendarOpen(false);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 hover:scale-[1.05] active:scale-95 ${
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
            aria-label={t.pickAnotherDate}
            className={`shrink-0 rounded-full p-2 text-lg ring-1 transition-all duration-150 hover:scale-[1.05] active:scale-95 ${
              calendarOpen ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-100"
            }`}
          >
            📅
          </button>
        </div>

        {calendarOpen && (
          <div className="animate-step-in mt-2 rounded-xl bg-paper p-4 ring-1 ring-zinc-200">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                disabled={isAtCurrentMonth}
                className="rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              <p className="text-sm font-semibold text-zinc-800">
                {new Date(viewYear, viewMonth, 1).toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
              </p>
              <button
                onClick={goToNextMonth}
                className="rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
              {t.weekdayLabels.map((w) => (
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
                    className={`aspect-square rounded-lg text-sm font-medium transition-all duration-150 ${
                      isPast
                        ? "cursor-not-allowed text-zinc-200"
                        : `hover:scale-[1.1] active:scale-95 ${
                            isSelected
                              ? "bg-zinc-900 text-white"
                              : isClosed
                              ? "text-zinc-300 hover:bg-zinc-100"
                              : "text-zinc-700 hover:bg-zinc-100"
                          }`
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={`animate-step-in mt-6 ${cardClass}`} style={{ animationDelay: "180ms" }}>
          <div className={cardAccentBarClass} />
          <div className="p-4">
          <div key={`${selectedDate}-${serviceIdsKey}`} className="animate-step-in">
          {slotsLoading ? (
            <p className="text-sm text-zinc-500">{t.slotsCard.loadingTimes}</p>
          ) : dayClosed ? (
            <p className="text-sm font-medium text-zinc-800">{t.slotsCard.closedDay}</p>
          ) : fullyBooked ? (
            <div>
              <p className="text-sm font-medium text-zinc-800">{t.slotsCard.fullyBooked}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.slotsCard.waitlistPrompt}</p>
              {!joiningWaitlist ? (
                <button
                  onClick={() => {
                    setJoiningWaitlist(true);
                    setSuccessMessage(null);
                  }}
                  className={`mt-3 ${primaryButtonClass}`}
                >
                  {t.slotsCard.joinWaitlist}
                </button>
              ) : (
                <form onSubmit={submitWaitlist} className="mt-3 flex flex-col gap-3">
                  <input
                    required
                    placeholder={t.slotsCard.yourName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    required
                    placeholder={t.slotsCard.phoneNumber}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    placeholder={t.slotsCard.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={primaryButtonClass}
                    >
                      {submitting ? t.slotsCard.joining : t.slotsCard.confirmWaitlistSpot}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoiningWaitlist(false)}
                      className={ghostButtonClass}
                    >
                      {t.slotsCard.cancel}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div dir="ltr" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => {
                    setSelectedTime(slot.time);
                    setSuccessMessage(null);
                    setFormError(null);
                  }}
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

          {selectedTime && !fullyBooked && (
            <div
              className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8"
              onClick={() => setSelectedTime(null)}
            >
              <div
                className={`animate-modal-in w-full max-w-md ${cardClass} max-h-full overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cardAccentBarClass} />
                <form onSubmit={submitBooking} className="flex flex-col gap-3 p-5">
                  <p className="text-sm font-medium text-zinc-800">
                    {t.bookingModal.title(selectedDate, selectedTime)}
                  </p>
                  <input
                    required
                    placeholder={t.slotsCard.yourName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    required
                    placeholder={t.slotsCard.phoneNumber}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    placeholder={t.slotsCard.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={primaryButtonClass}
                    >
                      {submitting ? t.bookingModal.booking : t.bookingModal.confirmBooking}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTime(null)}
                      className={ghostButtonClass}
                    >
                      {t.slotsCard.cancel}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {successMessage && (
            <div
              className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8"
              onClick={() => setSuccessMessage(null)}
            >
              <div
                className={`animate-modal-in w-full max-w-sm ${cardClass}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cardAccentBarClass} />
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12 shrink-0 text-cedar">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="animate-circle-pop" />
                    <path
                      pathLength="1"
                      d="M7.5 12.5l2.8 2.8L16.5 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-check-draw"
                    />
                  </svg>
                  <p className="text-sm font-medium text-cedar-deep">{successMessage}</p>
                  {bookedId && (
                    <Link href={`/manage/${bookedId}`} className="text-sm font-medium text-zinc-600 underline">
                      {t.messages.manageLink}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className={`mt-1 ${primaryButtonClass}`}
                  >
                    {t.messages.close}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-400">
          {t.poweredBy}{" "}
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
