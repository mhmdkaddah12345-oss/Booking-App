import { NextRequest, NextResponse } from "next/server";
import { createBusiness, isSlugTaken, slugify } from "@/lib/store";
import { notifyAdminOfNewSignup } from "@/lib/adminAlerts";

// "www" specifically would never resolve — middleware treats www.maw3edapp.com
// as the root domain, not a tenant subdomain — and the rest are just
// operationally confusing subdomains to hand out. Treated as already-taken
// so the normal auto-suffix logic below picks a different slug instead.
const RESERVED_SLUGS = new Set(["www", "admin", "api", "dashboard", "app", "mail", "ftp", "assets", "static"]);

async function uniqueSlugFor(businessName: string): Promise<string> {
  const base = slugify(businessName) || "business";
  let candidate = base;
  let suffix = 2;
  while (RESERVED_SLUGS.has(candidate) || (await isSlugTaken(candidate))) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { businessName, email, phone } = body ?? {};

  if (!businessName || !email || !phone) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const slug = await uniqueSlugFor(businessName);
  const result = await createBusiness(businessName, slug, email, phone);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await notifyAdminOfNewSignup({ name: businessName, email, phone, slug });

  return NextResponse.json({ success: true, slug });
}
