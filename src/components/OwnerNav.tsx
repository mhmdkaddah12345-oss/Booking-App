"use client";

import Link from "next/link";
import Wordmark from "./Wordmark";
import type { Lang } from "@/lib/useOwnerLang";
import { IconChartBar, IconGear, IconCreditCard, IconUsers } from "./icons";

const TAB_LABELS = {
  en: {
    dashboard: "Dashboard",
    settings: "Settings",
    customers: "Customers",
    billing: "Plan",
    logOut: "Log out",
    langToggle: "العربية",
  },
  ar: {
    dashboard: "لوحة التحكم",
    settings: "الإعدادات",
    customers: "الزباين",
    billing: "الاشتراك",
    logOut: "تسجيل خروج",
    langToggle: "English",
  },
} as const;

const TABS = [
  { href: "/dashboard", key: "dashboard", Icon: IconChartBar },
  { href: "/dashboard/settings", key: "settings", Icon: IconGear },
  { href: "/dashboard/customers", key: "customers", Icon: IconUsers },
  { href: "/dashboard/billing", key: "billing", Icon: IconCreditCard },
] as const;

export default function OwnerNav({
  current,
  lang,
  onToggleLang,
}: {
  current: "dashboard" | "settings" | "customers" | "billing";
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
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isCurrent ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
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
