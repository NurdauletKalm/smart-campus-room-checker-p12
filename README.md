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
```

## Python reference

```bash
cd python
python3 test_booking.py
```

## Files

- `src/App.tsx` — the whole UI and the availability check.
- `python/booking.py` — `can_book()` reference implementation.
- `python/test_booking.py` — 10 unit tests.
