import { NextRequest, NextResponse } from "next/server";
import { verifyOwnerLogin } from "@/lib/store";
import { createSession, setSessionCookie } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await verifyOwnerLogin(email, password);
  if (!result.success) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const sessionId = await createSession(result.businessId);
  const res = NextResponse.json({ success: true });
  setSessionCookie(res, sessionId);
  return res;
}
