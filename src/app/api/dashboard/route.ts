import { NextRequest, NextResponse } from "next/server";
import { getAllBookings, getAllWaitlist } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return unauthorized;

  const [allBookings, allWaitlist] = await Promise.all([getAllBookings(), getAllWaitlist()]);

  const bookings = allBookings
    .filter((b) => b.status === "booked")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const waitlist = allWaitlist
    .filter((w) => w.status === "waiting" || w.status === "notified")
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));

  return NextResponse.json({ bookings, waitlist });
}
