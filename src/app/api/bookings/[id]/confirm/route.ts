import { NextRequest, NextResponse } from "next/server";
import { confirmBooking } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await confirmBooking(id, auth.businessId);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
