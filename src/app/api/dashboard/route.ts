import { NextResponse } from "next/server";
import { getAllBookings, getAllWaitlist } from "@/lib/store";

export async function GET() {
  const bookings = getAllBookings().filter((b) => b.status === "booked");
  const waitlist = getAllWaitlist().filter((w) => w.status === "waiting" || w.status === "notified");

  const dates = Array.from(new Set([...bookings.map((b) => b.date), ...waitlist.map((w) => w.date)])).sort();

  const days = dates.map((date) => ({
    date,
    bookings: bookings.filter((b) => b.date === date).sort((a, b) => a.time.localeCompare(b.time)),
    waitlist: waitlist.filter((w) => w.date === date).sort((a, b) => a.createdAt - b.createdAt),
  }));

  return NextResponse.json({ days });
}
