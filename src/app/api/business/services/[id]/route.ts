import { NextRequest, NextResponse } from "next/server";
import { removeService, updateService } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  const { name, durationMinutes, priceUsd } = body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof durationMinutes !== "number") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const service = await updateService(id, auth.businessId, name, durationMinutes, priceUsd ?? null);
  if (!service) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ service });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await removeService(id, auth.businessId);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
