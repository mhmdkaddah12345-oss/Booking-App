import { NextRequest, NextResponse } from "next/server";

// Uses plain string comparison rather than Node's crypto module: middleware
// runs on the Edge runtime, which doesn't support Node's crypto/Buffer APIs
// the same way, causing session checks there to silently always fail.

export const ADMIN_SESSION_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && password === expected;
}

export function hasValidAdminSession(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const expected = process.env.ADMIN_PASSWORD;
  return !!cookie && !!expected && cookie === expected;
}

/** Call at the top of an admin-only route handler. */
export function requireAdmin(request: NextRequest): true | NextResponse {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return true;
}

export function setAdminSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_SESSION_COOKIE, process.env.ADMIN_PASSWORD ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
