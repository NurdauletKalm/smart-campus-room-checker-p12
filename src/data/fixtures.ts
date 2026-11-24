// Fictional, read-only data shared with the low-code build via shared/contract.json.
import contract from '../../shared/contract.json';
import type { Booking } from '../lib/availability';
import { parseClock } from '../lib/validation';

export const ROOM_NAME = contract.room;
export const NOW = parseClock(contract.now);

export const BOOKINGS: readonly Booking[] = Object.freeze(
  contract.bookings.map((b) => Object.freeze({ start: parseClock(b.start), end: parseClock(b.end), label: b.label })),
);

export const TEST_CASES = contract.tests;
