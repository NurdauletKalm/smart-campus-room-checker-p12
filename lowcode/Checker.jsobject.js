// Appsmith JS Object "Checker" — paste the whole export default {...} into a new JS Object.
// Same contract as shared/contract.json. Uses only Appsmith built-ins (no libraries, no APIs, no secrets).
// Widgets it reads: StartInput (Input, text), DurationInput (Input, number), BlockedSwitch (Switch).
export default {
  NOW: '09:00',
  MAX: 120,
  BOOKINGS: [
    { start: '10:00', end: '11:00', label: 'Robotics Club (fictional)' },
    { start: '13:00', end: '14:00', label: 'Study Group B (fictional)' },
  ],
  snapshot: '',
  checks: 0,
  result: { available: null, reason: '', message: 'Enter a request and press Check availability.' },

  toMin(hhmm) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm || '').trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
  },
  hhmm(min) {
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  },

  // Pure decision function: (startText, durationText, blocked) -> { available, reason, message }
  decide(startText, durationText, blocked) {
    const now = this.toMin(this.NOW);
    const start = this.toMin(startText);
    if (Number.isNaN(start)) return { available: false, reason: 'INVALID_INPUT', message: 'Enter a start time in 24-hour HH:MM format, e.g. 11:30.' };
    const d = String(durationText ?? '').trim();
    const dur = /^\d+$/.test(d) ? Number(d) : NaN;
    if (Number.isNaN(dur) || dur < 1 || dur > this.MAX) return { available: false, reason: 'INVALID_DURATION', message: 'Duration must be a whole number of minutes from 1 to 120.' };
    const end = start + dur;
    if (end > 1440) return { available: false, reason: 'INVALID_INPUT', message: 'The booking must end by 24:00 on the same day.' };
    if (start <= now) return { available: false, reason: 'PAST_START', message: 'Start time ' + this.hhmm(start) + ' is not in the future (current time is ' + this.NOW + ').' };
    if (blocked) return { available: false, reason: 'BLOCKED', message: 'Room 304 is blocked — no requests can be accepted.' };
    for (const b of this.BOOKINGS) {
      const bs = this.toMin(b.start), be = this.toMin(b.end);
      if (start < be && end > bs) return { available: false, reason: 'OVERLAP', message: this.hhmm(start) + '–' + this.hhmm(end) + ' overlaps existing booking ' + b.start + '–' + b.end + ' (' + b.label + ').' };
    }
    return { available: true, reason: 'OK', message: 'Room 304 is free from ' + this.hhmm(start) + '–' + this.hhmm(end) + ' (' + dur + ' min).' };
  },

  // Bound to the "Check availability" button onClick.
  run() {
    if (!this.snapshot) this.snapshot = JSON.stringify(this.BOOKINGS);
    this.result = this.decide(StartInput.text, DurationInput.text, BlockedSwitch.isSwitchedOn);
    this.checks += 1;
    return this.result;
  },

  // T8 indicator text (bind to a Text widget).
  snapshotStatus() {
    const same = !this.snapshot || this.snapshot === JSON.stringify(this.BOOKINGS);
    return 'Booking data ' + (same ? 'unchanged' : 'CHANGED') + ' after ' + this.checks + ' checks (T8)';
  },

  // Runs T1–T7 headlessly inside Appsmith and returns a table (bind to a Table widget). T8 = unchanged flag.
  selfTest() {
    const cases = [
      ['T1', '11:30', '60', false, true, 'OK'],
      ['T2', '10:30', '60', false, false, 'OVERLAP'],
      ['T3', '11:30', '60', true, false, 'BLOCKED'],
      ['T4', '11:30', '0', false, false, 'INVALID_DURATION'],
      ['T5', '11:30', '121', false, false, 'INVALID_DURATION'],
      ['T6', '08:00', '30', false, false, 'PAST_START'],
      ['T7', '11:00', '120', false, true, 'OK'],
    ];
    const before = JSON.stringify(this.BOOKINGS);
    const rows = cases.map(([id, s, d, bl, av, rc]) => {
      const r = this.decide(s, d, bl);
      return { id, start: s, duration: d, blocked: bl, expected: (av ? 'Available ' : 'Unavailable ') + rc, observed: (r.available ? 'Available ' : 'Unavailable ') + r.reason, pass: r.available === av && r.reason === rc ? 'PASS' : 'FAIL' };
    });
    const same = before === JSON.stringify(this.BOOKINGS);
    rows.push({ id: 'T8', start: '-', duration: '-', blocked: '-', expected: 'bookings unchanged', observed: same ? 'bookings unchanged' : 'bookings CHANGED', pass: same ? 'PASS' : 'FAIL' });
    return rows;
  },
};
