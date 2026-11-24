// Practice #12 — input validation layer (AC1, AC2, AC6).
// Pure functions: no React, no booking data. Turns raw form strings into a validated request
// or a reason code + readable message. Raw user input is never echoed back into messages.
import { DAY_MINUTES, MAX_DURATION, parseMinutes, toHHMM } from './availability';

export type ReasonCode = 'OK' | 'OVERLAP' | 'BLOCKED' | 'INVALID_DURATION' | 'PAST_START' | 'INVALID_INPUT';

export type RawRequest = { startTime: string; duration: string };

export type ValidRequest = { ok: true; start: number; end: number; duration: number };
export type InvalidRequest = { ok: false; reason: ReasonCode; message: string };

/** "HH:MM" (24h, 00:00–23:59) → minutes after midnight, otherwise NaN. */
export function parseClock(input: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(input.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

export function validateRequest(raw: RawRequest, now: number): ValidRequest | InvalidRequest {
  const start = parseClock(raw.startTime);
  if (Number.isNaN(start)) {
    return { ok: false, reason: 'INVALID_INPUT', message: 'Enter a start time in 24-hour HH:MM format, e.g. 11:30.' };
  }
  const duration = parseMinutes(raw.duration.trim());
  if (Number.isNaN(duration) || duration < 1 || duration > MAX_DURATION) {
    return {
      ok: false,
      reason: 'INVALID_DURATION',
      message: `Duration must be a whole number of minutes from 1 to ${MAX_DURATION}.`,
    };
  }
  const end = start + duration;
  if (end > DAY_MINUTES) {
    return { ok: false, reason: 'INVALID_INPUT', message: 'The booking must end by 24:00 on the same day.' };
  }
  if (start <= now) {
    return {
      ok: false,
      reason: 'PAST_START',
      message: `Start time ${toHHMM(start)} is not in the future (current time is ${toHHMM(now)}).`,
    };
  }
  return { ok: true, start, end, duration };
}
