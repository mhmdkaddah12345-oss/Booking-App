import { NextRequest, NextResponse } from "next/server";
import { removeLogoImage } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function DELETE(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  await removeLogoImage(auth.businessId);
  return NextResponse.json({ success: true });
}
