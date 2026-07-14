"use client";

import { useEffect } from "react";

// The landing page is only ever server-rendered for a logged-out visitor
// (middleware already redirects logged-in owners to /dashboard). But an
// installed PWA opening cold should feel like opening an app, not a
// website — so if we detect standalone display mode, skip the marketing
// page and go straight to the login form.
export default function StandaloneLoginRedirect() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      window.location.replace("/dashboard/login");
    }
  }, []);

  return null;
}
