import { NextRequest, NextResponse } from "next/server";
import { addEmployee } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name } = body ?? {};

  if (!name) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const employee = await addEmployee(auth.businessId, name);
  return NextResponse.json({ employee }, { status: 201 });
}
