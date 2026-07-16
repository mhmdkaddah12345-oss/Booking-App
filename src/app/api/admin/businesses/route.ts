import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { listAllBusinessesForAdmin } from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth !== true) return auth;

  const businesses = await listAllBusinessesForAdmin();
  return NextResponse.json({ businesses });
}
