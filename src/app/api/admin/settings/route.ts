import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const settings = await getPlatformSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const body = await request.json();
  const { paymentInstructions } = body ?? {};
  if (typeof paymentInstructions !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  await updatePlatformSettings(paymentInstructions);
  return NextResponse.json({ success: true });
}
