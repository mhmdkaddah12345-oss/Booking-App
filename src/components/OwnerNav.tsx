"use client";

import Link from "next/link";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/billing", label: "Billing" },
] as const;

export default function OwnerNav({ current }: { current: "dashboard" | "settings" | "billing" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-lg font-semibold tracking-tight text-zinc-800">Maw3ed</span>
      <div className="flex items-center gap-1">
        {TABS.map((tab) => {
          const isCurrent = tab.href === "/dashboard" ? current === "dashboard" : tab.href.endsWith(current);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isCurrent ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {tab.label}
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
          Log out
        </button>
      </div>
    </div>
  );
}
