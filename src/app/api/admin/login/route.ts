import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, createAdminSession, setAdminSessionCookie } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body ?? {};

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const sessionId = await createAdminSession();
  const res = NextResponse.json({ success: true });
  setAdminSessionCookie(res, sessionId);
  return res;
}
