import { NextRequest, NextResponse } from "next/server";
import {
  getSlotsForDay,
  isDayFullyBooked,
  isDayClosed,
  getSlotsForDuration,
  isDayFullyBookedForDuration,
} from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const date = request.nextUrl.searchParams.get("date");
  const serviceIdsParam = request.nextUrl.searchParams.get("serviceIds");
  const durationParam = request.nextUrl.searchParams.get("durationMinutes");

  if (!date || (!serviceIdsParam && !durationParam)) {
    return NextResponse.json({ error: "date and serviceIds (or durationMinutes) are required" }, { status: 400 });
  }

  if (durationParam) {
    const durationMinutes = Number(durationParam);
    const [slots, fullyBooked, closed] = await Promise.all([
      getSlotsForDuration(auth.businessId, date, durationMinutes),
      isDayFullyBookedForDuration(auth.businessId, date, durationMinutes),
      isDayClosed(auth.businessId, date),
    ]);
    return NextResponse.json({ slots, fullyBooked, closed });
  }

  const serviceIds = serviceIdsParam!.split(",").filter(Boolean);
  const [slots, fullyBooked, closed] = await Promise.all([
    getSlotsForDay(auth.businessId, date, serviceIds),
    isDayFullyBooked(auth.businessId, date, serviceIds),
    isDayClosed(auth.businessId, date),
  ]);

  return NextResponse.json({ slots, fullyBooked, closed });
}
