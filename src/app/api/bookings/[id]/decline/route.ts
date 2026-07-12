import { NextRequest, NextResponse } from "next/server";
import { declineBooking } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await declineBooking(id, auth.businessId);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ promoted: result.promoted ?? null });
}
