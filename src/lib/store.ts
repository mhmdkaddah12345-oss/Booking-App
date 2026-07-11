// Temporary in-memory "database" so we can build and test the real screens
// before Supabase is wired in. Every function here will later be rewritten
// to read/write Supabase instead — callers (the API routes) won't change.

import { notify } from "./notifications";

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

export type BusinessConfig = {
  name: string;
  startHour: number; // 24h, e.g. 9 = 9:00
  endHour: number; // 24h, e.g. 18 = 18:00
  slotGranularityMinutes: number; // interval between candidate start times
  services: Service[];
  offDays: number[]; // days of week the business is closed, 0=Sunday .. 6=Saturday
};

export type BookingStatus = "booked" | "cancelled";

export type Booking = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM start time
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
};

export type WaitlistStatus = "waiting" | "notified" | "confirmed";

export type WaitlistEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
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
      slotGranularityMinutes: 15,
      services: [
        { id: "svc-haircut", name: "Haircut", durationMinutes: 30 },
        { id: "svc-coloring", name: "Coloring", durationMinutes: 90 },
        { id: "svc-blowout", name: "Blowout", durationMinutes: 45 },
      ],
      offDays: [],
    },
    bookings: [],
    waitlist: [],
  });

export function getBusinessConfig(): BusinessConfig {
  return store.business;
}

export function getService(serviceId: string): Service | undefined {
  return store.business.services.find((s) => s.id === serviceId);
}

export function updateBusinessConfig(
  updates: Partial<Pick<BusinessConfig, "name" | "startHour" | "endHour" | "offDays">>
) {
  Object.assign(store.business, updates);
  return store.business;
}

export function addService(name: string, durationMinutes: number): Service {
  const service: Service = { id: crypto.randomUUID(), name, durationMinutes };
  store.business.services.push(service);
  return service;
}

export function removeService(serviceId: string): { success: boolean } {
  const index = store.business.services.findIndex((s) => s.id === serviceId);
  if (index === -1) return { success: false };
  store.business.services.splice(index, 1);
  return { success: true };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDayClosed(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  return store.business.offDays.includes(dayOfWeek);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Is [start, start+durationMinutes) free of any booked appointment on that date? */
function isRangeFree(date: string, startMinutes: number, durationMinutes: number, ignoreBookingId?: string): boolean {
  const endMinutes = startMinutes + durationMinutes;
  return !store.bookings.some((b) => {
    if (b.date !== date || b.status !== "booked" || b.id === ignoreBookingId) return false;
    const bStart = timeToMinutes(b.time);
    const bEnd = bStart + b.durationMinutes;
    return rangesOverlap(startMinutes, endMinutes, bStart, bEnd);
  });
}

export type SlotInfo = { time: string; available: boolean };

export function getSlotsForDay(date: string, serviceId: string): SlotInfo[] {
  const service = getService(serviceId);
  if (!service || isDayClosed(date)) return [];

  const { startHour, endHour, slotGranularityMinutes } = store.business;
  const closeMinutes = endHour * 60;

  const today = formatDateISO(new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const slots: SlotInfo[] = [];
  for (let start = startHour * 60; start + service.durationMinutes <= closeMinutes; start += slotGranularityMinutes) {
    if (date === today && start <= nowMinutes) continue;
    slots.push({ time: minutesToTime(start), available: isRangeFree(date, start, service.durationMinutes) });
  }
  return slots;
}

export function isDayFullyBooked(date: string, serviceId: string): boolean {
  const slots = getSlotsForDay(date, serviceId);
  return slots.length > 0 && slots.every((s) => !s.available);
}

type BookingResult =
  | { success: true; booking: Booking }
  | { success: false; error: "slot_taken" | "unknown_service" };

export function createBooking(
  date: string,
  time: string,
  serviceId: string,
  customerName: string,
  customerPhone: string
): BookingResult {
  const service = getService(serviceId);
  if (!service) {
    return { success: false, error: "unknown_service" };
  }

  const startMinutes = timeToMinutes(time);
  if (!isRangeFree(date, startMinutes, service.durationMinutes)) {
    return { success: false, error: "slot_taken" };
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    date,
    time,
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    customerName,
    customerPhone,
    status: "booked",
  };
  store.bookings.push(booking);
  notify("booking_confirmed", { phone: customerPhone, name: customerName, date, time });
  return { success: true, booking };
}

export function joinWaitlist(
  date: string,
  serviceId: string,
  customerName: string,
  customerPhone: string
): WaitlistEntry | { error: "unknown_service" } {
  const service = getService(serviceId);
  if (!service) return { error: "unknown_service" };

  const entry: WaitlistEntry = {
    id: crypto.randomUUID(),
    date,
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
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

  // Only promote someone whose service fits inside the freed time —
  // starting them at the same time guarantees no overlap with anything else,
  // since that whole range was occupied solely by the cancelled booking.
  const nextInLine = store.waitlist
    .filter(
      (w) =>
        w.date === booking.date &&
        w.status === "waiting" &&
        w.durationMinutes <= booking.durationMinutes
    )
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

  const result = createBooking(entry.date, entry.notifiedTime, entry.serviceId, entry.customerName, entry.customerPhone);
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
