// Practice #12 — the common contract: validation → availability → decision.
// Availability is still decided by the unchanged Practice #10 rule engine canBook() (Task 1:
// "do not modify the booking rules"); this module only maps its result to the shared reason codes.
import { type Booking, canBook, toHHMM } from './availability';
import { type RawRequest, type ReasonCode, validateRequest } from './validation';

export type Decision = {
  available: boolean;
  reason: ReasonCode;
  message: string;
  start?: number;
  end?: number;
};

export function checkRoom(
  raw: RawRequest,
  ctx: { now: number; blocked: boolean; bookings: readonly Booking[] },
): Decision {
  const v = validateRequest(raw, ctx.now);
  if (!v.ok) return { available: false, reason: v.reason, message: v.message };

  const r = canBook(v.start, v.end, ctx.now, ctx.blocked, ctx.bookings);
  const span = `${toHHMM(v.start)}–${toHHMM(v.end)}`;
  if (r.available) {
    return { available: true, reason: 'OK', message: `Room 304 is free from ${span} (${v.duration} min).`, ...v };
  }
  switch (r.rule) {
    case 'AC3':
      return { available: false, reason: 'BLOCKED', message: 'Room 304 is blocked — no requests can be accepted.', ...v };
    case 'AC4':
      return { available: false, reason: 'OVERLAP', message: `${span} ${r.message.charAt(0).toLowerCase()}${r.message.slice(1)}`, ...v };
    case 'AC2':
      return { available: false, reason: 'INVALID_DURATION', message: r.message, ...v };
    default:
      // Unreachable after validateRequest(); kept so a future rule change fails closed, not open.
      return { available: false, reason: 'INVALID_INPUT', message: r.message, ...v };
  }
}
