"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";

export default function OwnerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        setError("Incorrect email or password.");
        return;
      }
      window.location.href = "/dashboard";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8">
      <Wordmark />
      <form onSubmit={handleSubmit} className={`w-full max-w-sm ${cardClass}`}>
        <div className={cardAccentBarClass} />
        <div className="flex flex-col gap-4 p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Owner Login</h1>
          <input
            type="email"
            required
            autoFocus
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password"
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
            {submitting ? "Checking..." : "Log in"}
          </button>
          <p className="text-center text-sm text-zinc-500">
            New business?{" "}
            <Link href="/signup" className="font-medium text-zinc-700 underline">
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
