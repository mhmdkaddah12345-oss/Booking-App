import { NextRequest, NextResponse } from "next/server";
import { getBusinessConfig, updateBusinessConfig } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET() {
  return NextResponse.json({
    business: await getBusinessConfig(),
  });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const { name, startHour, endHour, offDays } = body ?? {};
  const updates: { name?: string; startHour?: number; endHour?: number; offDays?: number[] } = {};
  if (typeof name === "string") updates.name = name;
  if (typeof startHour === "number") updates.startHour = startHour;
  if (typeof endHour === "number") updates.endHour = endHour;
  if (Array.isArray(offDays)) updates.offDays = offDays;

  const business = await updateBusinessConfig(updates);
  return NextResponse.json({ business });
}
