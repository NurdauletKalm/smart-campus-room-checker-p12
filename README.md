# Smart Campus Room Availability Checker — Room 304 (Innovation Lab)

Single-page prototype that checks whether a requested time interval in **one fictional campus room**
(Room 304 — Innovation Lab) is available. It only *checks* availability against fictional in-memory
bookings; it never creates, saves or confirms reservations. No login, no database, no backend, no
external APIs.

Built with Bolt.new (Vite + React + TypeScript + Tailwind CSS). A Python reference implementation of the
same contract lives in `python/`.

## Acceptance contract

| ID | Rule |
|----|------|
| AC1 | Start/end are whole minutes after midnight, `0 <= start < end <= 1440`, and `start > now` (`now` in 0..1439). |
| AC2 | Duration `end - start <= 120` (exactly 120 is allowed). |
| AC3 | If the room is blocked, every request is rejected. |
| AC4 | Reject overlap with an existing booking (`start < b_end and end > b_start`); touching endpoints are allowed. |
| AC5 | Unambiguous Available / Unavailable verdict; existing bookings are never mutated. |
| AC6 | Clear validation feedback and a usable layout on narrow/mobile screens. |

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint && npm run typecheck
npm test           # Vitest: parity with python/test_booking.py + regression tests
```

## Python reference

```bash
cd python
python3 test_booking.py
```

## Files

- `src/App.tsx` — the UI (test conditions, request form, result banner, timeline, rules card).
- `src/lib/availability.ts` — `canBook()`, `parseMinutes()`, `toHHMM()`: the AC1–AC5 rules as pure functions.
- `tests/` — Vitest suites: `availability.parity.test.ts` (Python cases ported 1:1) and
  `availability.regression.test.ts` (whole-minute input and `now` range, risks R1/R2).
- `python/booking.py` — `can_book()` reference implementation.
- `python/test_booking.py` — 12 unit tests.
- `AGENTS.md` — rules for AI coding agents (scope, safe commands, forbidden actions, review gate).
- `docs/practice10/` — Practice #10 risk review, risk register, audits and recorded evidence.

## Practice #12 — code-based vs low-code

**Live demos:** [code-based (GitHub Pages)](https://nurdauletkalm.github.io/smart-campus-room-checker-p12/) ·
[low-code (Appsmith)](https://app.appsmith.com/app/smart-campus-room-checker-low-code/page1-6b05a6ca5441f3e820a02aa4) ·
**Report:** [docs/practice12/REPORT.md](docs/practice12/REPORT.md)

Branch `p12/code-vs-lowcode` (baseline tag `p12-baseline`). The app now takes a **start time (HH:MM) and a duration**
and returns `available`, a reason code (`OK`, `OVERLAP`, `BLOCKED`, `INVALID_DURATION`, `PAST_START`, `INVALID_INPUT`)
and a message. The Practice #10 rule engine `src/lib/availability.ts` is unchanged.

- `shared/contract.json` holds the fictional bookings and the T1–T8 table, shared by both builds.
- `src/lib/validation.ts` → `src/lib/checker.ts` → `src/App.tsx`: the validation, decision and UI layers.
- `tests/practice12.contract.test.ts` runs T1–T8 from the contract, plus edge cases (`npm test`, 51 tests in total).
- `lowcode/Checker.jsobject.js` is the Appsmith JS Object used by the low-code build.
- `docs/practice12/REPORT.md` is the report: requirements sheet, test table, comparison matrix, security checklist, AI reflection.
- `docs/practice12/screenshots/` holds full-screen evidence and `docs/practice12/evidence/` holds the raw logs.
