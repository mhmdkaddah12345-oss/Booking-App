import { NextRequest, NextResponse } from "next/server";
import { removeFaq, updateFaq } from "@/lib/store";
import { requireOwner } from "@/lib/ownerAuth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  const { question, answer, questionAr, answerAr } = body ?? {};
  if (typeof question !== "string" || !question.trim() || typeof answer !== "string" || !answer.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (
    (questionAr !== undefined && questionAr !== null && typeof questionAr !== "string") ||
    (answerAr !== undefined && answerAr !== null && typeof answerAr !== "string")
  ) {
    return NextResponse.json({ error: "invalid_arabic_fields" }, { status: 400 });
  }

  const faq = await updateFaq(
    id,
    auth.businessId,
    question,
    answer,
    questionAr === "" ? null : questionAr ?? null,
    answerAr === "" ? null : answerAr ?? null
  );
  if (!faq) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ faq });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await removeFaq(id, auth.businessId);
  if (!result.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
