// Supabase-backed data layer. All Supabase access lives here — API routes
// only ever call these functions, never the client directly.
//
// Everything is scoped to a business_id (multi-tenant): owner-only actions
// take the businessId resolved from the caller's session; customer-facing
// actions resolve the business from its public slug instead.

import { randomBytes } from "crypto";
import { supabase } from "./supabaseClient";
import { notify } from "./notifications";
import { hashPassword, verifyPassword } from "./passwordHash";

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

export type Employee = {
  id: string;
  name: string;
};

export type SubscriptionStatus = "trial" | "active" | "expired";

export type BusinessConfig = {
  id: string;
  slug: string;
  name: string;
  startHour: number; // 24h, e.g. 9 = 9:00
  endHour: number; // 24h, e.g. 18 = 18:00
  slotGranularityMinutes: number; // interval between candidate start times
  services: Service[];
  employees: Employee[];
  offDays: number[]; // days of week the business is closed, 0=Sunday .. 6=Saturday
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  paidUntil: string | null;
  trialDaysLeft: number;
  paymentPendingSince: string | null;
};

export type BookingStatus = "pending" | "booked" | "cancelled";

export type Booking = {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM start time
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  employeeId: string;
  employeeName: string;
  status: BookingStatus;
};

export type WaitlistStatus = "waiting" | "notified" | "confirmed";

export type WaitlistEntry = {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  status: WaitlistStatus;
  createdAt: number;
  notifiedTime?: string; // slot offered once status becomes "notified"
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function trimTime(t: string): string {
  return t.slice(0, 5);
}

function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    date: row.date as string,
    time: trimTime(row.time as string),
    serviceId: row.service_id as string,
    serviceName: row.service_name as string,
    durationMinutes: row.duration_minutes as number,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    note: (row.note as string | null) ?? undefined,
    employeeId: row.employee_id as string,
    employeeName: row.employee_name as string,
    status: row.status as BookingStatus,
  };
}

function mapWaitlist(row: Record<string, unknown>): WaitlistEntry {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    date: row.date as string,
    serviceId: row.service_id as string,
    serviceName: row.service_name as string,
    durationMinutes: row.duration_minutes as number,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    note: (row.note as string | null) ?? undefined,
    status: row.status as WaitlistStatus,
    createdAt: new Date(row.created_at as string).getTime(),
    notifiedTime: row.notified_time ? trimTime(row.notified_time as string) : undefined,
  };
}

function computeSubscriptionFields(business: Record<string, unknown>) {
  const trialEndsAt = business.trial_ends_at as string;
  const paidUntil = (business.paid_until as string | null) ?? null;
  const now = Date.now();

  const paidActive = paidUntil !== null && new Date(paidUntil).getTime() > now;
  const trialActive = new Date(trialEndsAt).getTime() > now;

  const subscriptionStatus: SubscriptionStatus = paidActive ? "active" : trialActive ? "trial" : "expired";
  const trialDaysLeft = trialActive ? Math.ceil((new Date(trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)) : 0;

  return {
    subscriptionStatus,
    trialEndsAt,
    paidUntil,
    trialDaysLeft,
    paymentPendingSince: (business.payment_pending_since as string | null) ?? null,
  };
}

export function isBusinessLocked(business: Record<string, unknown>): boolean {
  return computeSubscriptionFields(business).subscriptionStatus === "expired";
}

function mapBusinessConfig(business: Record<string, unknown>, services: Service[], employees: Employee[]): BusinessConfig {
  return {
    id: business.id as string,
    slug: business.slug as string,
    name: business.name as string,
    startHour: business.start_hour as number,
    endHour: business.end_hour as number,
    slotGranularityMinutes: business.slot_granularity_minutes as number,
    offDays: business.off_days as number[],
    services,
    employees,
    ...computeSubscriptionFields(business),
  };
}

async function getBusinessRowById(businessId: string) {
  const { data, error } = await supabase.from("business").select("*").eq("id", businessId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function getBusinessRowBySlug(slug: string) {
  const { data, error } = await supabase.from("business").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function servicesAndEmployeesFor(businessId: string) {
  const [{ data: services }, { data: employees }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", businessId),
    supabase.from("employees").select("*").eq("business_id", businessId),
  ]);
  return {
    services: (services ?? []).map((s) => ({ id: s.id, name: s.name, durationMinutes: s.duration_minutes })),
    employees: (employees ?? []).map((e) => ({ id: e.id, name: e.name })),
  };
}

export async function getBusinessConfig(businessId: string): Promise<BusinessConfig | undefined> {
  const business = await getBusinessRowById(businessId);
  if (!business) return undefined;
  const { services, employees } = await servicesAndEmployeesFor(business.id);
  return mapBusinessConfig(business, services, employees);
}

export async function getBusinessConfigBySlug(slug: string): Promise<BusinessConfig | undefined> {
  const business = await getBusinessRowBySlug(slug);
  if (!business) return undefined;
  const { services, employees } = await servicesAndEmployeesFor(business.id);
  return mapBusinessConfig(business, services, employees);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const business = await getBusinessRowBySlug(slug);
  return !!business;
}

// New signups get no working password — they land in a "pending" state
// (password_hash null) until the platform admin activates them from /admin
// once payment is confirmed. trial_ends_at is set to "now" (no free trial).
export async function createBusiness(
  name: string,
  slug: string,
  ownerEmail: string,
  ownerPhone: string
): Promise<{ success: true; businessId: string } | { success: false; error: string }> {
  if (await isSlugTaken(slug)) {
    return { success: false, error: "slug_taken" };
  }
  const { data, error } = await supabase
    .from("business")
    .insert({
      name,
      slug,
      owner_email: ownerEmail.toLowerCase(),
      owner_phone: ownerPhone,
      password_hash: null,
      trial_ends_at: new Date().toISOString(),
      start_hour: 9,
      end_hour: 18,
      slot_granularity_minutes: 15,
      off_days: [],
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return { success: false, error: "email_taken" };
    throw new Error(error.message);
  }
  return { success: true, businessId: data.id };
}

export async function verifyOwnerLogin(
  email: string,
  password: string
): Promise<{ success: true; businessId: string } | { success: false }> {
  const { data } = await supabase.from("business").select("*").eq("owner_email", email.toLowerCase()).maybeSingle();
  if (!data || !data.password_hash || !verifyPassword(password, data.password_hash)) {
    return { success: false };
  }
  return { success: true, businessId: data.id };
}

const ACTIVATION_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateActivationPassword(): string {
  const bytes = randomBytes(12);
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += ACTIVATION_PASSWORD_CHARS[bytes[i] % ACTIVATION_PASSWORD_CHARS.length];
  }
  return result;
}

/**
 * Called from /admin once payment is confirmed. Generates a fresh password,
 * stores only its hash, and returns the plaintext once so it can be copied
 * and sent to the owner manually — it is never stored or retrievable again.
 */
export async function activateBusiness(businessId: string, extendByDays = 30): Promise<{ password: string }> {
  const password = generateActivationPassword();
  const newPaidUntil = new Date(Date.now() + extendByDays * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("business")
    .update({
      password_hash: hashPassword(password),
      paid_until: newPaidUntil.toISOString(),
      payment_pending_since: null,
    })
    .eq("id", businessId);
  if (error) throw new Error(error.message);

  return { password };
}

/**
 * Self-service password change from the dashboard — requires knowing the
 * current password. Returns an error rather than throwing so the route can
 * show a friendly message instead of a 500.
 */
export async function changeOwnPassword(
  businessId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { data } = await supabase.from("business").select("password_hash").eq("id", businessId).maybeSingle();
  if (!data?.password_hash || !verifyPassword(currentPassword, data.password_hash)) {
    return { success: false, error: "incorrect_password" };
  }
  const { error } = await supabase
    .from("business")
    .update({ password_hash: hashPassword(newPassword) })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin-mediated "forgot password" — mirrors activateBusiness's one-time
 * password generation, but only touches the password (billing/trial dates
 * are left untouched). The plaintext is returned once so the admin can copy
 * it and send it to the owner manually.
 */
export async function resetBusinessPassword(businessId: string): Promise<{ password: string }> {
  const password = generateActivationPassword();
  const { error } = await supabase
    .from("business")
    .update({ password_hash: hashPassword(password) })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
  return { password };
}

export async function updateBusinessConfig(
  businessId: string,
  updates: Partial<Pick<BusinessConfig, "name" | "startHour" | "endHour" | "offDays">>
): Promise<BusinessConfig | undefined> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.startHour !== undefined) dbUpdates.start_hour = updates.startHour;
  if (updates.endHour !== undefined) dbUpdates.end_hour = updates.endHour;
  if (updates.offDays !== undefined) dbUpdates.off_days = updates.offDays;

  const { error } = await supabase.from("business").update(dbUpdates).eq("id", businessId);
  if (error) throw new Error(error.message);
  return getBusinessConfig(businessId);
}

export async function addService(businessId: string, name: string, durationMinutes: number): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({ business_id: businessId, name, duration_minutes: durationMinutes })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, durationMinutes: data.duration_minutes };
}

export async function removeService(serviceId: string, businessId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from("services").delete().eq("id", serviceId).eq("business_id", businessId);
  return { success: !error };
}

export async function addEmployee(businessId: string, name: string): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .insert({ business_id: businessId, name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name };
}

export async function removeEmployee(employeeId: string, businessId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from("employees").delete().eq("id", employeeId).eq("business_id", businessId);
  return { success: !error };
}

export function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function isDayClosed(businessId: string, date: string): Promise<boolean> {
  const business = await getBusinessRowById(businessId);
  if (!business) return true;
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  return (business.off_days as number[]).includes(dayOfWeek);
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

function isEmployeeRangeFreeLocal(
  bookingsThatDay: Booking[],
  employeeId: string,
  startMinutes: number,
  durationMinutes: number,
  ignoreBookingId?: string
): boolean {
  const endMinutes = startMinutes + durationMinutes;
  return !bookingsThatDay.some((b) => {
    if (b.employeeId !== employeeId || b.id === ignoreBookingId) return false;
    const bStart = timeToMinutes(b.time);
    const bEnd = bStart + b.durationMinutes;
    return rangesOverlap(startMinutes, endMinutes, bStart, bEnd);
  });
}

async function getBookedBookingsForDate(businessId: string, date: string): Promise<Booking[]> {
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("business_id", businessId)
    .eq("date", date)
    .in("status", ["pending", "booked"]);
  return (data ?? []).map(mapBooking);
}

export type SlotInfo = { time: string; available: boolean };

export async function getSlotsForDay(businessId: string, date: string, serviceId: string): Promise<SlotInfo[]> {
  const business = await getBusinessRowById(businessId);
  if (!business) return [];
  const service = await getServiceForBusiness(serviceId, businessId);
  if (!service) return [];
  const [y, m, d] = date.split("-").map(Number);
  const closed = (business.off_days as number[]).includes(new Date(y, m - 1, d).getDay());
  if (closed) return [];

  const { data: employees } = await supabase.from("employees").select("*").eq("business_id", business.id);
  const bookingsThatDay = await getBookedBookingsForDate(business.id, date);

  const startHour = business.start_hour as number;
  const endHour = business.end_hour as number;
  const slotGranularityMinutes = business.slot_granularity_minutes as number;
  const closeMinutes = endHour * 60;

  const today = formatDateISO(new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const slots: SlotInfo[] = [];
  for (let start = startHour * 60; start + service.durationMinutes <= closeMinutes; start += slotGranularityMinutes) {
    if (date === today && start <= nowMinutes) continue;
    const available = (employees ?? []).some((emp) =>
      isEmployeeRangeFreeLocal(bookingsThatDay, emp.id, start, service.durationMinutes)
    );
    slots.push({ time: minutesToTime(start), available });
  }
  return slots;
}

export async function isDayFullyBooked(businessId: string, date: string, serviceId: string): Promise<boolean> {
  const slots = await getSlotsForDay(businessId, date, serviceId);
  return slots.length > 0 && slots.every((s) => !s.available);
}

type BookingResult =
  | { success: true; booking: Booking }
  | { success: false; error: "slot_taken" | "unknown_service" | "business_locked" };

const EXCLUSION_VIOLATION = "23P01";

async function getServiceForBusiness(serviceId: string, businessId: string): Promise<Service | undefined> {
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();
  return data ? { id: data.id, name: data.name, durationMinutes: data.duration_minutes } : undefined;
}

export async function createBooking(
  businessId: string,
  date: string,
  time: string,
  serviceId: string,
  customerName: string,
  customerPhone: string,
  note?: string,
  initialStatus: "pending" | "booked" = "pending"
): Promise<BookingResult> {
  const business = await getBusinessRowById(businessId);
  if (!business || isBusinessLocked(business)) {
    return { success: false, error: "business_locked" };
  }

  const service = await getServiceForBusiness(serviceId, businessId);
  if (!service) {
    return { success: false, error: "unknown_service" };
  }

  const { data: employees } = await supabase.from("employees").select("*").eq("business_id", businessId);

  // Try each employee in turn — the database's exclusion constraint is the
  // real safety net here (it rejects an overlapping insert even if two
  // requests race each other), this loop just finds who's actually free.
  // A "pending" booking holds the slot exactly like a "booked" one — the
  // exclusion constraint covers both — it just still needs the owner to
  // accept it before it's confirmed.
  for (const emp of employees ?? []) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        business_id: businessId,
        date,
        time,
        service_id: service.id,
        service_name: service.name,
        duration_minutes: service.durationMinutes,
        customer_name: customerName,
        customer_phone: customerPhone,
        note: note || null,
        employee_id: emp.id,
        employee_name: emp.name,
        status: initialStatus,
      })
      .select()
      .single();

    if (!error) {
      const booking = mapBooking(data);
      const event = initialStatus === "pending" ? "booking_requested" : "booking_confirmed";
      notify(event, { phone: customerPhone, name: customerName, date, time, bookingId: booking.id });
      return { success: true, booking };
    }
    if (error.code !== EXCLUSION_VIOLATION) {
      throw new Error(error.message);
    }
  }

  return { success: false, error: "slot_taken" };
}

export async function joinWaitlist(
  businessId: string,
  date: string,
  serviceId: string,
  customerName: string,
  customerPhone: string,
  note?: string
): Promise<WaitlistEntry | { error: "unknown_service" | "business_locked" }> {
  const business = await getBusinessRowById(businessId);
  if (!business || isBusinessLocked(business)) {
    return { error: "business_locked" };
  }

  const service = await getServiceForBusiness(serviceId, businessId);
  if (!service) return { error: "unknown_service" };

  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      business_id: businessId,
      date,
      service_id: service.id,
      service_name: service.name,
      duration_minutes: service.durationMinutes,
      customer_name: customerName,
      customer_phone: customerPhone,
      note: note || null,
      status: "waiting",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  notify("waitlist_joined", { phone: customerPhone, name: customerName, date });
  return mapWaitlist(data);
}

export async function getAllBookings(businessId: string): Promise<Booking[]> {
  const { data } = await supabase.from("bookings").select("*").eq("business_id", businessId);
  return (data ?? []).map(mapBooking);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  return data ? mapBooking(data) : undefined;
}

export async function getAllWaitlist(businessId: string): Promise<WaitlistEntry[]> {
  const { data } = await supabase.from("waitlist").select("*").eq("business_id", businessId);
  return (data ?? []).map(mapWaitlist);
}

// Only promote someone whose service fits inside the freed time — starting
// them at the same time guarantees no overlap with anything else, since that
// whole range was occupied solely by the booking that just left it.
async function promoteNextWaitlisted(
  businessId: string,
  date: string,
  time: string,
  freedDurationMinutes: number
): Promise<WaitlistEntry | undefined> {
  const { data } = await supabase
    .from("waitlist")
    .select("*")
    .eq("business_id", businessId)
    .eq("date", date)
    .eq("status", "waiting")
    .lte("duration_minutes", freedDurationMinutes)
    .order("created_at", { ascending: true })
    .limit(1);

  const nextInLine = data?.[0] ? mapWaitlist(data[0]) : undefined;
  if (!nextInLine) return undefined;

  const { error } = await supabase
    .from("waitlist")
    .update({ status: "notified", notified_time: time })
    .eq("id", nextInLine.id);
  if (error) throw new Error(error.message);

  nextInLine.status = "notified";
  nextInLine.notifiedTime = time;
  notify("waitlist_slot_offered", {
    phone: nextInLine.customerPhone,
    name: nextInLine.customerName,
    date: nextInLine.date,
    time,
  });
  return nextInLine;
}

export async function cancelBooking(id: string): Promise<{ success: boolean; promoted?: WaitlistEntry }> {
  const booking = await getBooking(id);
  if (!booking || booking.status === "cancelled") {
    return { success: false };
  }

  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) throw new Error(error.message);

  notify("booking_cancelled", {
    phone: booking.customerPhone,
    name: booking.customerName,
    date: booking.date,
    time: booking.time,
  });

  const promoted = await promoteNextWaitlisted(booking.businessId, booking.date, booking.time, booking.durationMinutes);
  return { success: true, promoted };
}

/** Owner accepts a pending request. Only the owning business can confirm it. */
export async function confirmBooking(id: string, businessId: string): Promise<{ success: boolean }> {
  const booking = await getBooking(id);
  if (!booking || booking.businessId !== businessId || booking.status !== "pending") {
    return { success: false };
  }

  const { error } = await supabase.from("bookings").update({ status: "booked" }).eq("id", id);
  if (error) throw new Error(error.message);

  notify("booking_confirmed", {
    phone: booking.customerPhone,
    name: booking.customerName,
    date: booking.date,
    time: booking.time,
    bookingId: booking.id,
  });
  return { success: true };
}

/** Owner declines a pending request — frees the slot and offers it down the waitlist, same as a cancellation. */
export async function declineBooking(
  id: string,
  businessId: string
): Promise<{ success: boolean; promoted?: WaitlistEntry }> {
  const booking = await getBooking(id);
  if (!booking || booking.businessId !== businessId || booking.status !== "pending") {
    return { success: false };
  }

  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
  if (error) throw new Error(error.message);

  notify("booking_declined", {
    phone: booking.customerPhone,
    name: booking.customerName,
    date: booking.date,
    time: booking.time,
  });

  const promoted = await promoteNextWaitlisted(booking.businessId, booking.date, booking.time, booking.durationMinutes);
  return { success: true, promoted };
}

export async function rescheduleBooking(
  id: string,
  newDate: string,
  newTime: string
): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  const booking = await getBooking(id);
  if (!booking || booking.status === "cancelled") {
    return { success: false, error: "not_found" };
  }

  const { data: employees } = await supabase.from("employees").select("*").eq("business_id", booking.businessId);

  for (const emp of employees ?? []) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ date: newDate, time: newTime, employee_id: emp.id, employee_name: emp.name })
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      const updated = mapBooking(data);
      notify("booking_rescheduled", {
        phone: updated.customerPhone,
        name: updated.customerName,
        date: newDate,
        time: newTime,
        bookingId: updated.id,
      });

      if (booking.date !== newDate || booking.time !== newTime) {
        await promoteNextWaitlisted(booking.businessId, booking.date, booking.time, booking.durationMinutes);
      }

      return { success: true, booking: updated };
    }
    if (error.code !== EXCLUSION_VIOLATION) {
      throw new Error(error.message);
    }
  }

  return { success: false, error: "slot_taken" };
}

export async function markPaymentPending(businessId: string): Promise<void> {
  const { error } = await supabase
    .from("business")
    .update({ payment_pending_since: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
}

export type AdminBusinessSummary = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPhone: string | null;
  activated: boolean;
} & Pick<BusinessConfig, "subscriptionStatus" | "trialEndsAt" | "paidUntil" | "trialDaysLeft" | "paymentPendingSince">;

export async function listAllBusinessesForAdmin(): Promise<AdminBusinessSummary[]> {
  const { data, error } = await supabase.from("business").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((business) => ({
    id: business.id,
    name: business.name,
    slug: business.slug,
    ownerEmail: business.owner_email,
    ownerPhone: business.owner_phone ?? null,
    activated: business.password_hash !== null,
    ...computeSubscriptionFields(business),
  }));
}

export async function markBusinessPaid(businessId: string, extendByDays = 30): Promise<void> {
  const business = await getBusinessRowById(businessId);
  if (!business) throw new Error("business_not_found");

  const currentPaidUntil = business.paid_until ? new Date(business.paid_until as string) : new Date();
  const base = currentPaidUntil.getTime() > Date.now() ? currentPaidUntil : new Date();
  const newPaidUntil = new Date(base.getTime() + extendByDays * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("business")
    .update({ paid_until: newPaidUntil.toISOString(), payment_pending_since: null })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
}

/** Immediately locks a business's dashboard and booking page. Reversible — a later "Mark paid" reactivates them. */
export async function cancelSubscription(businessId: string): Promise<void> {
  const { error } = await supabase
    .from("business")
    .update({ paid_until: new Date().toISOString(), payment_pending_since: null })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
}

export async function getPlatformSettings(): Promise<{ bankTransferInstructions: string | null }> {
  const { data } = await supabase.from("platform_settings").select("*").eq("id", true).maybeSingle();
  return { bankTransferInstructions: data?.bank_transfer_instructions ?? null };
}

export async function updatePlatformSettings(bankTransferInstructions: string): Promise<void> {
  const { error } = await supabase
    .from("platform_settings")
    .update({ bank_transfer_instructions: bankTransferInstructions })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

export async function confirmWaitlistPromotion(
  waitlistId: string,
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  const { data } = await supabase.from("waitlist").select("*").eq("id", waitlistId).maybeSingle();
  const entry = data ? mapWaitlist(data) : undefined;
  if (!entry || entry.businessId !== businessId || entry.status !== "notified" || !entry.notifiedTime) {
    return { success: false, error: "not_eligible" };
  }

  const result = await createBooking(
    businessId,
    entry.date,
    entry.notifiedTime,
    entry.serviceId,
    entry.customerName,
    entry.customerPhone,
    entry.note,
    "booked"
  );
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const { error } = await supabase.from("waitlist").update({ status: "confirmed" }).eq("id", entry.id);
  if (error) throw new Error(error.message);

  notify("waitlist_confirmed", {
    phone: entry.customerPhone,
    name: entry.customerName,
    date: entry.date,
    time: entry.notifiedTime,
  });
  return { success: true };
}
