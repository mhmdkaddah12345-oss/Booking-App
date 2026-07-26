import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

// Cambria (the site's single Latin typeface) has no Arabic glyphs, so an
// Arabic-capable font is a technical requirement for the language toggle,
// not a second display-font choice. Cairo is scoped behind a CSS variable
// and only actually applied when a page switches into Arabic (see the
// `.lang-ar` rule in globals.css) — English pages are unaffected.
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "Maw3ed — Booking pages for local businesses",
  description: "Booking app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Maw3ed",
  },
};

export const viewport: Viewport = {
  themeColor: "#b5654f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${cairo.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
