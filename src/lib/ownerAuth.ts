import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabaseClient";

export const SESSION_COOKIE = "owner_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function createSession(businessId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ business_id: businessId, expires_at: expiresAt })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function destroySession(sessionId: string): Promise<void> {
  await supabase.from("sessions").delete().eq("id", sessionId);
}

async function getSessionBusinessId(request: NextRequest): Promise<string | null> {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const { data } = await supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return data.business_id;
}

/** Call at the top of an owner-only route handler. Returns the authenticated business's id, or a 401 response to return early. */
export async function requireOwner(request: NextRequest): Promise<{ businessId: string } | NextResponse> {
  const businessId = await getSessionBusinessId(request);
  if (!businessId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return { businessId };
}

export async function hasValidSession(request: NextRequest): Promise<boolean> {
  return (await getSessionBusinessId(request)) !== null;
}

export function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
