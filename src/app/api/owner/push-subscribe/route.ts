import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/ownerAuth";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { business_id: auth.businessId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: "endpoint" }
    );
  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true });
}
