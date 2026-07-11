// Temporary in-memory "database" so we can build and test the real screens
// before Supabase is wired in. Every function here will later be rewritten
// to read/write Supabase instead — callers (the API routes) won't change.

import { notify } from "./notifications";

export type BusinessConfig = {
  name: string;
  startHour: number; // 24h, e.g. 9 = 9:00
  endHour: number; // 24h, e.g. 18 = 18:00
  slotMinutes: number;
};

export type BookingStatus = "booked" | "cancelled";

export type Booking = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
};

export type WaitlistStatus = "waiting" | "notified" | "confirmed";

export type WaitlistEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  customerPhone: string;
  status: WaitlistStatus;
  createdAt: number;
  notifiedTime?: string; // slot offered once status becomes "notified"
};

type Store = {
  business: BusinessConfig;
  bookings: Booking[];
  waitlist: WaitlistEntry[];
};

type GlobalWithStore = typeof globalThis & { __bookingStore?: Store };
const g = globalThis as GlobalWithStore;

const store: Store =
  g.__bookingStore ??
  (g.__bookingStore = {
    business: {
      name: "Demo Salon (placeholder — tell Claude the real name)",
      startHour: 9,
      endHour: 18,
      slotMinutes: 30,
    },
    bookings: [],
    waitlist: [],
  });

export function getBusinessConfig(): BusinessConfig {
  return store.business;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getNextDays(count: number): { date: string; label: string }[] {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: formatDateISO(d),
      label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return days;
}

function allTimesForDay(): string[] {
  const { startHour, endHour, slotMinutes } = store.business;
  const times: string[] = [];
  let minutesFromMidnight = startHour * 60;
  const endMinutes = endHour * 60;
  while (minutesFromMidnight < endMinutes) {
    const h = Math.floor(minutesFromMidnight / 60);
    const m = minutesFromMidnight % 60;
    times.push(`${pad(h)}:${pad(m)}`);
    minutesFromMidnight += slotMinutes;
  }
  return times;
}

export type SlotInfo = { time: string; available: boolean };

export function getSlotsForDay(date: string): SlotInfo[] {
  const takenTimes = new Set(
    store.bookings.filter((b) => b.date === date && b.status === "booked").map((b) => b.time)
  );

  const today = formatDateISO(new Date());
  const nowStr = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;

  return allTimesForDay()
    .filter((time) => !(date === today && time <= nowStr))
    .map((time) => ({ time, available: !takenTimes.has(time) }));
}

export function isDayFullyBooked(date: string): boolean {
  const slots = getSlotsForDay(date);
  return slots.length > 0 && slots.every((s) => !s.available);
}

type BookingResult =
  | { success: true; booking: Booking }
  | { success: false; error: "slot_taken" };

export function createBooking(
  date: string,
  time: string,
  customerName: string,
  customerPhone: string
): BookingResult {
  const alreadyTaken = store.bookings.some(
    (b) => b.date === date && b.time === time && b.status === "booked"
  );
  if (alreadyTaken) {
    return { success: false, error: "slot_taken" };
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    date,
    time,
    customerName,
    customerPhone,
    status: "booked",
  };
  store.bookings.push(booking);
  notify("booking_confirmed", { phone: customerPhone, name: customerName, date, time });
  return { success: true, booking };
}

export function joinWaitlist(date: string, customerName: string, customerPhone: string): WaitlistEntry {
  const entry: WaitlistEntry = {
    id: crypto.randomUUID(),
    date,
    customerName,
    customerPhone,
    status: "waiting",
    createdAt: Date.now(),
  };
  store.waitlist.push(entry);
  notify("waitlist_joined", { phone: customerPhone, name: customerName, date });
  return entry;
}

export function getAllBookings(): Booking[] {
  return store.bookings;
}

export function getAllWaitlist(): WaitlistEntry[] {
  return store.waitlist;
}

export function cancelBooking(id: string): { success: boolean; promoted?: WaitlistEntry } {
  const booking = store.bookings.find((b) => b.id === id);
  if (!booking || booking.status !== "booked") {
    return { success: false };
  }
  booking.status = "cancelled";
  notify("booking_cancelled", {
    phone: booking.customerPhone,
    name: booking.customerName,
    date: booking.date,
    time: booking.time,
  });

  const nextInLine = store.waitlist
    .filter((w) => w.date === booking.date && w.status === "waiting")
    .sort((a, b) => a.createdAt - b.createdAt)[0];

  if (nextInLine) {
    nextInLine.status = "notified";
    nextInLine.notifiedTime = booking.time;
    notify("waitlist_slot_offered", {
      phone: nextInLine.customerPhone,
      name: nextInLine.customerName,
      date: nextInLine.date,
      time: booking.time,
    });
    return { success: true, promoted: nextInLine };
  }

  return { success: true };
}

export function confirmWaitlistPromotion(waitlistId: string): { success: boolean; error?: string } {
  const entry = store.waitlist.find((w) => w.id === waitlistId);
  if (!entry || entry.status !== "notified" || !entry.notifiedTime) {
    return { success: false, error: "not_eligible" };
  }

  const result = createBooking(entry.date, entry.notifiedTime, entry.customerName, entry.customerPhone);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  entry.status = "confirmed";
  notify("waitlist_confirmed", {
    phone: entry.customerPhone,
    name: entry.customerName,
    date: entry.date,
    time: entry.notifiedTime,
  });
  return { success: true };
}
