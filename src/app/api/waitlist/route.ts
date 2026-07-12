import { NextRequest, NextResponse } from "next/server";
import { joinWaitlist, getBusinessConfigBySlug } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, date, serviceId, customerName, customerPhone, note } = body ?? {};

  if (!slug || !date || !serviceId || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const business = await getBusinessConfigBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const entry = await joinWaitlist(business.id, date, serviceId, customerName, customerPhone, note || undefined);
  if ("error" in entry) {
    return NextResponse.json({ error: entry.error }, { status: 400 });
  }
  return NextResponse.json({ waitlistEntry: entry }, { status: 201 });
}
