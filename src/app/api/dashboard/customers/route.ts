import { NextRequest, NextResponse } from "next/server";
import { getCustomerSummaries } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const customers = await getCustomerSummaries(auth.businessId);
  return NextResponse.json({ customers });
}
