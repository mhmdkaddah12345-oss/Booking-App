import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { activateBusiness } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const { id } = await params;
  const { password } = await activateBusiness(id);
  return NextResponse.json({ password });
}
