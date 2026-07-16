import { NextRequest, NextResponse } from "next/server";
import {
  getSlotsForDay,
  isDayFullyBooked,
  getSlotsForDuration,
  isDayFullyBookedForDuration,
  isDayClosed,
  getBusinessConfigBySlug,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const slug = request.nextUrl.searchParams.get("slug");
  const serviceIdsParam = request.nextUrl.searchParams.get("serviceIds");
  const durationParam = request.nextUrl.searchParams.get("durationMinutes");

  if (!date || !slug || (!serviceIdsParam && !durationParam)) {
    return NextResponse.json({ error: "date, slug, and serviceIds (or durationMinutes) are required" }, { status: 400 });
  }

  const business = await getBusinessConfigBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (durationParam) {
    const durationMinutes = Number(durationParam);
    const [slots, fullyBooked, closed] = await Promise.all([
      getSlotsForDuration(business.id, date, durationMinutes),
      isDayFullyBookedForDuration(business.id, date, durationMinutes),
      isDayClosed(business.id, date),
    ]);
    return NextResponse.json({ slots, fullyBooked, closed });
  }

  const serviceIds = serviceIdsParam!.split(",").filter(Boolean);
  const [slots, fullyBooked, closed] = await Promise.all([
    getSlotsForDay(business.id, date, serviceIds),
    isDayFullyBooked(business.id, date, serviceIds),
    isDayClosed(business.id, date),
  ]);

  return NextResponse.json({ slots, fullyBooked, closed });
}
