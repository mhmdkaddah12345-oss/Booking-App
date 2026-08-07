"use client";

import { useEffect, useState } from "react";
import { landingCopy, Lang } from "@/lib/landingTranslations";

// A working recreation of the real booking page's Reserve popup — not a
// screenshot, the actual component visual language (see src/app/b/[slug]) —
// so a visitor can click through picking a service and a time themselves
// instead of just looking at a static image.
const SLOTS = [
  { time: "09:00", taken: true },
  { time: "09:30", taken: false },
  { time: "10:00", taken: false },
  { time: "10:30", taken: false },
  { time: "11:00", taken: false },
  { time: "11:30", taken: true },
  { time: "13:00", taken: false },
  { time: "13:30", taken: false },
] as const;

// First open slot — nudged once to invite a tap instead of relying solely
// on the caption text below the grid.
const NUDGE_TIME = "09:30";

export default function BookingPreviewMockup({ lang = "en" }: { lang?: Lang }) {
  const t = landingCopy[lang].mockup;
  const services = t.services;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dateLocale = lang === "ar" ? "ar" : "en";

  const [serviceIndex, setServiceIndex] = useState(0);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowNudge(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  function pickService(i: number) {
    setServiceIndex(i);
    setSelectedTime(null);
    setConfirmed(false);
  }

  function openReserve() {
    setReserveOpen(true);
    setConfirmed(false);
    setShowNudge(false);
  }

  const quickDays = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      offset: i,
      label: i === 0 ? t.today : i === 1 ? t.tomorrow : d.toLocaleDateString(dateLocale, { weekday: "short" }),
      fullLabel: d.toLocaleDateString(dateLocale, { month: "short", day: "numeric" }),
    };
  });

  function confirmBooking() {
    setReserveOpen(false);
    setConfirmed(true);
  }

  return (
    <div
      dir={dir}
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-zinc-200 ${lang === "ar" ? "lang-ar" : ""}`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span dir="ltr" className="ms-2 truncate rounded-full bg-white px-3 py-1 text-[11px] text-zinc-400 ring-1 ring-zinc-200">
          bellasalon.maw3edapp.com
        </span>
      </div>

      <div className="p-5 text-start">
        <p className="text-sm font-semibold text-zinc-800">{t.businessName}</p>

        <p className="mt-3 text-xs font-medium text-zinc-500">{t.servicesLabel}</p>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {services.map((s, i) => {
            const selected = i === serviceIndex;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => pickService(i)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors ${
                  selected ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="min-w-0 truncate">{s.name}</span>
                <span className={`shrink-0 text-[11px] ${selected ? "text-white/80" : "text-zinc-400"}`}>
                  {s.duration}
                  {lang === "ar" ? "د" : "m"} · ${s.priceUsd}
                </span>
              </button>
            );
          })}
        </div>

        {!confirmed && (
          <button
            type="button"
            onClick={openReserve}
            className={`mt-4 w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98] ${
              showNudge ? "animate-nudge" : ""
            }`}
          >
            {t.reserveButton}
          </button>
        )}

        {confirmed && selectedTime && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-cedar/10 px-3 py-2 text-[11px] font-medium text-cedar-deep">
            {t.confirmed(quickDays[dayOffset].fullLabel, selectedTime)}
            <button
              type="button"
              onClick={() => {
                setSelectedTime(null);
                setConfirmed(false);
              }}
              className="ms-2 shrink-0 underline decoration-dotted underline-offset-2 hover:text-cedar-deep/70"
            >
              {t.tryAnother}
            </button>
          </div>
        )}

        {!confirmed && <p className="mt-3 text-[11px] text-zinc-400">{t.liveDemoHint}</p>}
      </div>

      {reserveOpen && (
        <div
          className="animate-modal-in absolute inset-0 z-10 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4"
          onClick={() => setReserveOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white shadow-xl ring-1 ring-zinc-200 sm:max-w-xs sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-[#e8a86f] via-[#b5654f] to-[#4b5d4e]" />
            <div className="flex items-center justify-between gap-3 px-4 pt-3">
              <p className="text-sm font-semibold text-zinc-800">{t.pickDateTime}</p>
              <button
                type="button"
                onClick={() => setReserveOpen(false)}
                aria-label={t.tryAnother}
                className="rounded-full px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {quickDays.map((d) => (
                  <button
                    key={d.offset}
                    type="button"
                    onClick={() => {
                      setDayOffset(d.offset);
                      setSelectedTime(null);
                    }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                      dayOffset === d.offset
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div dir="ltr" className="mt-3 grid grid-cols-4 gap-1.5">
                {SLOTS.map((s) => {
                  const isSelected = selectedTime === s.time;
                  const isNudged = showNudge && !selectedTime && s.time === NUDGE_TIME;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={s.taken}
                      onClick={() => setSelectedTime(s.time)}
                      className={`rounded-md px-1.5 py-1.5 text-center text-[11px] font-medium transition-all duration-150 ${
                        isSelected
                          ? "scale-[1.05] bg-zinc-900 text-white"
                          : s.taken
                          ? "cursor-not-allowed bg-zinc-100 text-zinc-300 line-through"
                          : `bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 ${isNudged ? "animate-nudge" : ""}`
                      }`}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedTime}
                onClick={confirmBooking}
                className="mt-4 w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {t.continueButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
