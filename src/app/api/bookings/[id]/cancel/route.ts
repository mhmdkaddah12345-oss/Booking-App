import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

// Customers cancel via their manage link with no session at all — that path
// must keep working exactly as before. The dashboard's own Cancel button
// hits this same endpoint, so it marks itself with this header; only then
// do we require a valid owner session and scope the cancellation to that
// owner's own business. Without the header, an owner who happens to be
// logged in elsewhere in the same browser (e.g. also a customer at a
// different business) can still use their manage link normally.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let requireBusinessId: string | undefined;
  if (request.headers.get("x-dashboard-action") === "1") {
    const auth = await requireOwner(request);
    if (auth instanceof NextResponse) return auth;
    requireBusinessId = auth.businessId;
  }

  const result = await cancelBooking(id, requireBusinessId);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ promoted: result.promoted ?? null });
}
