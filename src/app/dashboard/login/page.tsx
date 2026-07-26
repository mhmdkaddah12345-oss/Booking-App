"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";
import { ownerLoginCopy, type Lang } from "@/lib/ownerLoginTranslations";

const SUPPORT_EMAIL = "mhmdkaddah12345@gmail.com";

export default function OwnerLoginPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = ownerLoginCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(t.incorrectCredentials);
        return;
      }
      window.location.href = "/dashboard";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir={dir} className={`flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="flex w-full max-w-sm justify-end">
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
        >
          {t.langToggle}
        </button>
      </div>
      <Wordmark />
      <form onSubmit={handleSubmit} className={`w-full max-w-sm ${cardClass}`}>
        <div className={cardAccentBarClass} />
        <div className="flex flex-col gap-4 p-6">
          <h1 className="text-xl font-semibold text-zinc-900">{t.title}</h1>
          <input
            type="email"
            required
            autoFocus
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className={primaryButtonClass}
          >
            {submitting ? t.checking : t.logIn}
          </button>
          <button
            type="button"
            onClick={() => setShowForgotHelp((v) => !v)}
            className="text-center text-sm font-medium text-zinc-600 underline"
          >
            {t.forgotPassword}
          </button>
          {showForgotHelp && (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm leading-relaxed text-zinc-600">
              {t.forgotHelp(SUPPORT_EMAIL)}{" "}
              <Link href="/dashboard/reset-with-code" className="font-medium text-zinc-800 underline">
                {t.resetPassword}
              </Link>
              .
            </p>
          )}
          <p className="text-center text-sm text-zinc-500">
            {t.newBusiness}{" "}
            <Link href="/signup" className="font-medium text-zinc-700 underline">
              {t.createAccount}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
