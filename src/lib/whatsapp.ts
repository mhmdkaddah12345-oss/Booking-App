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
