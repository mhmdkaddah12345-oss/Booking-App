"use client";

import { useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { inputClass, primaryButtonClass, cardClass, cardAccentBarClass } from "@/lib/ui";

export default function ResetWithCodePage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/reset-with-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "code_expired"
            ? "That code has expired. Ask us for a new one."
            : "That email/code combination isn't valid."
        );
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8">
        <Wordmark />
        <div className={`w-full max-w-sm ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="flex flex-col gap-4 p-6 text-center">
            <h1 className="text-xl font-semibold text-zinc-900">Password updated</h1>
            <p className="text-sm text-zinc-600">You can now log in with your new password.</p>
            <Link href="/dashboard/login" className={primaryButtonClass}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-8">
      <Wordmark />
      <form onSubmit={handleSubmit} className={`w-full max-w-sm ${cardClass}`}>
        <div className={cardAccentBarClass} />
        <div className="flex flex-col gap-4 p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Reset your password</h1>
          <p className="text-sm text-zinc-500">
            Enter the recovery code we sent you, along with a new password of your choosing.
          </p>
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
            type="text"
            required
            placeholder="Recovery code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Saving..." : "Set new password"}
          </button>
          <p className="text-center text-sm text-zinc-500">
            <Link href="/dashboard/login" className="font-medium text-zinc-700 underline">
              Back to login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
