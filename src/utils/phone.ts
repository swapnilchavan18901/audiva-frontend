export const PHONE_CALL_STATUSES = [
  "dialing",
  "unknown",
  "queued",
  "ringing",
  "in-progress",
  "completed",
  "failed",
  "busy",
  "no-answer",
  "cancelled",
] as const;

export type PhoneCallStatus = (typeof PHONE_CALL_STATUSES)[number];

export function normalizePhoneNumber(value: string): string {
  return value.replace(/[\s().-]/g, "");
}

export function isValidPhoneNumber(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhoneNumber(value));
}
