import { NextRequest, NextResponse } from "next/server";
import { confirmWaitlistPromotion } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const result = await confirmWaitlistPromotion(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
