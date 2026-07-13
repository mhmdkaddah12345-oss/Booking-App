// Shared Tailwind class strings so form fields and buttons look and feel
// consistent everywhere (focus states, hover transitions, etc.) without
// duplicating slightly-different className strings on every page.

export const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

export const primaryButtonClass =
  "rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50";

export const secondaryButtonClass =
  "rounded-full px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100 disabled:opacity-50";

export const dangerButtonClass =
  "rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50";

export const ghostButtonClass =
  "rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50";
