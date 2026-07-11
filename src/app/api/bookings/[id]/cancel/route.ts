import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = cancelBooking(id);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ promoted: result.promoted ?? null });
}
