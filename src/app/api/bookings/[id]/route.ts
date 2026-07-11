import { NextRequest, NextResponse } from "next/server";
import { getBooking, rescheduleBooking } from "@/lib/store";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ booking });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, time } = body ?? {};
  if (!date || !time) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = rescheduleBooking(id, date, time);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  return NextResponse.json({ booking: result.booking });
}
