"use client";

import { useEffect, useState } from "react";
import OwnerNav from "@/components/OwnerNav";
import { primaryButtonClass, cardClass, cardAccentBarClass, pulsingDotClass } from "@/lib/ui";
import { IconShieldCheck, IconCreditCard } from "@/components/icons";
import { PLANS, PlanId } from "@/lib/plans";

type BillingInfo = {
  subscriptionStatus: "trial" | "active" | "expired";
  trialEndsAt: string;
  paidUntil: string | null;
  trialDaysLeft: number;
  paymentPendingSince: string | null;
  paymentPendingPlan: string | null;
  bankTransferInstructions: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
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
      await fetch("/api/dashboard/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
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
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Plan</h1>

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
                    We&apos;ve noted your payment ({formatDate(billing.paymentPendingSince)}
                    {billing.paymentPendingPlan && PLANS[billing.paymentPendingPlan as PlanId]
                      ? ` — ${PLANS[billing.paymentPendingPlan as PlanId].label} plan`
                      : ""}
                    ) — it&apos;ll be confirmed shortly.
                  </p>
                )}
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconCreditCard className="h-4 w-4 text-zinc-500" />
                  Choose a plan
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([planId, plan]) => (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setSelectedPlan(planId)}
                      className={`rounded-xl px-3 py-3 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                        selectedPlan === planId
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      <p className="text-sm font-semibold">{plan.label}</p>
                      <p className="mt-1 text-lg font-semibold">${plan.priceUsd}</p>
                      <p className={`text-xs ${selectedPlan === planId ? "text-zinc-300" : "text-zinc-500"}`}>
                        ${plan.perMonthUsd}/mo{plan.discountLabel ? ` — ${plan.discountLabel}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-400">LBP equivalent to market rate at time of payment.</p>
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
                <p className="mt-2 text-sm text-zinc-600">
                  Sending for the <span className="font-medium">{PLANS[selectedPlan].label}</span> plan — $
                  {PLANS[selectedPlan].priceUsd}.
                </p>
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
