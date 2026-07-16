import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { generateRecoveryCode } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const { id } = await params;
  const { code } = await generateRecoveryCode(id);
  return NextResponse.json({ code });
}
