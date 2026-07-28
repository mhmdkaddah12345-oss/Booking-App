import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getContactMessages } from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const messages = await getContactMessages();
  return NextResponse.json({ messages });
}
