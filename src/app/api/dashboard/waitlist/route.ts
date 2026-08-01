import { NextRequest, NextResponse } from "next/server";
import { joinWaitlist } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { date, serviceIds, customerName, customerPhone, note } = body ?? {};

  if (!date || !Array.isArray(serviceIds) || serviceIds.length === 0 || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const entry = await joinWaitlist(auth.businessId, date, serviceIds, customerName, customerPhone, note || undefined);
  if ("error" in entry) {
    const status = entry.error === "business_locked" ? 403 : 400;
    return NextResponse.json({ error: entry.error }, { status });
  }
  return NextResponse.json({ waitlistEntry: entry }, { status: 201 });
}
