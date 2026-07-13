import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { cancelSubscription } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (auth !== true) return auth;

  const { id } = await params;
  await cancelSubscription(id);
  return NextResponse.json({ success: true });
}
