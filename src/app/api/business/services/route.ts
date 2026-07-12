import { NextRequest, NextResponse } from "next/server";
import { addService } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name, durationMinutes } = body ?? {};

  if (!name || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const service = await addService(auth.businessId, name, durationMinutes);
  return NextResponse.json({ service }, { status: 201 });
}
