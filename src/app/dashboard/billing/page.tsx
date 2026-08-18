"use client";

import { useEffect, useState } from "react";
import OwnerNav from "@/components/OwnerNav";
import Spinner from "@/components/Spinner";
import { cardClass, cardAccentBarClass, cardTopBorderClass, pulsingDotClass } from "@/lib/ui";
import { IconShieldCheck, IconCreditCard, IconWhish } from "@/components/icons";
import { PLANS, PlanId } from "@/lib/plans";
import { useOwnerLang } from "@/lib/useOwnerLang";
import { billingCopy } from "@/lib/billingPageTranslations";

type BillingInfo = {
  subscriptionStatus: "trial" | "active" | "expired";
  trialEndsAt: string;
  paidUntil: string | null;
  trialDaysLeft: number;
  paymentPendingSince: string | null;
  paymentPendingPlan: string | null;
  paymentInstructions: string | null;
};

function formatDate(iso: string | null, locale: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export default function BillingPage() {
  const [lang, setLang] = useOwnerLang();
  const t = billingCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

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
    <div dir={dir} className={`min-h-screen bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="mx-auto max-w-4xl">
        <OwnerNav current="billing" lang={lang} onToggleLang={() => setLang(lang === "en" ? "ar" : "en")} />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t.pageSubtitle}</p>

        {!billing ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <Spinner />
            {t.loading}
          </div>
        ) : (
          <>
            <div className={`mt-6 ${cardClass}`}>
              <div className={cardAccentBarClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconShieldCheck className="h-4 w-4 text-zinc-500" />
                  {t.yourPlan}
                </h2>
                {billing.subscriptionStatus === "trial" && (
                  <p className="mt-1 text-sm text-zinc-600">
                    {t.freeTrial(billing.trialDaysLeft, formatDate(billing.trialEndsAt, t.localeTag))}
                  </p>
                )}
                {billing.subscriptionStatus === "active" && (
                  <p className="mt-1 text-sm text-zinc-600">{t.active(formatDate(billing.paidUntil, t.localeTag))}</p>
                )}
                {billing.subscriptionStatus === "expired" && (
                  <p className="mt-1 text-sm font-medium text-red-600">{t.expired}</p>
                )}
                {billing.paymentPendingSince && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-700">
                    <span className={`${pulsingDotClass} bg-amber-500`} />
                    {t.paymentNoted(
                      formatDate(billing.paymentPendingSince, t.localeTag),
                      billing.paymentPendingPlan && PLANS[billing.paymentPendingPlan as PlanId]
                        ? t.planNames[billing.paymentPendingPlan] ?? PLANS[billing.paymentPendingPlan as PlanId].label
                        : ""
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconCreditCard className="h-4 w-4 text-zinc-500" />
                  {t.choosePlan}
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([planId, plan]) => (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setSelectedPlan(planId)}
                      className={`rounded-xl px-3 py-3 text-start transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                        selectedPlan === planId
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      <p className="text-sm font-semibold">{t.planNames[planId] ?? plan.label}</p>
                      <p className="mt-1 flex items-baseline gap-1.5">
                        {plan.compareAtUsd && (
                          <span
                            className={`text-sm line-through ${
                              selectedPlan === planId ? "text-zinc-400" : "text-zinc-300"
                            }`}
                          >
                            ${plan.compareAtUsd}
                          </span>
                        )}
                        <span className="text-lg font-semibold">${plan.priceUsd}</span>
                      </p>
                      <p className={`text-xs ${selectedPlan === planId ? "text-zinc-300" : "text-zinc-500"}`}>
                        {t.perMonth(plan.perMonthUsd)}
                        {plan.discountLabel
                          ? ` — ${lang === "ar" ? `وفّر ${plan.discountLabel.replace(/\D/g, "")}٪` : plan.discountLabel}`
                          : ""}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-400">{t.lbpNote}</p>
              </div>
            </div>

            <div className={`mt-6 ${cardClass}`}>
              <div className={cardTopBorderClass} />
              <div className="p-4">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconCreditCard className="h-4 w-4 text-zinc-500" />
                  {t.payVia}
                </h2>
                {billing.paymentInstructions ? (
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    {billing.paymentInstructions}
                  </pre>
                ) : (
                  <p className="mt-1 text-sm text-zinc-500">{t.paymentDetailsSoon}</p>
                )}
                <p className="mt-2 text-sm text-zinc-600">
                  {t.sendingFor(t.planNames[selectedPlan] ?? PLANS[selectedPlan].label, PLANS[selectedPlan].priceUsd)}
                </p>
                <button
                  type="button"
                  disabled={reporting}
                  onClick={reportPayment}
                  className="mt-3 flex w-fit items-center gap-2 rounded-full bg-[#ED1C4D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d5183f] disabled:opacity-60"
                >
                  <IconWhish className="h-5 w-5" />
                  {reporting ? t.reporting : t.payWithWhish(PLANS[selectedPlan].priceUsd)}
                </button>
                {reported && <p className="mt-2 text-sm text-zinc-500">{t.thanksReported}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
