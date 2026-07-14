import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/ownerAuth";
import { changeOwnPassword } from "@/lib/store";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await changeOwnPassword(auth.businessId, currentPassword, newPassword);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
