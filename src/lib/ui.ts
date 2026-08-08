// Shared Tailwind class strings so form fields and buttons look and feel
// consistent everywhere (focus states, hover transitions, etc.) without
// duplicating slightly-different className strings on every page.

export const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

export const primaryButtonClass =
  "rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-700 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const secondaryButtonClass =
  "rounded-full px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition-all duration-150 hover:bg-zinc-100 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const dangerButtonClass =
  "rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-150 hover:bg-red-100 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const ghostButtonClass =
  "rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-all duration-150 hover:bg-zinc-100 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

// Shared "modern card" shell used everywhere the calendar's look should
// carry over: a soft shadow instead of a flat ring, and a thin brand
// gradient bar across the top. Use cardAccentBarClass as the card's first
// child, then wrap the actual content in its own padded div.
export const cardClass = "overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-zinc-200";
export const cardAccentBarClass = "h-1 bg-gradient-to-r from-zinc-900 via-[#b98b3e] to-cedar";

// A quieter alternative to cardAccentBarClass for secondary cards — one
// page should only have a single full gradient bar (its lead card); every
// other card on that page uses this instead, so the gradient still reads
// as "this is the important one" rather than blanket decoration.
export const cardTopBorderClass = "h-[3px] bg-zinc-900/15";

// Tinted tile for at-a-glance numbers (stat rows, revenue-by-service,
// etc.) — bg-zinc-50 alone sits almost flush against the card's paper
// background, so numbers read flat. This warms the tile against the same
// accent used everywhere else (zinc-900 is remapped to the brand rust).
export const statTileClass = "rounded-lg bg-zinc-900/[0.06] px-3 py-2.5 text-center";

// Placeholder box for "nothing here yet" states — a dashed outline reads
// as an intentional empty slot rather than a stray line of gray text.
export const emptyStateClass =
  "rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-sm text-zinc-400";

// Hover lift for clickable list rows (bookings, services, employees, etc.)
export const listRowHoverClass =
  "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm";

// A small pulsing dot for "awaiting action" states (pending bookings,
// notified waitlist entries, payment pending) — reads as more alive than a
// static badge.
export const pulsingDotClass = "inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full";
