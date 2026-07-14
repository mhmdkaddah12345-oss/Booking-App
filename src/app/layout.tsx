import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
