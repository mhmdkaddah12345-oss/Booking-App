"use client";

import { useEffect } from "react";

// The landing page is always shown at maw3edapp.com, even to a logged-in
// owner browsing normally. But an installed PWA opening cold should still
// feel like opening an app, not a website — so if we detect standalone
// display mode, skip the marketing page and go straight to the login form.
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
