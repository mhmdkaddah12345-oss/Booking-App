import { NextResponse } from "next/server";
import { getAllBookings, getAllWaitlist } from "@/lib/store";

export async function GET() {
  const bookings = getAllBookings()
    .filter((b) => b.status === "booked")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const waitlist = getAllWaitlist()
    .filter((w) => w.status === "waiting" || w.status === "notified")
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));

  return NextResponse.json({ bookings, waitlist });
}
