import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book An Appointment",
  description: "Booking app",
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
