import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDay, isDayFullyBooked, isDayClosed, getBusinessConfigBySlug } from "@/lib/store";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const slug = request.nextUrl.searchParams.get("slug");
  if (!date || !serviceId || !slug) {
    return NextResponse.json({ error: "date, serviceId, and slug are required" }, { status: 400 });
  }

  const business = await getBusinessConfigBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [slots, fullyBooked, closed] = await Promise.all([
    getSlotsForDay(business.id, date, serviceId),
    isDayFullyBooked(business.id, date, serviceId),
    isDayClosed(business.id, date),
  ]);

  return NextResponse.json({ slots, fullyBooked, closed });
}
