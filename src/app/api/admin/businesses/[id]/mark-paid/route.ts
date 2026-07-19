import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { markBusinessPaid } from "@/lib/store";
import { PLANS, isPlanId } from "@/lib/plans";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedPlan = body?.plan;
  const plan = isPlanId(requestedPlan) ? requestedPlan : "monthly";
  await markBusinessPaid(id, PLANS[plan].days);
  return NextResponse.json({ success: true });
}
