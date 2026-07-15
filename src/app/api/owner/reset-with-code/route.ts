import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithCode } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { email, code, newPassword } = await request.json();
  if (!email || !code || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await resetPasswordWithCode(email, code, newPassword);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
