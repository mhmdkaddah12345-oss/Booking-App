import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, time, serviceId, customerName, customerPhone } = body ?? {};

  if (!date || !time || !serviceId || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = createBooking(date, time, serviceId, customerName, customerPhone);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
