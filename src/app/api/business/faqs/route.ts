import { NextRequest, NextResponse } from "next/server";
import { addFaq } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { question, answer, questionAr, answerAr } = body ?? {};
  if (!question || !answer) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (
    (questionAr !== undefined && questionAr !== null && typeof questionAr !== "string") ||
    (answerAr !== undefined && answerAr !== null && typeof answerAr !== "string")
  ) {
    return NextResponse.json({ error: "invalid_arabic_fields" }, { status: 400 });
  }

  const faq = await addFaq(
    auth.businessId,
    question,
    answer,
    questionAr === "" ? null : questionAr ?? null,
    answerAr === "" ? null : answerAr ?? null
  );
  return NextResponse.json({ faq }, { status: 201 });
}
