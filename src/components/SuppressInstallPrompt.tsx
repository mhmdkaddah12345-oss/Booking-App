"use client";

import { useEffect } from "react";

// Customer-facing pages (the booking page, the manage/reschedule page)
// shouldn't ever show Chrome's automatic "Install app" popup — a customer
// booking one appointment has no reason to install the whole platform app.
// That install flow belongs to the landing page's own InstallAppButton,
// which is aimed at the business owner. Without this, Chrome falls back
// to its own default install prompt on any page that doesn't call
// preventDefault() on the event itself.
export default function SuppressInstallPrompt() {
  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  return null;
}
