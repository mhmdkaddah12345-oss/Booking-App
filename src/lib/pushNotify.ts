// Owner-facing web push (e.g. "New booking request") — separate from the
// customer-facing WhatsApp stub in notifications.ts. Uses the standard
// web-push library to handle VAPID signing and payload encryption.

import webpush from "web-push";
import { supabase } from "./supabaseClient";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:mhmdkaddah12345@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function notifyOwnerPush(businessId: string, title: string, body: string, url = "/dashboard") {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[push skipped] VAPID keys not configured");
    return;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("business_id", businessId);

  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, url })
      );
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription no longer valid (uninstalled, permission revoked, etc.) — clean it up.
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("[push error]", err);
      }
    }
  }
}
