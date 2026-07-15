import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/ownerAuth";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { endpoint } = await request.json();
  if (!endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
  }

  await supabase.from("push_subscriptions").delete().eq("business_id", auth.businessId).eq("endpoint", endpoint);
  return NextResponse.json({ success: true });
}
