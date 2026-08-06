// Single source of truth for subscription pricing — the landing page,
// dashboard billing page, and admin "mark paid" actions all read from this
// so the numbers can never drift out of sync with each other.
export type PlanId = "monthly" | "half_year" | "yearly";

export const PLANS: Record<
  PlanId,
  { label: string; days: number; priceUsd: number; perMonthUsd: number; compareAtUsd?: number; discountLabel?: string }
> = {
  monthly: { label: "Monthly", days: 30, priceUsd: 30, perMonthUsd: 30 },
  half_year: {
    label: "6-Month",
    days: 182,
    priceUsd: 150,
    perMonthUsd: 25,
    compareAtUsd: 180, // 6 x the monthly price, for the "instead of $180" anchor
    discountLabel: "Save ~17%",
  },
  yearly: {
    label: "Yearly",
    days: 365,
    priceUsd: 240,
    perMonthUsd: 20,
    compareAtUsd: 360, // 12 x the monthly price
    discountLabel: "Save ~33%",
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "half_year" || value === "yearly";
}

// Whish Money "Payment Link" checkout pages — one per plan tier since each
// link is created for a fixed amount. Regenerate and update here if the
// owner's Whish account/number changes.
export const WHISH_PAY_LINKS: Record<PlanId, string> = {
  monthly: "https://whish.money/pay/tWUI9NFKZ",
  half_year: "https://whish.money/pay/wWpINQihA",
  yearly: "https://whish.money/pay/3WAIdQG7I",
};
