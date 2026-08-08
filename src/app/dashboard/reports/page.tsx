"use client";

import { useEffect, useState } from "react";
import OwnerNav from "@/components/OwnerNav";
import { cardClass, cardAccentBarClass } from "@/lib/ui";
import { IconTrendingUp } from "@/components/icons";
import { useOwnerLang } from "@/lib/useOwnerLang";
import { reportsCopy } from "@/lib/reportsPageTranslations";

type ReportsSummary = {
  totalRevenueUsd: number;
  totalBookings: number;
  cancelledCount: number;
  revenueByService: { serviceName: string; revenueUsd: number }[];
  busiestWeekdays: { dayOfWeek: number; count: number }[];
};

type Period = "month" | "all";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center">
      <p className="text-2xl font-semibold tabular-nums text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [lang, setLang] = useOwnerLang();
  const t = reportsCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [period, setPeriod] = useState<Period>("month");
  const [summary, setSummary] = useState<ReportsSummary | null>(null);

  useEffect(() => {
    setSummary(null);
    fetch(`/api/dashboard/reports?period=${period}`)
      .then((r) => r.json())
      .then((data) => setSummary(data.summary));
  }, [period]);

  return (
    <div dir={dir} className={`min-h-screen bg-zinc-50 px-4 py-8 ${lang === "ar" ? "lang-ar" : ""}`}>
      <div className="mx-auto max-w-3xl">
        <OwnerNav current="reports" lang={lang} onToggleLang={() => setLang(lang === "en" ? "ar" : "en")} />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">{t.title}</h1>

        <div className={`mt-6 ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <IconTrendingUp className="h-4 w-4 text-zinc-500" />
                  {t.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">{t.body}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
                {(["month", "all"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      period === p ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {p === "month" ? t.periodMonth : t.periodAll}
                  </button>
                ))}
              </div>
            </div>

            {!summary ? (
              <p className="mt-4 text-sm text-zinc-500">{t.loading}</p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatCard label={t.statRevenue} value={`$${summary.totalRevenueUsd}`} />
                  <StatCard label={t.statBookings} value={summary.totalBookings} />
                  <StatCard label={t.statCancelled} value={summary.cancelledCount} />
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-4">
                  <h3 className="text-sm font-semibold text-zinc-800">{t.revenueByServiceTitle}</h3>
                  {summary.revenueByService.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">{t.noRevenueYet}</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {summary.revenueByService.map((s) => (
                        <StatCard key={s.serviceName} label={s.serviceName} value={`$${s.revenueUsd}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-4">
                  <h3 className="text-sm font-semibold text-zinc-800">{t.busiestDayTitle}</h3>
                  {summary.busiestWeekdays.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">{t.noBookingsYet}</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {summary.busiestWeekdays.map((d) => (
                        <li
                          key={d.dayOfWeek}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                        >
                          <span className="text-zinc-700">{t.weekdays[d.dayOfWeek]}</span>
                          <span className="font-medium text-zinc-800">{d.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
