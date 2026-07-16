import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { date, time, serviceIds, customerName, customerPhone, note } = body ?? {};

  if (!date || !time || !Array.isArray(serviceIds) || serviceIds.length === 0 || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await createBooking(
    auth.businessId,
    date,
    time,
    serviceIds,
    customerName,
    customerPhone,
    note || undefined,
    "booked"
  );
  if (!result.success) {
    const status = result.error === "business_locked" ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
