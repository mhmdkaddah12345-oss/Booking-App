import { NextRequest, NextResponse } from "next/server";
import { getBusinessConfig, getNextDays, updateBusinessConfig } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    business: getBusinessConfig(),
    days: getNextDays(7),
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { name, startHour, endHour } = body ?? {};
  const updates: { name?: string; startHour?: number; endHour?: number } = {};
  if (typeof name === "string") updates.name = name;
  if (typeof startHour === "number") updates.startHour = startHour;
  if (typeof endHour === "number") updates.endHour = endHour;

  const business = updateBusinessConfig(updates);
  return NextResponse.json({ business });
}
