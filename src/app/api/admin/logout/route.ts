import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, destroyAdminSession, clearAdminSessionCookie } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (sessionId) await destroyAdminSession(sessionId);

  const res = NextResponse.json({ success: true });
  clearAdminSessionCookie(res);
  return res;
}
