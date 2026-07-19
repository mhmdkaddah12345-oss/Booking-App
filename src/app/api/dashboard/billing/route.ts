import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/ownerAuth";
import { getBusinessConfig, getPlatformSettings, markPaymentPending } from "@/lib/store";
import { isPlanId } from "@/lib/plans";

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
    paymentPendingPlan: business.paymentPendingPlan,
    paymentInstructions: settings.paymentInstructions,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const requestedPlan = body?.plan;
  const plan = isPlanId(requestedPlan) ? requestedPlan : null;

  await markPaymentPending(auth.businessId, plan);
  return NextResponse.json({ success: true });
}
