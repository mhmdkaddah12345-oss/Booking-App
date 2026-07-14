"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass } from "@/lib/ui";

export default function OwnerLoginPage() {
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
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-paper p-6 ring-1 ring-zinc-200"
      >
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
        <button
          type="button"
          onClick={() => setShowForgotHelp((v) => !v)}
          className="text-center text-sm font-medium text-zinc-600 underline"
        >
          Forgot your password?
        </button>
        {showForgotHelp && (
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm leading-relaxed text-zinc-600">
            Email us at{" "}
            <a href="mailto:mhmdkaddah12345@gmail.com" className="font-medium text-zinc-800 underline">
              mhmdkaddah12345@gmail.com
            </a>{" "}
            with your business name and we&apos;ll reset it for you.
          </p>
        )}
        <p className="text-center text-sm text-zinc-500">
          New business?{" "}
          <Link href="/signup" className="font-medium text-zinc-700 underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
