import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDay, isDayFullyBooked, isDayClosed } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const date = request.nextUrl.searchParams.get("date");
  const serviceIdsParam = request.nextUrl.searchParams.get("serviceIds");

  if (!date || !serviceIdsParam) {
    return NextResponse.json({ error: "date and serviceIds are required" }, { status: 400 });
  }

  const serviceIds = serviceIdsParam.split(",").filter(Boolean);
  const [slots, fullyBooked, closed] = await Promise.all([
    getSlotsForDay(auth.businessId, date, serviceIds),
    isDayFullyBooked(auth.businessId, date, serviceIds),
    isDayClosed(auth.businessId, date),
  ]);

  return NextResponse.json({ slots, fullyBooked, closed });
}
