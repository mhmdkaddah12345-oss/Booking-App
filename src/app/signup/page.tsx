"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "email_taken") setError("That email is already registered.");
        else if (data.error === "password_too_short") setError("Password must be at least 8 characters.");
        else setError("Something went wrong. Please try again.");
        return;
      }
      setCreatedSlug(data.slug);
    } finally {
      setSubmitting(false);
    }
  }

  if (createdSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-6 text-center ring-1 ring-zinc-200">
          <h1 className="text-xl font-semibold text-zinc-900">You&apos;re all set!</h1>
          <p className="text-sm text-zinc-600">
            Your booking page is live at:
            <br />
            <span className="font-medium text-zinc-900">{createdSlug}.maw3edapp.com</span>
            <br />
            <span className="text-xs text-zinc-400">(subdomain goes live once DNS is configured)</span>
          </p>
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-zinc-200"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Create your booking page</h1>
        <input
          type="text"
          required
          autoFocus
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create account"}
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
