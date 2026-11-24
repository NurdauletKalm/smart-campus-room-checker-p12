import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, Lock, ShieldCheck, Unlock, XCircle } from 'lucide-react';
import { DAY_MINUTES, MAX_DURATION, toHHMM } from './lib/availability';
import { type Decision, checkRoom } from './lib/checker';
import { parseClock } from './lib/validation';
import { BOOKINGS, NOW, ROOM_NAME, TEST_CASES } from './data/fixtures';

// UI display layer only: all rules live in src/lib (validation.ts → availability.ts → checker.ts).
const SNAPSHOT = JSON.stringify(BOOKINGS);
const PRESETS = TEST_CASES.filter((t) => t.id !== 'T8');

export default function App() {
  const [startTime, setStartTime] = useState('11:30');
  const [duration, setDuration] = useState('60');
  const [blocked, setBlocked] = useState(false);
  const [result, setResult] = useState<Decision | null>(null);
  const [checks, setChecks] = useState(0);

  const unchanged = JSON.stringify(BOOKINGS) === SNAPSHOT;
  const preview = useMemo(() => {
    const s = parseClock(startTime);
    const d = Number(duration);
    return Number.isNaN(s) || !Number.isInteger(d) || d < 1 ? null : { s, e: Math.min(s + d, DAY_MINUTES) };
  }, [startTime, duration]);

  const reset = () => setResult(null);
  const runCheck = () => {
    setResult(checkRoom({ startTime, duration }, { now: NOW, blocked, bookings: BOOKINGS }));
    setChecks((c) => c + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-indigo-600 text-white">
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center gap-3">
          <CalendarClock className="h-8 w-8 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{ROOM_NAME}</h1>
            <p className="text-indigo-100 text-sm">
              Smart Campus Room Availability Checker · Practice #12 code-based build · fictional data · read-only
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-3">
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" /> Conditions
          </h2>
          <p className="text-sm mb-4">
            Current time (simulated): <span className="rounded bg-slate-100 px-2 py-1 font-mono">{toHHMM(NOW)}</span>
          </p>
          <p className="text-sm font-medium mb-1">Room status</p>
          <button
            id="toggle-blocked"
            aria-pressed={blocked}
            onClick={() => {
              setBlocked(!blocked);
              reset();
            }}
            className={`w-full mb-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {blocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {blocked ? 'Blocked' : 'Open'}
          </button>
          <p id="snapshot" className={`text-xs rounded-lg px-3 py-2 ${unchanged ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            Booking data {unchanged ? 'unchanged' : 'CHANGED'} after {checks} check{checks === 1 ? '' : 's'} (T8)
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Check a Time Request</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="start">
                Start time (HH:MM)
              </label>
              <input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  reset();
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="duration">
                Duration (minutes, 1–{MAX_DURATION})
              </label>
              <input
                id="duration"
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  reset();
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4" aria-label="Test presets">
            {PRESETS.map((t) => (
              <button
                key={t.id}
                data-test={t.id}
                title={t.name}
                onClick={() => {
                  setStartTime(t.start!);
                  setDuration(t.duration!);
                  setBlocked(t.blocked!);
                  reset();
                }}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
              >
                {t.id}: {t.start} · {t.duration} min{t.blocked ? ' · blocked' : ''}
              </button>
            ))}
          </div>

          <button
            id="check"
            onClick={runCheck}
            className="w-full sm:w-auto rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Check availability
          </button>

          {result && (
            <div
              id="result"
              role="status"
              data-reason={result.reason}
              className={`mt-4 rounded-lg border p-4 flex items-start gap-3 ${
                result.available ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
              }`}
            >
              {result.available ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
              )}
              <div>
                <p className={`font-bold ${result.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {result.available ? 'Available' : 'Unavailable'}
                  <code className="ml-2 text-xs font-normal">{result.reason}</code>
                </p>
                <p className="text-sm">{result.message}</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-3">
          <h2 className="font-semibold mb-3">Day Timeline (00:00–24:00)</h2>
          <div className="relative h-10 rounded-lg bg-slate-100 overflow-hidden">
            <div className="absolute inset-y-0 bg-slate-300/70" style={{ left: 0, width: `${(NOW / DAY_MINUTES) * 100}%` }} />
            {BOOKINGS.map((b) => (
              <div
                key={b.start}
                className="absolute inset-y-1 rounded bg-rose-400"
                style={{ left: `${(b.start / DAY_MINUTES) * 100}%`, width: `${((b.end - b.start) / DAY_MINUTES) * 100}%` }}
                title={`${toHHMM(b.start)}–${toHHMM(b.end)}`}
              />
            ))}
            {preview && (
              <div
                className="absolute inset-y-3 rounded bg-indigo-500/70"
                style={{ left: `${(preview.s / DAY_MINUTES) * 100}%`, width: `${((preview.e - preview.s) / DAY_MINUTES) * 100}%` }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
          <h3 className="mt-4 text-sm font-medium">
            Existing bookings <span className="text-slate-500">({BOOKINGS.length} · read-only)</span>
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {BOOKINGS.map((b) => (
              <li key={b.start} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                {toHHMM(b.start)}–{toHHMM(b.end)} · {b.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-3">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> Shared Acceptance Criteria (Practice #12)
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            <li><b>AC1</b> — start time must be in the future.</li>
            <li><b>AC2</b> — duration &gt; 0 and ≤ {MAX_DURATION} minutes.</li>
            <li><b>AC3</b> — overlapping bookings are unavailable (touching ends are fine).</li>
            <li><b>AC4</b> — a blocked room is unavailable.</li>
            <li><b>AC5</b> — clear decision; existing bookings never change.</li>
            <li><b>AC6</b> — invalid input gets understandable feedback.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
