import { NextRequest, NextResponse } from "next/server";
import { getReportsSummary } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const period = request.nextUrl.searchParams.get("period") === "all" ? "all" : "month";
  const summary = await getReportsSummary(auth.businessId, period);
  return NextResponse.json({ summary });
}
