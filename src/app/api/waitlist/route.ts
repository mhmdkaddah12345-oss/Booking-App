import { NextRequest, NextResponse } from "next/server";
import { joinWaitlist } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, customerName, customerPhone } = body ?? {};

  if (!date || !customerName || !customerPhone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const entry = joinWaitlist(date, customerName, customerPhone);
  return NextResponse.json({ waitlistEntry: entry }, { status: 201 });
}
