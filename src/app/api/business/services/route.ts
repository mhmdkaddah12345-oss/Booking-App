import { NextRequest, NextResponse } from "next/server";
import { addService } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name, durationMinutes, priceUsd } = body ?? {};

  if (!name || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (priceUsd !== undefined && priceUsd !== null && (typeof priceUsd !== "number" || priceUsd < 0)) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }

  const service = await addService(auth.businessId, name, durationMinutes, priceUsd ?? null);
  return NextResponse.json({ service }, { status: 201 });
}
