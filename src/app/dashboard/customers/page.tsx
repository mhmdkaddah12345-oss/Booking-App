"use client";

import { useEffect, useMemo, useState } from "react";
import OwnerNav from "@/components/OwnerNav";
import { primaryButtonClass, ghostButtonClass, inputClass, cardClass, cardAccentBarClass, listRowHoverClass } from "@/lib/ui";
import { IconUsers } from "@/components/icons";
import { useOwnerLang } from "@/lib/useOwnerLang";
import { customersCopy } from "@/lib/customersPageTranslations";
import { formatDisplayDate } from "@/lib/formatDate";

type CustomerHistoryEntry = {
  date: string;
  time: string;
  serviceName: string;
  durationMinutes: number;
  status: "pending" | "booked" | "cancelled";
};

type CustomerSummary = {
  phone: string;
  name: string;
  visitCount: number;
  lastVisitDate: string;
  totalSpentUsd: number | null;
  serviceNames: string[];
  history: CustomerHistoryEntry[];
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
  const [serviceFilter, setServiceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historyCustomer, setHistoryCustomer] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers ?? []));
  }, []);

  const allServiceNames = useMemo(() => {
    if (!customers) return [];
    return Array.from(new Set(customers.flatMap((c) => c.serviceNames))).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((c) => {
      if (serviceFilter && !c.serviceNames.includes(serviceFilter)) return false;
      if (fromDate && c.lastVisitDate < fromDate) return false;
      if (toDate && c.lastVisitDate > toDate) return false;
      return true;
    });
  }, [customers, serviceFilter, fromDate, toDate]);

  const hasActiveFilters = serviceFilter !== "" || fromDate !== "" || toDate !== "";

  function clearFilters() {
    setServiceFilter("");
    setFromDate("");
    setToDate("");
  }

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
                <button onClick={() => downloadCsv(filteredCustomers, t)} className={primaryButtonClass}>
                  {t.downloadCsv}
                </button>
              )}
            </div>

            {customers && customers.length > 0 && (
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-4">
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.filterServiceLabel}
                  <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={inputClass}>
                    <option value="">{t.filterServiceAll}</option>
                    {allServiceNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.filterFromLabel}
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  {t.filterToLabel}
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
                </label>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className={ghostButtonClass}>
                    {t.clearFilters}
                  </button>
                )}
              </div>
            )}

            {!customers ? (
              <p className="mt-4 text-sm text-zinc-500">{t.loading}</p>
            ) : customers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">{t.noCustomersYet}</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-400">{t.noneMatchFilters}</p>
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
                    {filteredCustomers.map((c) => (
                      <tr
                        key={c.phone}
                        onClick={() => setHistoryCustomer(c)}
                        className={`cursor-pointer rounded-lg ${listRowHoverClass}`}
                      >
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

      {historyCustomer && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setHistoryCustomer(null)}
        >
          <div
            className={`w-full max-w-lg ${cardClass} max-h-full overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cardAccentBarClass} />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-800">{t.historyModalTitle(historyCustomer.name)}</p>
                <button
                  type="button"
                  onClick={() => setHistoryCustomer(null)}
                  aria-label={t.close}
                  className="rounded-full px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      <th className="px-2 py-2 text-start">{t.historyColDate}</th>
                      <th className="px-2 py-2 text-start">{t.historyColTime}</th>
                      <th className="px-2 py-2 text-start">{t.historyColService}</th>
                      <th className="px-2 py-2 text-start">{t.historyColDuration}</th>
                      <th className="px-2 py-2 text-start">{t.historyColStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyCustomer.history.map((h, i) => (
                      <tr key={i} className="border-b border-zinc-50 last:border-0">
                        <td className="px-2 py-2 text-zinc-700">{formatDisplayDate(h.date, lang)}</td>
                        <td dir="ltr" className="px-2 py-2 text-start text-zinc-600">
                          {h.time}
                        </td>
                        <td className="px-2 py-2 text-zinc-700">{h.serviceName}</td>
                        <td className="px-2 py-2 text-zinc-600">{t.minutesShort(h.durationMinutes)}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              h.status === "booked"
                                ? "bg-green-50 text-green-700"
                                : h.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {h.status === "booked" ? t.statusBooked : h.status === "pending" ? t.statusPending : t.statusCancelled}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className={`mt-4 ${ghostButtonClass}`}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
