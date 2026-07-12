import { NextRequest, NextResponse } from "next/server";
import { getAllBookings, getAllWaitlist } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const [allBookings, allWaitlist] = await Promise.all([
    getAllBookings(auth.businessId),
    getAllWaitlist(auth.businessId),
  ]);

  const bookings = allBookings
    .filter((b) => b.status === "booked")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const waitlist = allWaitlist
    .filter((w) => w.status === "waiting" || w.status === "notified")
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));

  return NextResponse.json({ bookings, waitlist });
}
