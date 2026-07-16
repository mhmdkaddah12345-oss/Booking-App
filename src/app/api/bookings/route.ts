import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBusinessConfigBySlug } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, date, time, serviceIds, customerName, customerPhone, note } = body ?? {};

  if (!slug || !date || !time || !Array.isArray(serviceIds) || serviceIds.length === 0 || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const business = await getBusinessConfigBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = await createBooking(business.id, date, time, serviceIds, customerName, customerPhone, note || undefined);
  if (!result.success) {
    const status = result.error === "business_locked" ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
