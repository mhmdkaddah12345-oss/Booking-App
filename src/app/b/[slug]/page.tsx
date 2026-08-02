"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { inputClass, primaryButtonClass, ghostButtonClass, cardClass, cardAccentBarClass, listRowHoverClass } from "@/lib/ui";
import { bookingCopy, Lang } from "@/lib/bookingPageTranslations";
import SuppressInstallPrompt from "@/components/SuppressInstallPrompt";
import { formatDisplayDate } from "@/lib/formatDate";
import { whatsappLink } from "@/lib/whatsapp";
import { IconChatBubble } from "@/components/icons";

const ROOT_DOMAIN = "maw3edapp.com";

type Slot = { time: string; available: boolean };
type Service = { id: string; name: string; durationMinutes: number; priceUsd: number | null };
type GalleryPhoto = { id: string; url: string };
type Faq = { id: string; question: string; answer: string };
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

function formatHour(h: number) {
  return `${h.toString().padStart(2, "0")}:00`;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

export default function BookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [lang, setLang] = useState<Lang>("en");
  const t = bookingCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dateLocale = t.localeTag;

  const [businessName, setBusinessName] = useState<string>("");
  const [about, setAbout] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [locked, setLocked] = useState(false);
  const [offDays, setOffDays] = useState<number[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const serviceIdsKey = selectedServiceIds.join(",");
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPriceUsd = selectedServices.every((s) => s.priceUsd !== null)
    ? selectedServices.reduce((sum, s) => sum + (s.priceUsd ?? 0), 0)
    : null;

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
  const [slotsPopupOpen, setSlotsPopupOpen] = useState(false);

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
        setAbout(data.business.about ?? null);
        setHeroImageUrl(data.business.heroImageUrl ?? null);
        setAccentColor(data.business.accentColor ?? null);
        setGallery(data.business.gallery ?? []);
        setFaqs(data.business.faqs ?? []);
        setStartHour(data.business.startHour);
        setEndHour(data.business.endHour);
        setOwnerPhone(data.business.ownerPhone ?? "");
        setLocked(data.business.subscriptionStatus === "expired");
        setOffDays(data.business.offDays);
        setServices(data.business.services);
        setSelectedServiceIds(data.business.services[0] ? [data.business.services[0].id] : []);
      });
  }, [slug]);

  // The site's whole warm palette is layered on the "zinc-900" CSS variable
  // (see globals.css), so overriding it here — rather than restyling every
  // button/badge/selected-state individually — recolors the entire page to
  // the business's chosen accent. Set on <html> rather than a wrapper div
  // because modals render via createPortal straight into document.body,
  // outside any wrapper's DOM subtree, so only a document-level override
  // reaches them too.
  useEffect(() => {
    if (!accentColor) return;
    document.documentElement.style.setProperty("--zinc-900", accentColor);
    return () => {
      document.documentElement.style.removeProperty("--zinc-900");
    };
  }, [accentColor]);

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
      setSuccessMessage(t.messages.requestSent(formatDisplayDate(selectedDate, lang), selectedTime));
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
      setSlotsPopupOpen(false);
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
        <SuppressInstallPrompt />
        <p className="text-sm text-zinc-500">{t.notFound}</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <SuppressInstallPrompt />
        <p className="text-sm text-zinc-500">{t.locked}</p>
      </div>
    );
  }

  const whatsappHref = ownerPhone ? whatsappLink(ownerPhone, t.whatsappPrefill(businessName)) : null;

  return (
    <div dir={dir} className={`min-h-screen bg-zinc-50 ${lang === "ar" ? "lang-ar" : ""}`}>
      <SuppressInstallPrompt />

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <span className="flex min-w-0 items-center gap-2 font-semibold text-zinc-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-900 via-[#b98b3e] to-cedar text-xs font-bold text-white">
              {initials(businessName) || "•"}
            </span>
            <span className="truncate">{businessName || t.loading}</span>
          </span>
          <nav dir="ltr" className="hidden items-center gap-4 text-sm font-medium text-zinc-600 sm:flex">
            <a href="#services" className="hover:text-zinc-900">
              {t.nav.services}
            </a>
            {gallery.length > 0 && (
              <a href="#gallery" className="hover:text-zinc-900">
                {t.nav.gallery}
              </a>
            )}
            {faqs.length > 0 && (
              <a href="#faq" className="hover:text-zinc-900">
                {t.nav.faq}
              </a>
            )}
            <a href="#hours" className="hover:text-zinc-900">
              {t.nav.hours}
            </a>
            {whatsappHref && (
              <a href="#contact" className="hover:text-zinc-900">
                {t.nav.contact}
              </a>
            )}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {LangToggle}
            <a
              href="#book"
              className="hidden rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 sm:inline-block"
            >
              {t.nav.bookNow}
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        {heroImageUrl ? (
          <div className="relative h-48 w-full sm:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-zinc-900 via-[#b98b3e] to-cedar sm:h-40" />
        )}
        <div className="relative z-10 mx-auto -mt-14 max-w-3xl px-4 sm:-mt-16">
          <div className={cardClass}>
            <div className={cardAccentBarClass} />
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-zinc-900">{businessName || t.loading}</h1>
                {about && <p className="mt-1.5 max-w-xl text-sm text-zinc-600">{about}</p>}
              </div>
              <a href="#book" className={`${primaryButtonClass} shrink-0 text-center`}>
                {t.nav.bookNow}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-14 pt-8">
        <button
          type="button"
          onClick={() => setFindOpen((v) => !v)}
          className="text-sm font-medium text-zinc-600 underline"
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
                          {formatDisplayDate(b.date, lang)} {lang === "ar" ? "الساعة" : "at"} {b.time}
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

        <section id="services" className="scroll-mt-20">
          <h2 className="mt-10 text-lg font-semibold text-zinc-900">{t.services.label}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const selected = selectedServiceIds.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`text-start ${cardClass} ${listRowHoverClass} ${selected ? "ring-2 ring-zinc-900" : ""}`}
                >
                  <div className={cardAccentBarClass} />
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-800">{s.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {s.durationMinutes} {lang === "ar" ? "د" : "min"}
                        {s.priceUsd !== null ? ` · $${s.priceUsd}` : ""}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        selected ? "bg-zinc-900 text-white" : "bg-zinc-100 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                </button>
              );
            })}
            {services.length === 0 && <p className="text-sm text-zinc-400">{t.loading}</p>}
          </div>
          {selectedServiceIds.length === 0 && (
            <p className="mt-2 text-xs text-red-600">{t.services.pickAtLeastOne}</p>
          )}
          {selectedServiceIds.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              {selectedServices.map((s) => s.name).join(" + ")} — {totalDurationMinutes} {lang === "ar" ? "د" : "min"}
              {totalPriceUsd !== null ? ` · $${totalPriceUsd}` : ""}
            </p>
          )}
        </section>

        <section id="book" className="scroll-mt-20">
          <div className="mt-10 flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => setSlotsPopupOpen(true)}
            disabled={selectedServiceIds.length === 0}
            className={`mt-4 w-full ${primaryButtonClass}`}
          >
            {t.reserveButton}
          </button>

          {slotsPopupOpen &&
            createPortal(
              <div
                className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8"
                onClick={() => setSlotsPopupOpen(false)}
              >
                <div
                  className={`animate-modal-in w-full max-w-md ${cardClass} max-h-full overflow-y-auto`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cardAccentBarClass} />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-800">{formatDisplayDate(selectedDate, lang)}</p>
                      <button
                        type="button"
                        onClick={() => setSlotsPopupOpen(false)}
                        aria-label={t.slotsCard.cancel}
                        className="rounded-full px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div key={`${selectedDate}-${serviceIdsKey}`} className="animate-step-in mt-3">
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
                                <button type="submit" disabled={submitting} className={primaryButtonClass}>
                                  {submitting ? t.slotsCard.joining : t.slotsCard.confirmWaitlistSpot}
                                </button>
                                <button type="button" onClick={() => setJoiningWaitlist(false)} className={ghostButtonClass}>
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
                                setSlotsPopupOpen(false);
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
                  </div>
                </div>
              </div>,
              document.body
            )}

          <>
            {selectedTime &&
                !fullyBooked &&
                createPortal(
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
                          {t.bookingModal.title(formatDisplayDate(selectedDate, lang), selectedTime)}
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
                          <button type="submit" disabled={submitting} className={primaryButtonClass}>
                            {submitting ? t.bookingModal.booking : t.bookingModal.confirmBooking}
                          </button>
                          <button type="button" onClick={() => setSelectedTime(null)} className={ghostButtonClass}>
                            {t.slotsCard.cancel}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>,
                  document.body
                )}

              {successMessage &&
                createPortal(
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
                        <button type="button" onClick={() => setSuccessMessage(null)} className={`mt-1 ${primaryButtonClass}`}>
                          {t.messages.close}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
          </>
        </section>

        {gallery.length > 0 && (
          <section id="gallery" className="scroll-mt-20">
            <h2 className="mt-10 text-lg font-semibold text-zinc-900">{t.galleryTitle}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gallery.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover ring-1 ring-zinc-200"
                />
              ))}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section id="faq" className="scroll-mt-20">
            <h2 className="mt-10 text-lg font-semibold text-zinc-900">{t.faqTitle}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {faqs.map((faq) => (
                <details key={faq.id} className={`${cardClass} group`}>
                  <div className={cardAccentBarClass} />
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-800 marker:content-none">
                    {faq.question}
                  </summary>
                  <p className="px-4 pb-3 text-sm text-zinc-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section id="hours" className="scroll-mt-20">
          <h2 className="mt-10 text-lg font-semibold text-zinc-900">{t.hoursTitle}</h2>
          <ul className={`mt-3 divide-y divide-zinc-100 ${cardClass}`}>
            {t.weekdaysFull.map((label, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-zinc-700">{label}</span>
                <span className={offDays.includes(i) ? "text-zinc-400" : "text-zinc-600"}>
                  {offDays.includes(i) ? t.closed : `${formatHour(startHour)} – ${formatHour(endHour)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {whatsappHref && (
          <section id="contact" className="scroll-mt-20">
            <h2 className="mt-10 text-lg font-semibold text-zinc-900">{t.contactTitle}</h2>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={`mt-3 flex items-center gap-3 p-4 ${cardClass} ${listRowHoverClass}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
                <IconChatBubble className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-zinc-800" dir="ltr">
                  {ownerPhone}
                </p>
                <p className="text-xs text-zinc-500">{t.whatsappLabel}</p>
              </div>
            </a>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-zinc-400">
          {t.poweredBy} <a href={`https://${ROOT_DOMAIN}`} className="font-medium text-zinc-500 hover:underline">Maw3ed</a>
        </p>
      </div>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label={t.whatsappFloatAria}
          className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <IconChatBubble className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
