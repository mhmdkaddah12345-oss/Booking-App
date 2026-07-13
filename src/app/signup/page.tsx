"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass } from "@/lib/ui";

export default function SignupPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        if (data.error === "email_taken") setError("That email is already registered.");
        else setError("Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8">
        <Wordmark />
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-paper p-6 text-center ring-1 ring-zinc-200">
          <h1 className="text-xl font-semibold text-zinc-900">Thanks — request received!</h1>
          <p className="text-sm text-zinc-600">
            We&apos;ll be in touch shortly to set up your account and share your login details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8">
      <Wordmark />
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-paper p-6 ring-1 ring-zinc-200"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Create your booking page</h1>
        <p className="text-sm text-zinc-500">
          Tell us about your business and we&apos;ll reach out to get you set up.
        </p>
        <input
          type="text"
          required
          autoFocus
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="tel"
          required
          placeholder="Phone number (WhatsApp)"
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
          {submitting ? "Sending..." : "Request access"}
        </button>
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/dashboard/login" className="font-medium text-zinc-700 underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
