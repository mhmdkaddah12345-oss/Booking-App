import { NextRequest, NextResponse } from "next/server";
import { getReportsSummary } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const period = request.nextUrl.searchParams.get("period") === "all" ? "all" : "month";
  const monthParam = request.nextUrl.searchParams.get("month");
  const month = monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : undefined;
  const summary = await getReportsSummary(auth.businessId, period, month);
  return NextResponse.json({ summary });
}
