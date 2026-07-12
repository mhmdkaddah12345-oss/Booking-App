// Real email alerts to the platform admin (not the customer-facing WhatsApp
// stub in notifications.ts). Uses Resend's HTTP API directly — no SDK
// dependency needed for a single email type.

const DEFAULT_ALERT_EMAIL = "mhmdkaddah12345@gmail.com";

export async function notifyAdminOfNewSignup(business: {
  name: string;
  email: string;
  phone: string;
  slug: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[admin alert skipped] RESEND_API_KEY not set");
    return;
  }

  const to = process.env.ADMIN_ALERT_EMAIL || DEFAULT_ALERT_EMAIL;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Maw3ed Alerts <onboarding@resend.dev>",
        to,
        subject: `New signup: ${business.name}`,
        text: [
          "A new business signed up on Maw3ed.",
          "",
          `Name: ${business.name}`,
          `Email: ${business.email}`,
          `Phone: ${business.phone}`,
          `Slug: ${business.slug}`,
          "",
          "Activate: https://maw3edapp.com/admin",
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error("[admin alert failed]", res.status, await res.text());
    }
  } catch (err) {
    // A flaky email API should never block a real signup from succeeding.
    console.error("[admin alert error]", err);
  }
}
