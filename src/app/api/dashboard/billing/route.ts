import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/ownerAuth";
import { getBusinessConfig, getPlatformSettings, markPaymentPending } from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const [business, settings] = await Promise.all([getBusinessConfig(auth.businessId), getPlatformSettings()]);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    subscriptionStatus: business.subscriptionStatus,
    trialEndsAt: business.trialEndsAt,
    paidUntil: business.paidUntil,
    trialDaysLeft: business.trialDaysLeft,
    paymentPendingSince: business.paymentPendingSince,
    bankTransferInstructions: settings.bankTransferInstructions,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  await markPaymentPending(auth.businessId);
  return NextResponse.json({ success: true });
}
