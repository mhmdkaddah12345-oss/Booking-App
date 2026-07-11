// Stub notification service. Swap the body of `notify()` for a real
// WhatsApp Cloud API call later — nothing else in the app needs to change.

export type NotificationEvent =
  | "booking_confirmed"
  | "booking_cancelled"
  | "waitlist_joined"
  | "waitlist_slot_offered"
  | "waitlist_confirmed";

export type LoggedMessage = {
  id: string;
  timestamp: string;
  to: string;
  event: NotificationEvent;
  text: string;
};

type GlobalWithLog = typeof globalThis & { __messageLog?: LoggedMessage[] };
const g = globalThis as GlobalWithLog;
const messageLog: LoggedMessage[] = g.__messageLog ?? (g.__messageLog = []);

function buildMessage(event: NotificationEvent, data: Record<string, string>): string {
  switch (event) {
    case "booking_confirmed":
      return `Hi ${data.name}, your appointment on ${data.date} at ${data.time} is confirmed.`;
    case "booking_cancelled":
      return `Hi ${data.name}, your appointment on ${data.date} at ${data.time} has been cancelled.`;
    case "waitlist_joined":
      return `Hi ${data.name}, you've been added to the waitlist for ${data.date}. We'll message you if a slot opens.`;
    case "waitlist_slot_offered":
      return `Hi ${data.name}, a slot opened up on ${data.date} at ${data.time}! Reply to claim it before someone else does.`;
    case "waitlist_confirmed":
      return `Hi ${data.name}, you're confirmed for ${data.date} at ${data.time}.`;
  }
}

export function notify(
  event: NotificationEvent,
  data: { phone: string; name: string; date: string; time?: string }
) {
  const message: LoggedMessage = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    to: data.phone,
    event,
    text: buildMessage(event, { name: data.name, date: data.date, time: data.time ?? "" }),
  };
  messageLog.unshift(message);
  console.log(`[NOTIFY -> ${data.phone}] ${message.text}`);
}

export function getMessageLog(): LoggedMessage[] {
  return messageLog;
}
