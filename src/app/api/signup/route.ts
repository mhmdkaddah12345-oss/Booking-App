import { NextRequest, NextResponse } from "next/server";
import { createBusiness, isSlugTaken, slugify } from "@/lib/store";
import { createSession, setSessionCookie } from "@/lib/ownerAuth";

async function uniqueSlugFor(businessName: string): Promise<string> {
  const base = slugify(businessName) || "business";
  let candidate = base;
  let suffix = 2;
  while (await isSlugTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { businessName, email, password } = body ?? {};

  if (!businessName || !email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const slug = await uniqueSlugFor(businessName);
  const result = await createBusiness(businessName, slug, email, password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const sessionId = await createSession(result.businessId);
  const res = NextResponse.json({ success: true, slug });
  setSessionCookie(res, sessionId);
  return res;
}
