import { NextRequest, NextResponse } from "next/server";
import { getBusinessConfig, getBusinessConfigBySlug, updateBusinessConfig } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (slug) {
    const business = await getBusinessConfigBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ business });
  }

  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;
  const business = await getBusinessConfig(auth.businessId);
  return NextResponse.json({ business });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name, startHour, endHour, offDays } = body ?? {};
  const updates: { name?: string; startHour?: number; endHour?: number; offDays?: number[] } = {};
  if (typeof name === "string") updates.name = name;
  if (typeof startHour === "number") updates.startHour = startHour;
  if (typeof endHour === "number") updates.endHour = endHour;
  if (Array.isArray(offDays)) updates.offDays = offDays;

  const business = await updateBusinessConfig(auth.businessId, updates);
  return NextResponse.json({ business });
}
