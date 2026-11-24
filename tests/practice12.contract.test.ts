// Practice #12 Task 5: identical tests T1–T8, driven by shared/contract.json (the same table is
// used by hand in the Appsmith build).
import { describe, expect, it } from 'vitest';
import contract from '../shared/contract.json';
import { checkRoom } from '../src/lib/checker';
import { parseClock, validateRequest } from '../src/lib/validation';
import { BOOKINGS, NOW } from '../src/data/fixtures';

const runCases = contract.tests.filter((t) => t.id !== 'T8');

describe('Practice #12 shared contract T1–T7', () => {
  it.each(runCases.map((t) => [t.id, t] as const))('%s', (_id, t) => {
    const d = checkRoom({ startTime: t.start!, duration: t.duration! }, { now: NOW, blocked: t.blocked!, bookings: BOOKINGS });
    expect({ available: d.available, reason: d.reason }).toEqual(t.expect);
    expect(d.message.length).toBeGreaterThan(0);
  });
});

describe('T8 — booking data unchanged after checks', () => {
  it('BOOKINGS deep-equals its snapshot after running T1–T7 and is frozen', () => {
    const snapshot = structuredClone(BOOKINGS);
    for (const t of runCases) {
      checkRoom({ startTime: t.start!, duration: t.duration! }, { now: NOW, blocked: t.blocked!, bookings: BOOKINGS });
    }
    expect(BOOKINGS).toEqual(snapshot);
    expect(Object.isFrozen(BOOKINGS)).toBe(true);
    expect(Object.isFrozen(BOOKINGS[0])).toBe(true);
  });
});

describe('validation edge cases (AC6)', () => {
  it.each([
    ['', '60', 'INVALID_INPUT'],
    ['25:00', '60', 'INVALID_INPUT'],
    ['11:30', '', 'INVALID_DURATION'],
    ['11:30', '1.5', 'INVALID_DURATION'],
    ['11:30', '-5', 'INVALID_DURATION'],
    ['23:30', '60', 'INVALID_INPUT'],
    ['09:00', '30', 'PAST_START'],
    ['<script>', '60', 'INVALID_INPUT'],
  ])('start=%j duration=%j → %s', (startTime, duration, reason) => {
    const v = validateRequest({ startTime, duration }, NOW);
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.reason).toBe(reason);
      expect(v.message).not.toContain('<');
    }
  });

  it('boundaries: 1 and 120 minutes are valid, 22:00 + 120 ends exactly 24:00', () => {
    expect(validateRequest({ startTime: '11:30', duration: '1' }, NOW).ok).toBe(true);
    expect(validateRequest({ startTime: '11:30', duration: '120' }, NOW).ok).toBe(true);
    expect(validateRequest({ startTime: '22:00', duration: '120' }, NOW).ok).toBe(true);
  });

  it('parseClock accepts only HH:MM', () => {
    expect(parseClock('09:00')).toBe(540);
    expect(parseClock('9:00')).toBeNaN();
    expect(parseClock('11:30:00')).toBeNaN();
  });

  it('blocked room with invalid duration reports the validation error first', () => {
    expect(checkRoom({ startTime: '11:30', duration: '0' }, { now: NOW, blocked: true, bookings: BOOKINGS }).reason).toBe(
      'INVALID_DURATION',
    );
  });
});
