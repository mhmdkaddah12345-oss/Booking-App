import { NextRequest, NextResponse } from "next/server";
import { getBusinessConfigBySlug, findBookingsByPhone } from "@/lib/store";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const phone = request.nextUrl.searchParams.get("phone");
  if (!slug || !phone) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const business = await getBusinessConfigBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const bookings = await findBookingsByPhone(business.id, phone);
  return NextResponse.json({ bookings });
}
