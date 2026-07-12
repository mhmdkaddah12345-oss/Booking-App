import { NextRequest, NextResponse } from "next/server";
import { addService } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const { name, durationMinutes } = body ?? {};

  if (!name || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const service = await addService(name, durationMinutes);
  return NextResponse.json({ service }, { status: 201 });
}
