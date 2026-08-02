import { NextRequest, NextResponse } from "next/server";
import { addFaq } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { question, answer } = body ?? {};
  if (!question || !answer) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const faq = await addFaq(auth.businessId, question, answer);
  return NextResponse.json({ faq }, { status: 201 });
}
