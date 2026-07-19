// Single source of truth for subscription pricing — the landing page,
// dashboard billing page, and admin "mark paid" actions all read from this
// so the numbers can never drift out of sync with each other.
export type PlanId = "monthly" | "half_year" | "yearly";

export const PLANS: Record<PlanId, { label: string; days: number; priceUsd: number; perMonthUsd: number; discountLabel?: string }> = {
  monthly: { label: "Monthly", days: 30, priceUsd: 30, perMonthUsd: 30 },
  half_year: { label: "6-Month", days: 182, priceUsd: 150, perMonthUsd: 25, discountLabel: "Save ~17%" },
  yearly: { label: "Yearly", days: 365, priceUsd: 240, perMonthUsd: 20, discountLabel: "Save ~33%" },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "half_year" || value === "yearly";
}
