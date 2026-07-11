import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDay, isDayFullyBooked } from "@/lib/store";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  return NextResponse.json({
    slots: getSlotsForDay(date),
    fullyBooked: isDayFullyBooked(date),
  });
}
