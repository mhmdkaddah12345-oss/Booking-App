import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDay, isDayFullyBooked, isDayClosed } from "@/lib/store";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  if (!date || !serviceId) {
    return NextResponse.json({ error: "date and serviceId are required" }, { status: 400 });
  }
  return NextResponse.json({
    slots: getSlotsForDay(date, serviceId),
    fullyBooked: isDayFullyBooked(date, serviceId),
    closed: isDayClosed(date),
  });
}
