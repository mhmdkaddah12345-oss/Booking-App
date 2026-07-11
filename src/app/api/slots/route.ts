import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDay, isDayFullyBooked, isDayClosed } from "@/lib/store";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  if (!date || !serviceId) {
    return NextResponse.json({ error: "date and serviceId are required" }, { status: 400 });
  }
  const [slots, fullyBooked, closed] = await Promise.all([
    getSlotsForDay(date, serviceId),
    isDayFullyBooked(date, serviceId),
    isDayClosed(date),
  ]);

  return NextResponse.json({ slots, fullyBooked, closed });
}
