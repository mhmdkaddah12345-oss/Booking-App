import { NextRequest, NextResponse } from "next/server";
import { addScheduleException, getScheduleExceptions } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const exceptions = await getScheduleExceptions(auth.businessId);
  return NextResponse.json({ exceptions });
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { date, startTime, endTime, note } = body ?? {};
  if (typeof date !== "string" || !date) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const hasStart = typeof startTime === "string" && startTime.length > 0;
  const hasEnd = typeof endTime === "string" && endTime.length > 0;
  if (hasStart !== hasEnd) {
    return NextResponse.json({ error: "start_and_end_required_together" }, { status: 400 });
  }

  const exception = await addScheduleException(
    auth.businessId,
    date,
    hasStart ? startTime : null,
    hasEnd ? endTime : null,
    typeof note === "string" && note ? note : null
  );
  return NextResponse.json({ exception }, { status: 201 });
}
