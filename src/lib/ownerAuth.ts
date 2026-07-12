import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "owner_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getExpectedSessionToken(): Promise<string> {
  return sha256Hex(`${process.env.OWNER_PASSWORD ?? ""}:owner-session-v1`);
}

export async function isOwnerRequest(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  return cookie === (await getExpectedSessionToken());
}

/** Call at the top of an owner-only route handler; returns a 401 response to return early, or null if authorized. */
export async function requireOwner(request: NextRequest): Promise<NextResponse | null> {
  if (await isOwnerRequest(request)) return null;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
