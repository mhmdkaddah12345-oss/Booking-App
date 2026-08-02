"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";
import { signupCopy, type Lang } from "@/lib/signupPageTranslations";

type DraftService = { name: string; durationMinutes: number; priceUsd: number | null };

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);
const WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6];
const TOTAL_STEPS = 4;

function formatHour(h: number) {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function SignupPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = signupCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [step, setStep] = useState(1);

  // Step 1 — contact
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — services
  const [services, setServices] = useState<DraftService[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState("");

  // Step 3 — hours
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(18);
  const [offDays, setOffDays] = useState<number[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const LangToggle = (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
    >
      {t.langToggle}
    </button>
  );

  function addDraftService() {
    if (!newServiceName.trim()) return;
    const priceUsd = newServicePrice.trim() === "" ? null : Number(newServicePrice);
    setServices((prev) => [...prev, { name: newServiceName.trim(), durationMinutes: newServiceDuration, priceUsd }]);
    setNewServiceName("");
    setNewServiceDuration(30);
    setNewServicePrice("");
  }

  function removeDraftService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleOffDay(day: number) {
    setOffDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, email, phone, services, startHour, endHour, offDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "email_taken") setError(t.emailTaken);
        else setError(t.genericError);
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div dir={dir} className={`flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
        <div className="flex w-full max-w-sm justify-end">{LangToggle}</div>
        <Wordmark />
        <div className={`w-full max-w-sm ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="flex flex-col gap-4 p-6 text-center">
            <h1 className="text-xl font-semibold text-zinc-900">{t.thanksTitle}</h1>
            <p className="text-sm text-zinc-600">{t.thanksBody}</p>
            <Link href="/dashboard/login" className={primaryButtonClass}>
              {t.goToLogin}
            </Link>
            <Link href="/" className="text-sm font-medium text-zinc-600 underline">
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const contactValid = businessName.trim() !== "" && email.includes("@") && phone.trim() !== "";

  return (
    <div dir={dir} className={`flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="flex w-full max-w-sm justify-end">{LangToggle}</div>
      <Wordmark />
      <div className={`w-full max-w-sm ${cardClass}`}>
        <div className={cardAccentBarClass} />
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-zinc-800" : "bg-zinc-200"}`}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-zinc-400">{t.stepOf(step, TOTAL_STEPS)}</p>

          {step === 1 && (
            <>
              <h1 className="text-xl font-semibold text-zinc-900">{t.stepContactTitle}</h1>
              <p className="text-sm text-zinc-500">{t.stepContactSubtitle}</p>
              <input
                type="text"
                required
                autoFocus
                placeholder={t.businessNamePlaceholder}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
              />
              <input
                type="email"
                required
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="tel"
                required
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                disabled={!contactValid}
                onClick={() => setStep(2)}
                className={`${primaryButtonClass} disabled:opacity-50`}
              >
                {t.next}
              </button>
              <p className="text-center text-sm text-zinc-500">
                {t.alreadyHaveAccount}{" "}
                <Link href="/dashboard/login" className="font-medium text-zinc-700 underline">
                  {t.logIn}
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-xl font-semibold text-zinc-900">{t.stepServicesTitle}</h1>
              <p className="text-sm text-zinc-500">{t.stepServicesSubtitle}</p>

              <ul className="flex flex-col gap-2">
                {services.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-700">
                      {s.name}{" "}
                      <span className="text-zinc-400">
                        — {t.durationMin(s.durationMinutes)}
                        {s.priceUsd !== null ? ` · $${s.priceUsd}` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDraftService(i)}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      {t.removeService}
                    </button>
                  </li>
                ))}
                {services.length === 0 && <li className="text-sm text-zinc-400">{t.servicesListEmpty}</li>}
              </ul>

              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4">
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.serviceNamePlaceholder}
                  <input
                    placeholder={t.serviceNamePlaceholder}
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-3">
                  <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                    {t.durationLabel}
                    <select
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                      className={inputClass}
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {t.durationMin(d)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                    {t.priceLabel}
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={t.pricePlaceholder}
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={addDraftService}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-100"
                >
                  {t.addServiceBtn}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  {t.back}
                </button>
                <button type="button" onClick={() => setStep(3)} className={`${primaryButtonClass} flex-1`}>
                  {services.length > 0 ? t.next : t.skip}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-xl font-semibold text-zinc-900">{t.stepHoursTitle}</h1>
              <p className="text-sm text-zinc-500">{t.stepHoursSubtitle}</p>

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  {t.opensAt}
                  <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className={inputClass}>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                  {t.closesAt}
                  <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} className={inputClass}>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-1 text-sm text-zinc-600">
                {t.closedOn}
                <div className="flex flex-wrap gap-3">
                  {WEEKDAY_VALUES.map((value) => (
                    <label key={value} className="flex items-center gap-1.5 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={offDays.includes(value)}
                        onChange={() => toggleOffDay(value)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      {t.weekdays[value]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  {t.back}
                </button>
                <button type="button" onClick={() => setStep(4)} className={`${primaryButtonClass} flex-1`}>
                  {t.next}
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-xl font-semibold text-zinc-900">{t.stepReviewTitle}</h1>
              <p className="text-sm text-zinc-500">{t.stepReviewSubtitle}</p>

              <div className="flex flex-col gap-3 rounded-lg bg-zinc-50 p-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-zinc-400">{t.reviewBusiness}</p>
                  <p className="text-zinc-800">{businessName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">{t.reviewContact}</p>
                  <p className="text-zinc-800">{email}</p>
                  <p className="text-zinc-800">{phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">{t.reviewServices}</p>
                  {services.length === 0 ? (
                    <p className="text-zinc-500">{t.reviewNoServices}</p>
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {services.map((s, i) => (
                        <li key={i} className="text-zinc-800">
                          {s.name} — {t.durationMin(s.durationMinutes)}
                          {s.priceUsd !== null ? ` · $${s.priceUsd}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">{t.reviewHours}</p>
                  <p className="text-zinc-800">
                    {formatHour(startHour)} – {formatHour(endHour)}
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className={`${primaryButtonClass} flex-1`}
                >
                  {submitting ? t.sending : t.requestAccess}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
