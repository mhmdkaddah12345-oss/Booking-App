"use client";

import { useEffect, useState } from "react";
import Wordmark from "@/components/Wordmark";
import {
  inputClass,
  primaryButtonClass,
  ghostButtonClass,
  cardClass,
  cardAccentBarClass,
  listRowHoverClass,
  pulsingDotClass,
} from "@/lib/ui";
import { IconBuilding, IconCreditCard } from "@/components/icons";
import { PLANS, PlanId } from "@/lib/plans";

type Business = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPhone: string | null;
  activated: boolean;
  subscriptionStatus: "trial" | "active" | "expired";
  trialEndsAt: string;
  paidUntil: string | null;
  trialDaysLeft: number;
  paymentPendingSince: string | null;
  paymentPendingPlan: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ business }: { business: Business }) {
  if (!business.activated) {
    return <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">Pending</span>;
  }
  const styles: Record<Business["subscriptionStatus"], string> = {
    active: "bg-green-50 text-green-700",
    trial: "bg-amber-50 text-amber-700",
    expired: "bg-red-50 text-red-700",
  };
  const labels: Record<Business["subscriptionStatus"], string> = {
    active: `Active until ${formatDate(business.paidUntil)}`,
    trial: `Trial — ${business.trialDaysLeft}d left`,
    expired: "Expired",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[business.subscriptionStatus]}`}>
      {labels[business.subscriptionStatus]}
    </span>
  );
}

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [revealedCodes, setRevealedCodes] = useState<Record<string, string>>({});
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  function load() {
    fetch("/api/admin/businesses")
      .then((r) => r.json())
      .then((data) => setBusinesses(data.businesses));
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setPaymentInstructions(data.settings.paymentInstructions ?? ""));
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/activate`, { method: "POST" });
      const data = await res.json();
      setRevealedPasswords((prev) => ({ ...prev, [id]: data.password }));
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(id: string, plan: PlanId) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/businesses/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function generateRecoveryCode(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/generate-recovery-code`, { method: "POST" });
      const data = await res.json();
      setRevealedCodes((prev) => ({ ...prev, [id]: data.code }));
    } finally {
      setBusyId(null);
    }
  }

  async function cancelSubscription(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/businesses/${id}/cancel`, { method: "POST" });
      setConfirmingCancelId(null);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentInstructions }),
      });
      setSettingsSaved(true);
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Wordmark />
        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Platform Admin</h1>
          <button
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
            className={ghostButtonClass}
          >
            Log out
          </button>
        </div>

        <div className={`mt-6 ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
            <IconBuilding className="h-4 w-4 text-zinc-500" />
            Businesses
          </h2>
          {!businesses ? (
            <p className="mt-3 text-sm text-zinc-500">Loading...</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {businesses.map((b) => (
                <li key={b.id} className={`rounded-lg bg-zinc-50 px-3 py-3 text-sm ${listRowHoverClass}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-800">{b.name}</p>
                      <p className="text-xs text-zinc-500">
                        {b.slug}.maw3edapp.com · {b.ownerEmail}
                        {b.ownerPhone && <> · {b.ownerPhone}</>}
                      </p>
                      {b.paymentPendingSince && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <span className={`${pulsingDotClass} bg-amber-500`} />
                          Payment reported {formatDate(b.paymentPendingSince)}
                          {b.paymentPendingPlan && PLANS[b.paymentPendingPlan as PlanId]
                            ? ` — ${PLANS[b.paymentPendingPlan as PlanId].label} plan`
                            : ""}{" "}
                          — awaiting confirmation
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge business={b} />
                      {!b.activated ? (
                        <button
                          onClick={() => activate(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {busyId === b.id ? "..." : "Activate & generate login"}
                        </button>
                      ) : (
                        <>
                          {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([planId, plan]) => {
                            const isReportedPlan = b.paymentPendingPlan === planId;
                            return (
                              <button
                                key={planId}
                                onClick={() => markPaid(b.id, planId)}
                                disabled={busyId === b.id}
                                title={`Extend by ${plan.days} days ($${plan.priceUsd})`}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
                                  isReportedPlan
                                    ? "bg-zinc-900 text-white hover:bg-zinc-700"
                                    : "text-zinc-600 ring-1 ring-zinc-300 hover:bg-zinc-100"
                                }`}
                              >
                                {busyId === b.id ? "..." : `Mark paid — ${plan.label}`}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => generateRecoveryCode(b.id)}
                            disabled={busyId === b.id}
                            className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-300 transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                          >
                            {busyId === b.id ? "..." : "Generate recovery code"}
                          </button>
                          {b.subscriptionStatus !== "expired" && (
                            <button
                              onClick={() => setConfirmingCancelId(b.id)}
                              disabled={busyId === b.id}
                              className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all duration-150 hover:scale-[1.05] hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              Cancel subscription
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {confirmingCancelId === b.id && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2 ring-1 ring-red-200">
                      <p className="text-xs font-medium text-red-800">
                        Cancel {b.name}&apos;s subscription? Their dashboard and booking page will lock
                        immediately.
                      </p>
                      <button
                        onClick={() => cancelSubscription(b.id)}
                        disabled={busyId === b.id}
                        className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {busyId === b.id ? "..." : "Yes, cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmingCancelId(null)}
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                      >
                        Never mind
                      </button>
                    </div>
                  )}

                  {revealedPasswords[b.id] && (
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                      <p className="text-xs font-medium text-amber-800">
                        Copy this now and send it to the owner — it won&apos;t be shown again:
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-white px-2 py-1 text-sm text-zinc-800 ring-1 ring-amber-200">
                          {b.ownerEmail} / {revealedPasswords[b.id]}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${b.ownerEmail} / ${revealedPasswords[b.id]}`)}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {revealedCodes[b.id] && (
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                      <p className="text-xs font-medium text-amber-800">
                        One-time recovery code — send it to the owner so they can set their own new
                        password at maw3edapp.com/dashboard/reset-with-code. Valid for 48 hours, and
                        it won&apos;t be shown again:
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 truncate rounded bg-white px-2 py-1 text-sm text-zinc-800 ring-1 ring-amber-200">
                          {b.ownerEmail} / {revealedCodes[b.id]}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${b.ownerEmail} / ${revealedCodes[b.id]}`)}
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition-all duration-150 hover:scale-[1.05] hover:bg-zinc-700 active:scale-95"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {businesses.length === 0 && <li className="text-sm text-zinc-400">No businesses yet.</li>}
            </ul>
          )}
          </div>
        </div>

        <form onSubmit={saveSettings} className={`mt-6 ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="flex flex-col gap-3 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
            <IconCreditCard className="h-4 w-4 text-zinc-500" />
            OMT / Whish Money details
          </h2>
          <p className="text-xs text-zinc-500">
            Shown to owners on their Plan page. E.g. OMT account name/number, Whish Money phone number.
          </p>
          <textarea
            value={paymentInstructions}
            onChange={(e) => {
              setPaymentInstructions(e.target.value);
              setSettingsSaved(false);
            }}
            rows={4}
            placeholder="OMT: ...&#10;Whish Money: ..."
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingSettings}
              className={primaryButtonClass}
            >
              {savingSettings ? "Saving..." : "Save"}
            </button>
            {settingsSaved && <span className="text-sm font-medium text-green-700">Saved.</span>}
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
