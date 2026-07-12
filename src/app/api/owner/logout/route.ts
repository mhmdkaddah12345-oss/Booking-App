import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE, clearSessionCookie } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await destroySession(sessionId);
  }
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
