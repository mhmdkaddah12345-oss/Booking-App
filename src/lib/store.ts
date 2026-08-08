// Supabase-backed data layer. All Supabase access lives here — API routes
// only ever call these functions, never the client directly.
//
// Everything is scoped to a business_id (multi-tenant): owner-only actions
// take the businessId resolved from the caller's session; customer-facing
// actions resolve the business from its public slug instead.

import { randomBytes } from "crypto";
import { supabase } from "./supabaseClient";
import { notify } from "./notifications";
import { notifyOwnerPush } from "./pushNotify";
import { hashPassword, verifyPassword } from "./passwordHash";
import { beirutNow, beirutWeekRange } from "./time";

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceUsd: number | null;
};

export type Employee = {
  id: string;
  name: string;
};

export type GalleryPhoto = {
  id: string;
  url: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

// A one-off exception on top of the weekly off-days: startTime/endTime both
// null means the whole date is closed; both set means just that time range
// is busy and the rest of the day follows normal hours.
export type ScheduleException = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
  note: string | null;
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
  closedDates: string[]; // upcoming one-off dates fully closed via schedule_exceptions
  about: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  gallery: GalleryPhoto[];
  faqs: Faq[];
  ownerPhone: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  paidUntil: string | null;
  trialDaysLeft: number;
  paymentPendingSince: string | null;
  paymentPendingPlan: string | null;
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
    paymentPendingPlan: (business.payment_pending_plan as string | null) ?? null,
  };
}

export function isBusinessLocked(business: Record<string, unknown>): boolean {
  return computeSubscriptionFields(business).subscriptionStatus === "expired";
}

function mapBusinessConfig(
  business: Record<string, unknown>,
  services: Service[],
  employees: Employee[],
  gallery: GalleryPhoto[],
  faqs: Faq[],
  closedDates: string[]
): BusinessConfig {
  return {
    id: business.id as string,
    slug: business.slug as string,
    name: business.name as string,
    startHour: business.start_hour as number,
    endHour: business.end_hour as number,
    slotGranularityMinutes: business.slot_granularity_minutes as number,
    offDays: business.off_days as number[],
    closedDates,
    about: (business.about as string | null) ?? null,
    heroImageUrl: (business.hero_image_url as string | null) ?? null,
    logoUrl: (business.logo_url as string | null) ?? null,
    accentColor: (business.accent_color as string | null) ?? null,
    services,
    employees,
    gallery,
    faqs,
    ownerPhone: business.owner_phone as string,
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

async function businessContentFor(businessId: string) {
  const [{ data: services }, { data: employees }, { data: gallery }, { data: faqs }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", businessId),
    supabase.from("employees").select("*").eq("business_id", businessId),
    supabase.from("gallery_photos").select("*").eq("business_id", businessId).order("created_at"),
    supabase.from("faqs").select("*").eq("business_id", businessId).order("sort_order"),
  ]);
  return {
    services: (services ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.duration_minutes,
      priceUsd: s.price_usd === null || s.price_usd === undefined ? null : Number(s.price_usd),
    })),
    employees: (employees ?? []).map((e) => ({ id: e.id, name: e.name })),
    gallery: (gallery ?? []).map((g) => ({ id: g.id, url: g.url })),
    faqs: (faqs ?? []).map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
  };
}

export async function getBusinessConfig(businessId: string): Promise<BusinessConfig | undefined> {
  const business = await getBusinessRowById(businessId);
  if (!business) return undefined;
  const { services, employees, gallery, faqs } = await businessContentFor(business.id);
  const closedDates = await getUpcomingClosedDates(business.id);
  return mapBusinessConfig(business, services, employees, gallery, faqs, closedDates);
}

export async function getBusinessConfigBySlug(slug: string): Promise<BusinessConfig | undefined> {
  const business = await getBusinessRowBySlug(slug);
  if (!business) return undefined;
  const { services, employees, gallery, faqs } = await businessContentFor(business.id);
  const closedDates = await getUpcomingClosedDates(business.id);
  return mapBusinessConfig(business, services, employees, gallery, faqs, closedDates);
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

const RESET_CODE_VALID_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Admin-mediated "forgot password" without the admin ever seeing (or
 * choosing) the owner's new password. Generates a one-time recovery code —
 * admin copies it and sends it to the owner manually, same relay step as
 * the original activation password — but the owner uses it themselves via
 * resetPasswordWithCode to set their own new password.
 */
export async function generateRecoveryCode(businessId: string): Promise<{ code: string }> {
  const code = generateActivationPassword();
  const expiresAt = new Date(Date.now() + RESET_CODE_VALID_MS);
  const { error } = await supabase
    .from("business")
    .update({ reset_code_hash: hashPassword(code), reset_code_expires_at: expiresAt.toISOString() })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
  return { code };
}

/**
 * Owner-initiated recovery: verifies the admin-issued code (by email) and
 * lets the owner set a brand-new password of their own choosing. The code
 * is single-use — cleared immediately after a successful reset.
 */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const { data } = await supabase
    .from("business")
    .select("id, reset_code_hash, reset_code_expires_at")
    .eq("owner_email", email.toLowerCase())
    .maybeSingle();

  if (!data?.reset_code_hash || !verifyPassword(code, data.reset_code_hash)) {
    return { success: false, error: "invalid_code" };
  }
  if (!data.reset_code_expires_at || new Date(data.reset_code_expires_at).getTime() < Date.now()) {
    return { success: false, error: "code_expired" };
  }

  const { error } = await supabase
    .from("business")
    .update({ password_hash: hashPassword(newPassword), reset_code_hash: null, reset_code_expires_at: null })
    .eq("id", data.id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateBusinessConfig(
  businessId: string,
  updates: Partial<Pick<BusinessConfig, "name" | "startHour" | "endHour" | "offDays" | "about" | "accentColor" | "ownerPhone">>
): Promise<BusinessConfig | undefined> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.startHour !== undefined) dbUpdates.start_hour = updates.startHour;
  if (updates.endHour !== undefined) dbUpdates.end_hour = updates.endHour;
  if (updates.offDays !== undefined) dbUpdates.off_days = updates.offDays;
  if (updates.about !== undefined) dbUpdates.about = updates.about;
  if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
  if (updates.ownerPhone !== undefined) dbUpdates.owner_phone = updates.ownerPhone;

  const { error } = await supabase.from("business").update(dbUpdates).eq("id", businessId);
  if (error) throw new Error(error.message);
  return getBusinessConfig(businessId);
}

const MEDIA_BUCKET = "business-media";

/**
 * Shared upload for both the hero photo and gallery photos — validated at
 * the API route (size/type), stored under the business's own folder so
 * cleanup and per-tenant isolation are trivial.
 */
export async function uploadBusinessImage(
  businessId: string,
  kind: "hero" | "gallery" | "logo",
  file: Blob,
  extension: string
): Promise<{ url: string; path: string }> {
  const path = `${businessId}/${kind}/${randomBytes(16).toString("hex")}.${extension}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function deleteBusinessImage(path: string): Promise<void> {
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}

export async function setHeroImage(businessId: string, url: string, path: string): Promise<void> {
  const { data: current } = await supabase
    .from("business")
    .select("hero_image_path")
    .eq("id", businessId)
    .maybeSingle();
  const { error } = await supabase
    .from("business")
    .update({ hero_image_url: url, hero_image_path: path })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
  if (current?.hero_image_path) await deleteBusinessImage(current.hero_image_path);
}

export async function setLogoImage(businessId: string, url: string, path: string): Promise<void> {
  const { data: current } = await supabase.from("business").select("logo_path").eq("id", businessId).maybeSingle();
  const { error } = await supabase.from("business").update({ logo_url: url, logo_path: path }).eq("id", businessId);
  if (error) throw new Error(error.message);
  if (current?.logo_path) await deleteBusinessImage(current.logo_path);
}

export async function removeLogoImage(businessId: string): Promise<void> {
  const { data: current } = await supabase.from("business").select("logo_path").eq("id", businessId).maybeSingle();
  const { error } = await supabase.from("business").update({ logo_url: null, logo_path: null }).eq("id", businessId);
  if (error) throw new Error(error.message);
  if (current?.logo_path) await deleteBusinessImage(current.logo_path);
}

export async function addGalleryPhoto(businessId: string, url: string, path: string): Promise<GalleryPhoto> {
  const { data, error } = await supabase
    .from("gallery_photos")
    .insert({ business_id: businessId, url, storage_path: path })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, url: data.url };
}

export async function removeGalleryPhoto(photoId: string, businessId: string): Promise<{ success: boolean }> {
  const { data } = await supabase
    .from("gallery_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("business_id", businessId)
    .maybeSingle();
  const { error } = await supabase.from("gallery_photos").delete().eq("id", photoId).eq("business_id", businessId);
  if (error) return { success: false };
  if (data?.storage_path) await deleteBusinessImage(data.storage_path);
  return { success: true };
}

export async function addFaq(businessId: string, question: string, answer: string): Promise<Faq> {
  const { data, error } = await supabase
    .from("faqs")
    .insert({ business_id: businessId, question, answer })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, question: data.question, answer: data.answer };
}

export async function removeFaq(faqId: string, businessId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from("faqs").delete().eq("id", faqId).eq("business_id", businessId);
  return { success: !error };
}

export async function addService(
  businessId: string,
  name: string,
  durationMinutes: number,
  priceUsd?: number | null
): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .insert({ business_id: businessId, name, duration_minutes: durationMinutes, price_usd: priceUsd ?? null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    name: data.name,
    durationMinutes: data.duration_minutes,
    priceUsd: data.price_usd === null || data.price_usd === undefined ? null : Number(data.price_usd),
  };
}

export async function updateService(
  serviceId: string,
  businessId: string,
  name: string,
  durationMinutes: number,
  priceUsd?: number | null
): Promise<Service | undefined> {
  const { data, error } = await supabase
    .from("services")
    .update({ name, duration_minutes: durationMinutes, price_usd: priceUsd ?? null })
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .select()
    .maybeSingle();
  if (error || !data) return undefined;
  return {
    id: data.id,
    name: data.name,
    durationMinutes: data.duration_minutes,
    priceUsd: data.price_usd === null || data.price_usd === undefined ? null : Number(data.price_usd),
  };
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

// Bookings are assigned per-employee, but a solo owner running the whole
// business themselves shouldn't be forced to add themselves as "staff"
// before they can take a single booking. If a business has no employees
// yet, transparently provision one default row (self-healing — also
// covers a business that later removes its only employee) so the
// existing per-employee availability/assignment logic just works without
// the owner ever needing to think about it.
async function getOrCreateEmployees(businessId: string): Promise<{ id: string; name: string }[]> {
  const { data: employees } = await supabase.from("employees").select("*").eq("business_id", businessId);
  if (employees && employees.length > 0) return employees;

  const { data: created, error } = await supabase
    .from("employees")
    .insert({ business_id: businessId, name: "Owner" })
    .select()
    .maybeSingle();
  if (error || !created) return [];
  return [created];
}

export async function isDayClosed(businessId: string, date: string): Promise<boolean> {
  const business = await getBusinessRowById(businessId);
  if (!business) return true;
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  if ((business.off_days as number[]).includes(dayOfWeek)) return true;
  const exceptions = await getExceptionsForDate(businessId, date);
  return exceptions.some((e) => !e.startTime && !e.endTime);
}

function mapScheduleException(row: Record<string, unknown>): ScheduleException {
  return {
    id: row.id as string,
    date: row.date as string,
    startTime: row.start_time ? trimTime(row.start_time as string) : null,
    endTime: row.end_time ? trimTime(row.end_time as string) : null,
    note: (row.note as string | null) ?? null,
  };
}

async function getExceptionsForDate(businessId: string, date: string): Promise<ScheduleException[]> {
  const { data } = await supabase
    .from("schedule_exceptions")
    .select("*")
    .eq("business_id", businessId)
    .eq("date", date);
  return (data ?? []).map(mapScheduleException);
}

/** Owner-facing list for the Settings page — upcoming exceptions only, oldest first. */
export async function getScheduleExceptions(businessId: string): Promise<ScheduleException[]> {
  const { dateStr: today } = beirutNow();
  const { data } = await supabase
    .from("schedule_exceptions")
    .select("*")
    .eq("business_id", businessId)
    .gte("date", today)
    .order("date", { ascending: true });
  return (data ?? []).map(mapScheduleException);
}

/** Public-safe subset for the booking page's calendar — just which upcoming dates are fully closed, no notes/times. */
async function getUpcomingClosedDates(businessId: string): Promise<string[]> {
  const exceptions = await getScheduleExceptions(businessId);
  return exceptions.filter((e) => !e.startTime && !e.endTime).map((e) => e.date);
}

export async function addScheduleException(
  businessId: string,
  date: string,
  startTime: string | null,
  endTime: string | null,
  note: string | null
): Promise<ScheduleException> {
  const { data, error } = await supabase
    .from("schedule_exceptions")
    .insert({ business_id: businessId, date, start_time: startTime, end_time: endTime, note })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapScheduleException(data);
}

export async function removeScheduleException(id: string, businessId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from("schedule_exceptions").delete().eq("id", id).eq("business_id", businessId);
  return { success: !error };
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

// Same idea as isEmployeeRangeFreeLocal, but for a solo business that
// hasn't (and doesn't need to) add itself as an "employee" — capacity is
// just one booking at a time, full stop, regardless of which employee_id
// old/new bookings happen to reference.
function isRangeFreeAcrossAnyBookingLocal(
  bookingsThatDay: Booking[],
  startMinutes: number,
  durationMinutes: number
): boolean {
  const endMinutes = startMinutes + durationMinutes;
  return !bookingsThatDay.some((b) => {
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

async function getSlotsForDurationCore(
  businessId: string,
  date: string,
  durationMinutes: number
): Promise<SlotInfo[]> {
  const business = await getBusinessRowById(businessId);
  if (!business) return [];
  const [y, m, d] = date.split("-").map(Number);
  const closed = (business.off_days as number[]).includes(new Date(y, m - 1, d).getDay());
  if (closed) return [];

  const exceptions = await getExceptionsForDate(businessId, date);
  if (exceptions.some((e) => !e.startTime && !e.endTime)) return [];
  const busyRanges = exceptions
    .filter((e): e is ScheduleException & { startTime: string; endTime: string } => !!e.startTime && !!e.endTime)
    .map((e) => ({ start: timeToMinutes(e.startTime), end: timeToMinutes(e.endTime) }));

  // Read-only — never auto-provisions an employee row here. Two of these
  // calls run concurrently (slots + fullyBooked, via Promise.all in the
  // API route), so writing from here caused a duplicate-insert race the
  // first time a still-staffless business got hit. A solo business (no
  // employees added) is treated as a single implicit resource instead.
  const { data: employeesRaw } = await supabase.from("employees").select("*").eq("business_id", business.id);
  const employees = employeesRaw ?? [];
  const bookingsThatDay = await getBookedBookingsForDate(business.id, date);

  const startHour = business.start_hour as number;
  const endHour = business.end_hour as number;
  const slotGranularityMinutes = business.slot_granularity_minutes as number;
  const closeMinutes = endHour * 60;

  const { dateStr: today, minutesSinceMidnight: nowMinutes } = beirutNow();

  const slots: SlotInfo[] = [];
  for (let start = startHour * 60; start + durationMinutes <= closeMinutes; start += slotGranularityMinutes) {
    if (date === today && start <= nowMinutes) continue;
    const blockedByException = busyRanges.some((r) => rangesOverlap(start, start + durationMinutes, r.start, r.end));
    const available =
      !blockedByException &&
      (employees.length > 0
        ? employees.some((emp) => isEmployeeRangeFreeLocal(bookingsThatDay, emp.id, start, durationMinutes))
        : isRangeFreeAcrossAnyBookingLocal(bookingsThatDay, start, durationMinutes));
    slots.push({ time: minutesToTime(start), available });
  }
  return slots;
}

/** Used by the reschedule flow, which already knows the booking's total duration and doesn't need to re-derive it from service ids. */
export async function getSlotsForDuration(businessId: string, date: string, durationMinutes: number): Promise<SlotInfo[]> {
  return getSlotsForDurationCore(businessId, date, durationMinutes);
}

export async function isDayFullyBookedForDuration(
  businessId: string,
  date: string,
  durationMinutes: number
): Promise<boolean> {
  const slots = await getSlotsForDurationCore(businessId, date, durationMinutes);
  return slots.length > 0 && slots.every((s) => !s.available);
}

export async function getSlotsForDay(businessId: string, date: string, serviceIds: string[]): Promise<SlotInfo[]> {
  const combined = await resolveCombinedService(serviceIds, businessId);
  if (!combined) return [];
  return getSlotsForDurationCore(businessId, date, combined.durationMinutes);
}

export async function isDayFullyBooked(businessId: string, date: string, serviceIds: string[]): Promise<boolean> {
  const combined = await resolveCombinedService(serviceIds, businessId);
  if (!combined) return false;
  return isDayFullyBookedForDuration(businessId, date, combined.durationMinutes);
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
  return data
    ? {
        id: data.id,
        name: data.name,
        durationMinutes: data.duration_minutes,
        priceUsd: data.price_usd === null || data.price_usd === undefined ? null : Number(data.price_usd),
      }
    : undefined;
}

/**
 * Lets a customer pick more than one service for a single visit (e.g.
 * Haircut + Beard Trim) — they're combined into one appointment handled
 * back-to-back by whichever employee is free for the whole block, rather
 * than modeling parallel multi-staff visits. Combined name/duration are
 * stored directly on the booking row, same denormalized-snapshot pattern
 * already used for service_name/employee_name elsewhere.
 */
async function resolveCombinedService(
  serviceIds: string[],
  businessId: string
): Promise<{ id: string; name: string; durationMinutes: number } | undefined> {
  if (serviceIds.length === 0) return undefined;
  const services = await Promise.all(serviceIds.map((id) => getServiceForBusiness(id, businessId)));
  if (services.some((s) => !s)) return undefined;
  const resolved = services as Service[];
  return {
    id: resolved[0].id,
    name: resolved.map((s) => s.name).join(" + "),
    durationMinutes: resolved.reduce((sum, s) => sum + s.durationMinutes, 0),
  };
}

export async function createBooking(
  businessId: string,
  date: string,
  time: string,
  serviceIds: string[],
  customerName: string,
  customerPhone: string,
  note?: string,
  initialStatus: "pending" | "booked" = "pending"
): Promise<BookingResult> {
  const service = await resolveCombinedService(serviceIds, businessId);
  if (!service) {
    return { success: false, error: "unknown_service" };
  }
  return insertBookingForService(businessId, date, time, service, customerName, customerPhone, note, initialStatus);
}

/**
 * Shared by createBooking (resolves serviceIds first) and
 * confirmWaitlistPromotion (already has the combined name/duration stored
 * on the waitlist entry, so it skips straight here instead of re-resolving
 * from a single leftover service id and losing the rest of the combo).
 */
async function insertBookingForService(
  businessId: string,
  date: string,
  time: string,
  service: { id: string; name: string; durationMinutes: number },
  customerName: string,
  customerPhone: string,
  note?: string,
  initialStatus: "pending" | "booked" = "pending"
): Promise<BookingResult> {
  const business = await getBusinessRowById(businessId);
  if (!business || isBusinessLocked(business)) {
    return { success: false, error: "business_locked" };
  }

  const employees = await getOrCreateEmployees(businessId);

  // Try each employee in turn — the database's exclusion constraint is the
  // real safety net here (it rejects an overlapping insert even if two
  // requests race each other), this loop just finds who's actually free.
  // A "pending" booking holds the slot exactly like a "booked" one — the
  // exclusion constraint covers both — it just still needs the owner to
  // accept it before it's confirmed.
  for (const emp of employees) {
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
      if (initialStatus === "pending") {
        // Awaited (not fire-and-forget) — on Vercel, the serverless function
        // can be frozen the instant the response is sent, which would kill
        // an in-flight, un-awaited push send and made delivery intermittent.
        try {
          await notifyOwnerPush(
            businessId,
            "New booking request",
            `${customerName} — ${date} at ${time} (${service.name})`
          );
        } catch (err) {
          console.error("[push notify error]", err);
        }
      }
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
  serviceIds: string[],
  customerName: string,
  customerPhone: string,
  note?: string
): Promise<WaitlistEntry | { error: "unknown_service" | "business_locked" }> {
  const business = await getBusinessRowById(businessId);
  if (!business || isBusinessLocked(business)) {
    return { error: "business_locked" };
  }

  const service = await resolveCombinedService(serviceIds, businessId);
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

// Compares only the last 8 digits so "+961 70 123456", "70123456", and
// "03/70123456" all match each other regardless of how a customer or the
// business happened to type the number in.
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-8);
}

/**
 * Lets a customer who lost their manage-booking link find it again by phone
 * number — scoped to a single business (by slug) so it can never leak a
 * customer's bookings at other businesses.
 */
export async function findBookingsByPhone(businessId: string, phone: string): Promise<Booking[]> {
  const normalizedInput = normalizePhone(phone);
  if (normalizedInput.length < 6) return [];

  const { dateStr: today } = beirutNow();
  const all = await getAllBookings(businessId);
  return all
    .filter((b) => b.status !== "cancelled" && b.date >= today)
    .filter((b) => normalizePhone(b.customerPhone) === normalizedInput)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  return data ? mapBooking(data) : undefined;
}

export async function getAllWaitlist(businessId: string): Promise<WaitlistEntry[]> {
  const { data } = await supabase.from("waitlist").select("*").eq("business_id", businessId);
  return (data ?? []).map(mapWaitlist);
}

export type CustomerSummary = {
  phone: string;
  name: string;
  visitCount: number;
  lastVisitDate: string; // YYYY-MM-DD
  totalSpentUsd: number | null; // null when no visit has price data to sum
};

/**
 * Aggregates every non-cancelled booking by customer phone number. Spend is
 * a best-effort total using each service's *current* price (bookings don't
 * snapshot the price at booking time) — a service that's been deleted or
 * repriced since just doesn't contribute to the total rather than throwing
 * it off, so totalSpentUsd is null only when none of a customer's bookings
 * have any priced service to go on.
 */
export async function getCustomerSummaries(businessId: string): Promise<CustomerSummary[]> {
  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select("*")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  const bookings = (bookingsRaw ?? []).map(mapBooking);

  const { data: servicesRaw } = await supabase.from("services").select("id, price_usd").eq("business_id", businessId);
  const priceById = new Map<string, number | null>(
    (servicesRaw ?? []).map((s) => [s.id, s.price_usd === null || s.price_usd === undefined ? null : Number(s.price_usd)])
  );

  const byPhone = new Map<string, { name: string; dates: string[]; spend: number; hasPrice: boolean }>();
  for (const b of bookings) {
    const entry = byPhone.get(b.customerPhone) ?? { name: b.customerName, dates: [], spend: 0, hasPrice: false };
    entry.name = b.customerName;
    entry.dates.push(b.date);
    const price = priceById.get(b.serviceId);
    if (typeof price === "number") {
      entry.spend += price;
      entry.hasPrice = true;
    }
    byPhone.set(b.customerPhone, entry);
  }

  return Array.from(byPhone.entries())
    .map(([phone, e]) => ({
      phone,
      name: e.name,
      visitCount: e.dates.length,
      lastVisitDate: e.dates[e.dates.length - 1],
      totalSpentUsd: e.hasPrice ? e.spend : null,
    }))
    .sort((a, b) => b.lastVisitDate.localeCompare(a.lastVisitDate));
}

export type DashboardStats = {
  appointmentsThisWeek: number;
  pendingCount: number;
  cancelledThisWeek: number;
  waitlistCount: number;
};

/** Cheap "at a glance" counters for the dashboard — computed with count-only queries rather than fetching full rows. */
export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const { weekStart, weekEnd } = beirutWeekRange();

  const [appointments, pending, cancelled, waitlist] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "booked")
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "pending"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "cancelled")
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase.from("waitlist").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "waiting"),
  ]);

  return {
    appointmentsThisWeek: appointments.count ?? 0,
    pendingCount: pending.count ?? 0,
    cancelledThisWeek: cancelled.count ?? 0,
    waitlistCount: waitlist.count ?? 0,
  };
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

/**
 * Customers cancel their own booking via their manage link (no login, so
 * requireBusinessId is omitted). When an owner is logged in on the same
 * request — the dashboard's Cancel button hits this same endpoint — pass
 * their businessId so a booking belonging to a different business can't be
 * touched.
 */
export async function cancelBooking(
  id: string,
  requireBusinessId?: string
): Promise<{ success: boolean; promoted?: WaitlistEntry }> {
  const booking = await getBooking(id);
  if (!booking || booking.status === "cancelled") {
    return { success: false };
  }
  if (requireBusinessId && booking.businessId !== requireBusinessId) {
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
  newTime: string,
  requireBusinessId?: string
): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  const booking = await getBooking(id);
  if (!booking || booking.status === "cancelled") {
    return { success: false, error: "not_found" };
  }
  if (requireBusinessId && booking.businessId !== requireBusinessId) {
    return { success: false, error: "not_found" };
  }

  const employees = await getOrCreateEmployees(booking.businessId);

  // A confirmed booking that actually moves to a new date/time needs the
  // owner to re-approve it, same as a fresh request — otherwise a customer
  // could shift a shift-covering appointment to a time the owner never
  // agreed to without them ever seeing it. That protection doesn't apply
  // when the owner is the one making the change (requireBusinessId is only
  // ever set by the authenticated dashboard path) — they don't need to
  // re-approve their own edit.
  const isActualChange = booking.date !== newDate || booking.time !== newTime;
  const needsReconfirmation = !requireBusinessId && booking.status === "booked" && isActualChange;

  for (const emp of employees) {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        date: newDate,
        time: newTime,
        employee_id: emp.id,
        employee_name: emp.name,
        ...(needsReconfirmation ? { status: "pending" } : {}),
      })
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

      if (isActualChange) {
        await promoteNextWaitlisted(booking.businessId, booking.date, booking.time, booking.durationMinutes);
      }

      if (needsReconfirmation) {
        try {
          await notifyOwnerPush(
            booking.businessId,
            "Reschedule request",
            `${updated.customerName} moved their appointment to ${newDate} at ${newTime} — needs your confirmation`
          );
        } catch (err) {
          console.error("[push notify error]", err);
        }
      }

      return { success: true, booking: updated };
    }
    if (error.code !== EXCLUSION_VIOLATION) {
      throw new Error(error.message);
    }
  }

  return { success: false, error: "slot_taken" };
}

export async function markPaymentPending(businessId: string, plan: string | null): Promise<void> {
  const { error } = await supabase
    .from("business")
    .update({ payment_pending_since: new Date().toISOString(), payment_pending_plan: plan })
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
} & Pick<
  BusinessConfig,
  "subscriptionStatus" | "trialEndsAt" | "paidUntil" | "trialDaysLeft" | "paymentPendingSince" | "paymentPendingPlan"
>;

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
    .update({ paid_until: newPaidUntil.toISOString(), payment_pending_since: null, payment_pending_plan: null })
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

export async function getPlatformSettings(): Promise<{ paymentInstructions: string | null }> {
  const { data } = await supabase.from("platform_settings").select("*").eq("id", true).maybeSingle();
  return { paymentInstructions: data?.payment_instructions ?? null };
}

export async function updatePlatformSettings(paymentInstructions: string): Promise<void> {
  const { error } = await supabase
    .from("platform_settings")
    .update({ payment_instructions: paymentInstructions })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

export type ContactMessage = { id: string; name: string; email: string; message: string; createdAt: string };

export async function createContactMessage(name: string, email: string, message: string): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert({ name, email, message });
  if (error) throw new Error(error.message);
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
  }));
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

  const result = await insertBookingForService(
    businessId,
    entry.date,
    entry.notifiedTime,
    { id: entry.serviceId, name: entry.serviceName, durationMinutes: entry.durationMinutes },
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
