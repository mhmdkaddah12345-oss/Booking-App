"use client";

import { useEffect, useState } from "react";
import OwnerNav from "@/components/OwnerNav";
import { primaryButtonClass, cardClass, cardAccentBarClass, pulsingDotClass } from "@/lib/ui";
import { IconShieldCheck, IconCreditCard } from "@/components/icons";

type BillingInfo = {
  subscriptionStatus: "trial" | "active" | "expired";
  trialEndsAt: string;
  paidUntil: string | null;
  trialDaysLeft: number;
  paymentPendingSince: string | null;
  bankTransferInstructions: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  function load() {
    fetch("/api/dashboard/billing")
      .then((r) => r.json())
      .then(setBilling);
  }

  useEffect(() => {
    load();
  }, []);

  async function reportPayment() {
    setReporting(true);
    try {
      await fetch("/api/dashboard/billing", { method: "POST" });
      setReported(true);
      load();
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <OwnerNav current="billing" />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Billing</h1>

        {!billing ? (
          <p className="mt-6 text-sm text-zinc-500">Loading...</p>
        ) : (
          <>
            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconShieldCheck className="h-4 w-4 text-zinc-500" />
                  Your plan
                </h2>
                {billing.subscriptionStatus === "trial" && (
                  <p className="mt-1 text-sm text-zinc-600">
                    Free trial — <span className="font-medium">{billing.trialDaysLeft} day(s) left</span> (ends{" "}
                    {formatDate(billing.trialEndsAt)}).
                  </p>
                )}
                {billing.subscriptionStatus === "active" && (
                  <p className="mt-1 text-sm text-zinc-600">
                    Active — paid through <span className="font-medium">{formatDate(billing.paidUntil)}</span>.
                  </p>
                )}
                {billing.subscriptionStatus === "expired" && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    Your subscription has expired. Your booking page and dashboard are locked until you renew.
                  </p>
                )}
                {billing.paymentPendingSince && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-700">
                    <span className={`${pulsingDotClass} bg-amber-500`} />
                    We&apos;ve noted your payment ({formatDate(billing.paymentPendingSince)}) — it&apos;ll be
                    confirmed shortly.
                  </p>
                )}
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconCreditCard className="h-4 w-4 text-zinc-500" />
                  Renew via bank transfer
                </h2>
                {billing.bankTransferInstructions ? (
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    {billing.bankTransferInstructions}
                  </pre>
                ) : (
                  <p className="mt-1 text-sm text-zinc-500">Bank transfer details will be added soon.</p>
                )}
                <button
                  onClick={reportPayment}
                  disabled={reporting}
                  className={`mt-3 ${primaryButtonClass}`}
                >
                  {reporting ? "Reporting..." : "I've sent the transfer"}
                </button>
                {reported && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Thanks — we&apos;ll confirm your payment and extend your access shortly.
                  </p>
                )}
              </div>
            </div>

            <div className={`mt-6 ${cardClass} opacity-60`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconCreditCard className="h-4 w-4 text-zinc-500" />
                  Whish Money / OMT
                </h2>
                <p className="mt-1 text-sm text-zinc-500">Coming soon.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
