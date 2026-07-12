import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/adminAuth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearAdminSessionCookie(res);
  return res;
}
