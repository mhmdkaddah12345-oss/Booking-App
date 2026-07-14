import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maw3ed — Booking pages for local businesses",
    short_name: "Maw3ed",
    description: "Booking pages for salons, clinics, and gyms — with automatic waitlist promotion.",
    start_url: "/",
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
