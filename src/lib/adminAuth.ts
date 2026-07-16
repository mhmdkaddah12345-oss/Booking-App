import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabaseClient";

// The session cookie is a random opaque token backed by a DB row — same
// pattern as owner sessions — rather than the raw ADMIN_PASSWORD itself, so
// a leaked cookie doesn't hand over the actual login credential and a
// session can be revoked without changing the password.

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && password === expected;
}

export async function createAdminSession(): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const { data, error } = await supabase.from("admin_sessions").insert({ expires_at: expiresAt }).select().single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function destroyAdminSession(sessionId: string): Promise<void> {
  await supabase.from("admin_sessions").delete().eq("id", sessionId);
}

export async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionId) return false;

  const { data } = await supabase.from("admin_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (!data) return false;
  return new Date(data.expires_at).getTime() >= Date.now();
}

/** Call at the top of an admin-only route handler. */
export async function requireAdmin(request: NextRequest): Promise<true | NextResponse> {
  if (!(await hasValidAdminSession(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return true;
}

export function setAdminSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(ADMIN_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export function clearAdminSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
