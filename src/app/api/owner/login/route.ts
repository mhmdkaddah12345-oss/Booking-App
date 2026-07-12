import { NextRequest, NextResponse } from "next/server";
import { getExpectedSessionToken, SESSION_COOKIE } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body ?? {};

  if (!password || password !== process.env.OWNER_PASSWORD) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const token = await getExpectedSessionToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
