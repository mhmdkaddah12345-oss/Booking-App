import { NextRequest, NextResponse } from "next/server";
import { createContactMessage } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body ?? {};

  if (!name || !email || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  await createContactMessage(name, email, message);
  return NextResponse.json({ success: true });
}
