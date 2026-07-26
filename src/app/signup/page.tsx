"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";
import { signupCopy, type Lang } from "@/lib/signupPageTranslations";

export default function SignupPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = signupCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, email, phone }),
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

  return (
    <div dir={dir} className={`flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="flex w-full max-w-sm justify-end">{LangToggle}</div>
      <Wordmark />
      <form onSubmit={handleSubmit} className={`w-full max-w-sm ${cardClass}`}>
        <div className={cardAccentBarClass} />
        <div className="flex flex-col gap-4 p-6">
          <h1 className="text-xl font-semibold text-zinc-900">{t.title}</h1>
          <p className="text-sm text-zinc-500">{t.subtitle}</p>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className={primaryButtonClass}
          >
            {submitting ? t.sending : t.requestAccess}
          </button>
          <p className="text-center text-sm text-zinc-500">
            {t.alreadyHaveAccount}{" "}
            <Link href="/dashboard/login" className="font-medium text-zinc-700 underline">
              {t.logIn}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
