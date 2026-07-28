"use client";

import { useEffect, useState } from "react";
import { landingCopy, Lang } from "@/lib/landingTranslations";

// A working recreation of the real booking page's slot picker — not a
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

  const [serviceIndex, setServiceIndex] = useState(0);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const service = services[serviceIndex];

  useEffect(() => {
    const timer = setTimeout(() => setShowNudge(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  function pickService(i: number) {
    setServiceIndex(i);
    setServiceMenuOpen(false);
    setSelectedTime(null);
    setConfirmed(false);
  }

  function pickTime(time: string) {
    setSelectedTime(time);
    setConfirmed(false);
    setShowNudge(false);
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-zinc-200 ${lang === "ar" ? "lang-ar" : ""}`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span dir="ltr" className="ms-2 truncate rounded-full bg-white px-3 py-1 text-[11px] text-zinc-400 ring-1 ring-zinc-200">
          bellasalon.maw3edapp.com
        </span>
      </div>
      <div className="relative p-5 text-start">
        <p className="text-sm font-semibold text-zinc-800">{t.businessName}</p>

        <p className="mt-3 text-xs font-medium text-zinc-500">{t.servicesLabel}</p>
        <button
          type="button"
          onClick={() => setServiceMenuOpen((v) => !v)}
          className="mt-1 flex w-full items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-100"
        >
          {service.name} — {service.duration} {lang === "ar" ? "د" : "min"}
          <span className={`text-zinc-400 transition-transform ${serviceMenuOpen ? "rotate-180" : ""}`}>▾</span>
        </button>

        {serviceMenuOpen && (
          <div className="absolute start-5 end-5 z-10 mt-1 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-zinc-200">
            {services.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => pickService(i)}
                className={`block w-full px-3 py-2 text-start text-sm transition-colors hover:bg-zinc-50 ${
                  i === serviceIndex ? "text-zinc-900 font-medium" : "text-zinc-600"
                }`}
              >
                {s.name} <span className="text-zinc-400">— {s.duration} {lang === "ar" ? "د" : "min"}</span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs font-medium text-zinc-500">{t.todayLabel}</p>
        <div dir="ltr" className="mt-1 grid grid-cols-4 gap-1.5">
          {SLOTS.map((s) => {
            const isSelected = selectedTime === s.time;
            const isNudged = showNudge && !selectedTime && s.time === NUDGE_TIME;
            return (
              <button
                key={s.time}
                type="button"
                disabled={s.taken}
                onClick={() => pickTime(s.time)}
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

        {selectedTime && !confirmed && (
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="mt-4 w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98]"
          >
            {t.bookButton(selectedTime)}
          </button>
        )}

        {confirmed && selectedTime && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-cedar/10 px-3 py-2 text-[11px] font-medium text-cedar-deep">
            {t.confirmed(selectedTime)}
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

        {!selectedTime && <p className="mt-4 text-[11px] text-zinc-400">{t.liveDemoHint}</p>}
      </div>
    </div>
  );
}
