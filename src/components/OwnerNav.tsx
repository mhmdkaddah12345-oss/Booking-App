"use client";

import Link from "next/link";
import Wordmark from "./Wordmark";
import type { Lang } from "@/lib/useOwnerLang";

const TAB_LABELS = {
  en: { dashboard: "Dashboard", settings: "Settings", billing: "Plan", logOut: "Log out", langToggle: "العربية" },
  ar: { dashboard: "لوحة التحكم", settings: "الإعدادات", billing: "الاشتراك", logOut: "تسجيل خروج", langToggle: "English" },
} as const;

const TABS = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/dashboard/settings", key: "settings" },
  { href: "/dashboard/billing", key: "billing" },
] as const;

export default function OwnerNav({
  current,
  lang,
  onToggleLang,
}: {
  current: "dashboard" | "settings" | "billing";
  lang: Lang;
  onToggleLang: () => void;
}) {
  const labels = TAB_LABELS[lang];
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Wordmark />
      <div className="flex flex-wrap items-center gap-1">
        {TABS.map((tab) => {
          const isCurrent = tab.key === current;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isCurrent ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {labels[tab.key]}
            </Link>
          );
        })}
        <button
          onClick={async () => {
            await fetch("/api/owner/logout", { method: "POST" });
            window.location.href = "/dashboard/login";
          }}
          className="ml-1 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          {labels.logOut}
        </button>
        <button
          type="button"
          onClick={onToggleLang}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
        >
          {labels.langToggle}
        </button>
      </div>
    </div>
  );
}
