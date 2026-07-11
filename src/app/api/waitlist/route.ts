import { NextRequest, NextResponse } from "next/server";
import { joinWaitlist } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, serviceId, customerName, customerPhone, note } = body ?? {};

  if (!date || !serviceId || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const entry = joinWaitlist(date, serviceId, customerName, customerPhone, note || undefined);
  if ("error" in entry) {
    return NextResponse.json({ error: entry.error }, { status: 400 });
  }
  return NextResponse.json({ waitlistEntry: entry }, { status: 201 });
}
