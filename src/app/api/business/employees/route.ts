import { NextRequest, NextResponse } from "next/server";
import { addEmployee } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body ?? {};

  if (!name) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const employee = await addEmployee(name);
  return NextResponse.json({ employee }, { status: 201 });
}
