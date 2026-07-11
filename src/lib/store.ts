// Supabase-backed data layer. All Supabase access lives here — API routes
// only ever call these functions, never the client directly.

import { supabase } from "./supabaseClient";
import { notify } from "./notifications";

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

export type Employee = {
  id: string;
  name: string;
};

export type BusinessConfig = {
  name: string;
  startHour: number; // 24h, e.g. 9 = 9:00
  endHour: number; // 24h, e.g. 18 = 18:00
  slotGranularityMinutes: number; // interval between candidate start times
  services: Service[];
  employees: Employee[];
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
  note?: string;
  employeeId: string;
  employeeName: string;
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

async function getBusinessRow() {
  const { data, error } = await supabase.from("business").select("*").limit(1).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getBusinessConfig(): Promise<BusinessConfig> {
  const business = await getBusinessRow();
  const [{ data: services }, { data: employees }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", business.id),
    supabase.from("employees").select("*").eq("business_id", business.id),
  ]);

  return {
    name: business.name,
    startHour: business.start_hour,
    endHour: business.end_hour,
    slotGranularityMinutes: business.slot_granularity_minutes,
    offDays: business.off_days,
    services: (services ?? []).map((s) => ({ id: s.id, name: s.name, durationMinutes: s.duration_minutes })),
    employees: (employees ?? []).map((e) => ({ id: e.id, name: e.name })),
  };
}

export async function getService(serviceId: string): Promise<Service | undefined> {
  const { data } = await supabase.from("services").select("*").eq("id", serviceId).maybeSingle();
  return data ? { id: data.id, name: data.name, durationMinutes: data.duration_minutes } : undefined;
}

export async function updateBusinessConfig(
  updates: Partial<Pick<BusinessConfig, "name" | "startHour" | "endHour" | "offDays">>
): Promise<BusinessConfig> {
  const business = await getBusinessRow();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.startHour !== undefined) dbUpdates.start_hour = updates.startHour;
  if (updates.endHour !== undefined) dbUpdates.end_hour = updates.endHour;
  if (updates.offDays !== undefined) dbUpdates.off_days = updates.offDays;

  const { error } = await supabase.from("business").update(dbUpdates).eq("id", business.id);
  if (error) throw new Error(error.message);
  return getBusinessConfig();
}

export async function addService(name: string, durationMinutes: number): Promise<Service> {
  const business = await getBusinessRow();
  const { data, error } = await supabase
    .from("services")
    .insert({ business_id: business.id, name, duration_minutes: durationMinutes })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, durationMinutes: data.duration_minutes };
}

export async function removeService(serviceId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  return { success: !error };
}

export async function getEmployee(employeeId: string): Promise<Employee | undefined> {
  const { data } = await supabase.from("employees").select("*").eq("id", employeeId).maybeSingle();
  return data ? { id: data.id, name: data.name } : undefined;
}

export async function addEmployee(name: string): Promise<Employee> {
  const business = await getBusinessRow();
  const { data, error } = await supabase
    .from("employees")
    .insert({ business_id: business.id, name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name };
}

export async function removeEmployee(employeeId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from("employees").delete().eq("id", employeeId);
  return { success: !error };
}

export function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function isDayClosed(date: string): Promise<boolean> {
  const business = await getBusinessRow();
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
    .eq("status", "booked");
  return (data ?? []).map(mapBooking);
}

export type SlotInfo = { time: string; available: boolean };

export async function getSlotsForDay(date: string, serviceId: string): Promise<SlotInfo[]> {
  const business = await getBusinessRow();
  const service = await getService(serviceId);
  const [y, m, d] = date.split("-").map(Number);
  const closed = (business.off_days as number[]).includes(new Date(y, m - 1, d).getDay());
  if (!service || closed) return [];

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

export async function isDayFullyBooked(date: string, serviceId: string): Promise<boolean> {
  const slots = await getSlotsForDay(date, serviceId);
  return slots.length > 0 && slots.every((s) => !s.available);
}

type BookingResult =
  | { success: true; booking: Booking }
  | { success: false; error: "slot_taken" | "unknown_service" };

const EXCLUSION_VIOLATION = "23P01";

export async function createBooking(
  date: string,
  time: string,
  serviceId: string,
  customerName: string,
  customerPhone: string,
  note?: string
): Promise<BookingResult> {
  const service = await getService(serviceId);
  if (!service) {
    return { success: false, error: "unknown_service" };
  }

  const business = await getBusinessRow();
  const { data: employees } = await supabase.from("employees").select("*").eq("business_id", business.id);

  // Try each employee in turn — the database's exclusion constraint is the
  // real safety net here (it rejects an overlapping insert even if two
  // requests race each other), this loop just finds who's actually free.
  for (const emp of employees ?? []) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        business_id: business.id,
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
        status: "booked",
      })
      .select()
      .single();

    if (!error) {
      const booking = mapBooking(data);
      notify("booking_confirmed", { phone: customerPhone, name: customerName, date, time, bookingId: booking.id });
      return { success: true, booking };
    }
    if (error.code !== EXCLUSION_VIOLATION) {
      throw new Error(error.message);
    }
  }

  return { success: false, error: "slot_taken" };
}

export async function joinWaitlist(
  date: string,
  serviceId: string,
  customerName: string,
  customerPhone: string,
  note?: string
): Promise<WaitlistEntry | { error: "unknown_service" }> {
  const service = await getService(serviceId);
  if (!service) return { error: "unknown_service" };

  const business = await getBusinessRow();
  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      business_id: business.id,
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

export async function getAllBookings(): Promise<Booking[]> {
  const business = await getBusinessRow();
  const { data } = await supabase.from("bookings").select("*").eq("business_id", business.id);
  return (data ?? []).map(mapBooking);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  return data ? mapBooking(data) : undefined;
}

export async function getAllWaitlist(): Promise<WaitlistEntry[]> {
  const business = await getBusinessRow();
  const { data } = await supabase.from("waitlist").select("*").eq("business_id", business.id);
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
  if (!booking || booking.status !== "booked") {
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

  const business = await getBusinessRow();
  const promoted = await promoteNextWaitlisted(business.id, booking.date, booking.time, booking.durationMinutes);
  return { success: true, promoted };
}

export async function rescheduleBooking(
  id: string,
  newDate: string,
  newTime: string
): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  const booking = await getBooking(id);
  if (!booking || booking.status !== "booked") {
    return { success: false, error: "not_found" };
  }

  const business = await getBusinessRow();
  const { data: employees } = await supabase.from("employees").select("*").eq("business_id", business.id);

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
        await promoteNextWaitlisted(business.id, booking.date, booking.time, booking.durationMinutes);
      }

      return { success: true, booking: updated };
    }
    if (error.code !== EXCLUSION_VIOLATION) {
      throw new Error(error.message);
    }
  }

  return { success: false, error: "slot_taken" };
}

export async function confirmWaitlistPromotion(waitlistId: string): Promise<{ success: boolean; error?: string }> {
  const { data } = await supabase.from("waitlist").select("*").eq("id", waitlistId).maybeSingle();
  const entry = data ? mapWaitlist(data) : undefined;
  if (!entry || entry.status !== "notified" || !entry.notifiedTime) {
    return { success: false, error: "not_eligible" };
  }

  const result = await createBooking(
    entry.date,
    entry.notifiedTime,
    entry.serviceId,
    entry.customerName,
    entry.customerPhone,
    entry.note
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
