"use client";

import { useEffect, useState } from "react";
import OwnerNav from "@/components/OwnerNav";
import { primaryButtonClass, cardClass, cardAccentBarClass, listRowHoverClass } from "@/lib/ui";
import { IconUsers } from "@/components/icons";
import { useOwnerLang } from "@/lib/useOwnerLang";
import { customersCopy } from "@/lib/customersPageTranslations";
import { formatDisplayDate } from "@/lib/formatDate";

type CustomerSummary = {
  phone: string;
  name: string;
  visitCount: number;
  lastVisitDate: string;
  totalSpentUsd: number | null;
};

// Wraps a field in quotes and escapes any quotes inside it, per RFC 4180 —
// needed since customer names/notes can contain commas.
function csvField(value: string | number): string {
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function downloadCsv(
  customers: CustomerSummary[],
  t: { colName: string; colPhone: string; colVisits: string; colLastVisit: string; colTotalSpent: string }
) {
  const header = [t.colName, t.colPhone, t.colVisits, t.colLastVisit, t.colTotalSpent].map(csvField).join(",");
  const rows = customers.map((c) =>
    [
      csvField(c.name),
      csvField(c.phone),
      csvField(c.visitCount),
      csvField(c.lastVisitDate),
      csvField(c.totalSpentUsd !== null ? c.totalSpentUsd : ""),
    ].join(",")
  );
  const csv = [header, ...rows].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "customers.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [lang, setLang] = useOwnerLang();
  const t = customersCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers ?? []));
  }, []);

  return (
    <div dir={dir} className={`min-h-screen bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="mx-auto max-w-4xl">
        <OwnerNav current="customers" lang={lang} onToggleLang={() => setLang(lang === "en" ? "ar" : "en")} />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">{t.title}</h1>

        <div className={`mt-6 ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconUsers className="h-4 w-4 text-zinc-500" />
                  {t.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">{t.body}</p>
              </div>
              {customers && customers.length > 0 && (
                <button onClick={() => downloadCsv(customers, t)} className={primaryButtonClass}>
                  {t.downloadCsv}
                </button>
              )}
            </div>

            {!customers ? (
              <p className="mt-4 text-sm text-zinc-500">{t.loading}</p>
            ) : customers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">{t.noCustomersYet}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      <th className="px-3 py-2 text-start">{t.colName}</th>
                      <th className="px-3 py-2 text-start">{t.colPhone}</th>
                      <th className="px-3 py-2 text-start">{t.colVisits}</th>
                      <th className="px-3 py-2 text-start">{t.colLastVisit}</th>
                      <th className="px-3 py-2 text-start">{t.colTotalSpent}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.phone} className={`rounded-lg ${listRowHoverClass}`}>
                        <td className="px-3 py-2.5 font-medium text-zinc-800">{c.name}</td>
                        <td dir="ltr" className="px-3 py-2.5 text-start text-zinc-600">
                          {c.phone}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-600">{c.visitCount}</td>
                        <td className="px-3 py-2.5 text-zinc-600">{formatDisplayDate(c.lastVisitDate, lang)}</td>
                        <td className="px-3 py-2.5 text-zinc-600">
                          {c.totalSpentUsd !== null ? `$${c.totalSpentUsd}` : t.notAvailable}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
