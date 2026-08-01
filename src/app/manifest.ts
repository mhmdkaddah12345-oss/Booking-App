import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maw3ed — Booking pages for local businesses",
    short_name: "Maw3ed",
    description: "Booking pages for salons, clinics, and gyms — with automatic waitlist promotion.",
    // Was "/" — the installed app used to load the full landing page on
    // every cold launch, then a client-side redirect bounced to /dashboard
    // a moment later, causing a visible flash of the marketing page first.
    // Pointing straight at /dashboard skips that: middleware already
    // handles auth from there (valid session shows it, no session bounces
    // to /dashboard/login), so nothing else needs to change.
    start_url: "/dashboard",
    // Explicit, not left to the default (which would otherwise be scoped
    // to /dashboard/ based on start_url) — the installed app also needs to
    // navigate to /manage/[id], /b/[slug], etc. without kicking out to a
    // regular browser tab.
    scope: "/",
    display: "standalone",
    background_color: "#fbf3ec",
    theme_color: "#b5654f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
