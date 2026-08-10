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
  const { name, startHour, endHour, offDays, about, accentColor, ownerPhone, allowEmployeeChoice, breakStartTime, breakEndTime } =
    body ?? {};
  const updates: {
    name?: string;
    startHour?: number;
    endHour?: number;
    offDays?: number[];
    about?: string;
    accentColor?: string;
    ownerPhone?: string;
    allowEmployeeChoice?: boolean;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
  } = {};
  if (typeof name === "string") updates.name = name;
  if (typeof startHour === "number") updates.startHour = startHour;
  if (typeof endHour === "number") updates.endHour = endHour;
  if (Array.isArray(offDays)) updates.offDays = offDays;
  if (typeof about === "string") updates.about = about;
  if (typeof accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(accentColor)) updates.accentColor = accentColor;
  if (typeof ownerPhone === "string") updates.ownerPhone = ownerPhone;
  if (typeof allowEmployeeChoice === "boolean") updates.allowEmployeeChoice = allowEmployeeChoice;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (breakStartTime === null || (typeof breakStartTime === "string" && timePattern.test(breakStartTime))) {
    updates.breakStartTime = breakStartTime;
  }
  if (breakEndTime === null || (typeof breakEndTime === "string" && timePattern.test(breakEndTime))) {
    updates.breakEndTime = breakEndTime;
  }

  const business = await updateBusinessConfig(auth.businessId, updates);
  return NextResponse.json({ business });
}
