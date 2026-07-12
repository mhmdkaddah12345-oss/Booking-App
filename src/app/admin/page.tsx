"use client";

import { useEffect, useState } from "react";
import Wordmark from "@/components/Wordmark";

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
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [bankInstructions, setBankInstructions] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  function load() {
    fetch("/api/admin/businesses")
      .then((r) => r.json())
      .then((data) => setBusinesses(data.businesses));
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setBankInstructions(data.settings.bankTransferInstructions ?? ""));
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

  async function markPaid(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/businesses/${id}/mark-paid`, { method: "POST" });
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
        body: JSON.stringify({ bankTransferInstructions: bankInstructions }),
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
            className="text-sm font-medium text-zinc-600 hover:underline"
          >
            Log out
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-paper p-4 ring-1 ring-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-800">Businesses</h2>
          {!businesses ? (
            <p className="mt-3 text-sm text-zinc-500">Loading...</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {businesses.map((b) => (
                <li key={b.id} className="rounded-lg bg-zinc-50 px-3 py-3 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-800">{b.name}</p>
                      <p className="text-xs text-zinc-500">
                        {b.slug}.maw3edapp.com · {b.ownerEmail}
                        {b.ownerPhone && <> · {b.ownerPhone}</>}
                      </p>
                      {b.paymentPendingSince && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Payment reported {formatDate(b.paymentPendingSince)} — awaiting confirmation
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge business={b} />
                      {!b.activated ? (
                        <button
                          onClick={() => activate(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                          {busyId === b.id ? "..." : "Activate & generate login"}
                        </button>
                      ) : (
                        <button
                          onClick={() => markPaid(b.id)}
                          disabled={busyId === b.id}
                          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                          {busyId === b.id ? "..." : "Mark paid (+30d)"}
                        </button>
                      )}
                    </div>
                  </div>

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
                          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700"
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

        <form
          onSubmit={saveSettings}
          className="mt-6 flex flex-col gap-3 rounded-xl bg-paper p-4 ring-1 ring-zinc-200"
        >
          <h2 className="text-sm font-semibold text-zinc-800">Bank transfer details</h2>
          <p className="text-xs text-zinc-500">
            Shown to owners on their Billing page. E.g. bank name, account holder, account number/IBAN.
          </p>
          <textarea
            value={bankInstructions}
            onChange={(e) => {
              setBankInstructions(e.target.value);
              setSettingsSaved(false);
            }}
            rows={4}
            placeholder="Bank: ...&#10;Account holder: ...&#10;Account number / IBAN: ..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {savingSettings ? "Saving..." : "Save"}
            </button>
            {settingsSaved && <span className="text-sm font-medium text-green-700">Saved.</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
