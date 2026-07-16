import { NextRequest, NextResponse } from "next/server";
import { joinWaitlist, getBusinessConfigBySlug } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, date, serviceIds, customerName, customerPhone, note } = body ?? {};

  if (!slug || !date || !Array.isArray(serviceIds) || serviceIds.length === 0 || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const business = await getBusinessConfigBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const entry = await joinWaitlist(business.id, date, serviceIds, customerName, customerPhone, note || undefined);
  if ("error" in entry) {
    const status = entry.error === "business_locked" ? 403 : 400;
    return NextResponse.json({ error: entry.error }, { status });
  }
  return NextResponse.json({ waitlistEntry: entry }, { status: 201 });
}
