"use client";

import { useState } from "react";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password.");
        return;
      }
      window.location.href = "/admin";
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
          <h1 className="text-xl font-semibold text-zinc-900">Platform Admin</h1>
          <input
            type="password"
            required
            autoFocus
            placeholder="Admin password"
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
        </div>
      </form>
    </div>
  );
}
