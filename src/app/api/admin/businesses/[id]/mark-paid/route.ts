import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { markBusinessPaid } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const { id } = await params;
  await markBusinessPaid(id);
  return NextResponse.json({ success: true });
}
