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
import { IconChatBubble, IconChevronDown, IconClock } from "@/components/icons";

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

function formatTime12h(time: string, locale: string | undefined) {
  const [h, m] = time.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale ?? "en-US", { hour: "numeric", minute: "2-digit" });
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
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
        setLogoUrl(data.business.logoUrl ?? null);
        setAccentColor(data.business.accentColor ?? null);
        setGallery(data.business.gallery ?? []);
        setFaqs(data.business.faqs ?? []);
        setStartHour(data.business.startHour);
        setEndHour(data.business.endHour);
        setOwnerPhone(data.business.ownerPhone ?? "");
        setLocked(data.business.subscriptionStatus === "expired");
        setOffDays(data.business.offDays);
        setServices(data.business.services);
      })
      .finally(() => setPageLoading(false));
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

  const LangToggle = (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
    >
      {t.langToggle}
    </button>
  );

  if (pageLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50">
        <SuppressInstallPrompt />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

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
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-900">
                {initials(businessName) || "•"}
              </span>
            )}
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
            <button
              type="button"
              onClick={() => setFindOpen(true)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
            >
              {t.myBooking}
            </button>
            <button
              type="button"
              onClick={() => setSlotsPopupOpen(true)}
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              {t.nav.bookNow}
            </button>
          </div>
        </div>
      </header>

      <section className="relative h-64 overflow-hidden sm:h-96">
        {heroImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#b98b3e] to-cedar" />
        )}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-3xl px-4">
            <div className={`max-w-md ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-6">
                <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{businessName || t.loading}</h1>
                <p className="mt-2 text-sm text-zinc-600">{about || t.heroFallbackSubtitle}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setSlotsPopupOpen(true)} className={primaryButtonClass}>
                    {t.nav.bookNow}
                  </button>
                  <a
                    href="#services"
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                  >
                    {t.viewServices}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {findOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8"
            onClick={() => setFindOpen(false)}
          >
            <div
              className={`animate-modal-in w-full max-w-md ${cardClass} max-h-full overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cardAccentBarClass} />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-800">{t.findModalTitle}</p>
                  <button
                    type="button"
                    onClick={() => setFindOpen(false)}
                    aria-label={t.slotsCard.cancel}
                    className="rounded-full px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleFindBookings} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
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
          </div>,
          document.body
        )}

      <div className="mx-auto max-w-3xl px-4 pb-14 pt-8">
        <section id="services" className="scroll-mt-20">
          <h2 className="mt-10 text-lg font-semibold text-zinc-900">{t.services.label}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const selected = selectedServiceIds.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    toggleService(s.id);
                    setSlotsPopupOpen(true);
                  }}
                  className={`text-start ${cardClass} ${listRowHoverClass} ${selected ? "ring-2 ring-zinc-900" : ""}`}
                >
                  <div className="flex flex-col gap-3 p-5">
                    <p className="font-semibold text-zinc-800">{s.name}</p>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      <IconClock className="h-3.5 w-3.5" />
                      {s.durationMinutes} {lang === "ar" ? "د" : "min"}
                    </span>
                    <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                      {s.priceUsd !== null ? (
                        <p className="text-xl font-bold text-zinc-900">${s.priceUsd}</p>
                      ) : (
                        <span />
                      )}
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selected ? "bg-zinc-900 text-white" : "ring-1 ring-zinc-300 text-zinc-700"
                        }`}
                      >
                        {selected ? `✓ ${t.services.selected}` : t.services.select}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {services.length === 0 && <p className="text-sm text-zinc-400">{t.loading}</p>}
          </div>
        </section>

        <section id="book" className="scroll-mt-20">
          <button
            type="button"
            onClick={() => setSlotsPopupOpen(true)}
            className={`mt-10 w-full ${primaryButtonClass}`}
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
                  className={`animate-modal-in flex max-h-[90vh] w-full max-w-2xl flex-col ${cardClass}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cardAccentBarClass} />
                  <div className="flex items-center justify-between gap-3 px-5 pt-4">
                    <p className="text-sm font-semibold text-zinc-800">{t.pickDateTime}</p>
                    <button
                      type="button"
                      onClick={() => setSlotsPopupOpen(false)}
                      aria-label={t.slotsCard.cancel}
                      className="rounded-full px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:flex-row">
                    <div className="shrink-0 border-b border-zinc-100 pb-4 sm:w-56 sm:border-b-0 sm:border-e sm:pb-0 sm:pe-5">
                      <p className="text-sm font-semibold text-zinc-800">{t.services.label}</p>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {services.map((s) => {
                          const selected = selectedServiceIds.includes(s.id);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => toggleService(s.id)}
                              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition-colors ${
                                selected ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                              }`}
                            >
                              <span className="min-w-0 truncate">{s.name}</span>
                              <span className={`shrink-0 text-xs ${selected ? "text-white/80" : "text-zinc-400"}`}>
                                {s.durationMinutes}
                                {lang === "ar" ? "د" : "m"}
                                {s.priceUsd !== null ? ` · $${s.priceUsd}` : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {selectedServiceIds.length > 0 && (
                        <div className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
                          <p className="flex items-center gap-1.5">
                            <IconClock className="h-4 w-4" />
                            {totalDurationMinutes} {lang === "ar" ? "د" : "min"}
                          </p>
                          {totalPriceUsd !== null && <p className="mt-1">${totalPriceUsd}</p>}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
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
                              onClick={() => setSelectedDate(dateStr)}
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

                      <div className="mt-5 border-t border-zinc-100 pt-4">
                        <p className="text-sm font-semibold text-zinc-800">{formatDisplayDate(selectedDate, lang)}</p>
                        <div key={`${selectedDate}-${serviceIdsKey}`} className="animate-step-in mt-3">
                          {selectedServiceIds.length === 0 ? (
                            <p className="text-sm text-zinc-500">{t.services.pickAtLeastOne}</p>
                          ) : slotsLoading ? (
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
                            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pe-1">
                              {slots.map((slot) => (
                                <button
                                  key={slot.time}
                                  disabled={!slot.available}
                                  onClick={() => {
                                    setSelectedTime(slot.time);
                                    setSuccessMessage(null);
                                    setFormError(null);
                                  }}
                                  className={`w-full rounded-xl px-4 py-2.5 text-start text-sm font-medium transition-all duration-150 ${
                                    !slot.available
                                      ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                                      : selectedTime === slot.time
                                      ? "bg-zinc-900 text-white"
                                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                                  }`}
                                >
                                  {formatTime12h(slot.time, dateLocale)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedServiceIds.length > 0 && !dayClosed && !fullyBooked && (
                    <div className="border-t border-zinc-100 p-5 pt-4">
                      <button
                        type="button"
                        disabled={!selectedTime}
                        onClick={() => setSlotsPopupOpen(false)}
                        className={`w-full ${primaryButtonClass}`}
                      >
                        {t.continueButton}
                      </button>
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}

          <>
            {selectedTime &&
                !fullyBooked &&
                !slotsPopupOpen &&
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
            <div className="mt-10 grid gap-6 sm:grid-cols-[220px_1fr] sm:gap-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-900">{t.faqTitle}</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight text-zinc-900">{t.faqHeading}</h2>
                <p className="mt-3 text-sm text-zinc-500">
                  {t.faqSubtext}{" "}
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-900 underline"
                    >
                      {t.faqWhatsappLink}
                    </a>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {faqs.map((faq) => (
                  <details key={faq.id} className="group rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-100">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:content-none">
                      <span className="text-sm font-semibold text-zinc-900">{faq.question}</span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900/10 text-zinc-900 transition-transform duration-200 group-open:rotate-180">
                        <IconChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-zinc-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
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

      </div>

      <footer className="mt-10 bg-black text-zinc-300">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                  {initials(businessName) || "•"}
                </span>
              )}
              <span className="text-lg font-semibold text-white">{businessName}</span>
            </div>
            <nav dir="ltr" className="flex flex-wrap gap-6 text-sm">
              <button type="button" onClick={() => setSlotsPopupOpen(true)} className="hover:text-white">
                {t.nav.bookNow}
              </button>
              <a href="#services" className="hover:text-white">
                {t.nav.services}
              </a>
              {whatsappHref && (
                <a href="#contact" className="hover:text-white">
                  {t.nav.contact}
                </a>
              )}
            </nav>
          </div>

          {whatsappHref && (
            <div className="mt-4">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                aria-label={t.whatsappLabel}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <IconChatBubble className="h-5 w-5" />
              </a>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-zinc-400">
            <span>
              © {new Date().getFullYear()} {businessName}
            </span>
            <span>
              {t.poweredBy}{" "}
              <a href={`https://${ROOT_DOMAIN}`} className="font-semibold text-white hover:underline">
                Maw3ed
              </a>
            </span>
          </div>
        </div>
      </footer>

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
