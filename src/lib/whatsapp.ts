// Builds a WhatsApp "click to chat" link (wa.me) — free, no Business API
// needed. Opens WhatsApp with a pre-filled message the owner reviews and
// sends themselves, since real automated WhatsApp sending costs money per
// message and hasn't been wired up.
const LEBANON_COUNTRY_CODE = "961";

function toInternationalLebanesePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.startsWith(LEBANON_COUNTRY_CODE) ? digits : `${LEBANON_COUNTRY_CODE}${digits}`;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${toInternationalLebanesePhone(phone)}?text=${encodeURIComponent(message)}`;
}

// iOS Safari (especially inside the installed standalone PWA) handles a
// real <a target="_blank"> click reliably — WebKit intercepts the
// wa.me universal link and hands off to the WhatsApp app before the
// current page ever starts navigating. window.open(url, "_blank") and
// location.href assignment don't get that same treatment: inside a
// standalone PWA they can leave the app's own (only) window stuck on
// about:blank or on wa.me itself once the user switches back from
// WhatsApp. Clicking a real anchor avoids ever navigating the app away
// from whatever page it was already on (e.g. the dashboard).
export function openWhatsApp(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
