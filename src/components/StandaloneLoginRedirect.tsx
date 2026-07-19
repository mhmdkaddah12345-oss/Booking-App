"use client";

import { useEffect } from "react";

// The landing page is always shown at maw3edapp.com, even to a logged-in
// owner browsing normally. But an installed PWA opening cold should still
// feel like opening an app, not a website — so if we detect standalone
// display mode, skip the marketing page and go to /dashboard. Middleware
// decides from there: valid session shows the dashboard, no session bounces
// to /dashboard/login. Redirecting straight to /dashboard/login here (as
// this used to) would force a fresh login on every cold launch even with a
// perfectly valid 30-day session.
export default function StandaloneLoginRedirect() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      window.location.replace("/dashboard");
    }
  }, []);

  return null;
}
