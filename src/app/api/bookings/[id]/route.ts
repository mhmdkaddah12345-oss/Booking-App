import { NextRequest, NextResponse } from "next/server";
import { getBooking, getBusinessConfig, rescheduleBooking } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const business = await getBusinessConfig(booking.businessId);
  return NextResponse.json({
    booking,
    business: { slug: business?.slug, offDays: business?.offDays ?? [], accentColor: business?.accentColor ?? null },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { date, time } = body ?? {};
  if (!date || !time) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Same pattern as the cancel endpoint: customers reschedule via their
  // manage link with no session at all, so that path must keep working
  // unauthenticated. The dashboard's own Reschedule button hits this same
  // endpoint marked with this header; only then do we require a valid
  // owner session and scope the change to that owner's own business (which
  // also skips the customer-reschedule reconfirmation-to-pending step,
  // since the owner is the one approving the change).
  let requireBusinessId: string | undefined;
  if (request.headers.get("x-dashboard-action") === "1") {
    const auth = await requireOwner(request);
    if (auth instanceof NextResponse) return auth;
    requireBusinessId = auth.businessId;
  }

  const result = await rescheduleBooking(id, date, time, requireBusinessId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  return NextResponse.json({ booking: result.booking });
}
