import { NextResponse } from "next/server";
import { getBusinessConfig, getNextDays } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    business: getBusinessConfig(),
    days: getNextDays(7),
  });
}
