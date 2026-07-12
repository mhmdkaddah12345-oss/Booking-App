import { NextRequest, NextResponse } from "next/server";
import { removeService } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const result = await removeService(id);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
