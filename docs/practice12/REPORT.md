# Practice Work #12 — Compare code-based and low-code solutions

**Course:** AI-Driven Software Engineering · Lesson #12 practice
**Student:** Nurdaulet Kalmurzaev · ID 24B031830
**Class time:** Tuesday, 16:00–19:00 *(copied from my Practice #11 report, so check it before submitting)*
**Date:** 24 November 2026
**AI tool:** Claude Code (Claude desktop app, Code tab), model **Claude Opus 5.5** (`claude-opus-5-5`)
**Low-code platform:** Appsmith Cloud, free plan (app `Smart Campus Room Checker Low-code`)
**Repository branch:** `p12/code-vs-lowcode`. Tags: `p10-final` (start), `p12-baseline` (frozen baseline)

All screenshots in `screenshots/` are **full-desktop captures (1920×1200) taken on my own PC**. They show the real
Chrome and PowerShell windows. Raw logs are in `evidence/`.

---

## Task 01 — Freeze the baseline

| Item | Value |
|---|---|
| Baseline project | Smart Campus Room Availability Checker, Room 304 (fictional), from Practice #10 (`p10/risk-mitigations`, commit `16f82e9`) |
| Stack | Vite 5 + React 18 + TypeScript + Tailwind (built in Bolt.new). Python reference in `python/` |
| Booking data at baseline | `single = [10:00–11:00 Robotics Club]` and `multiple = [10:00–11:00, 13:00–14:00]`, all fictional and read-only |
| Expected behaviour | AC1–AC6 from Practice #10 (`README.md`). `now` is a simulated clock |
| Existing checks run | `npm test` → **32/32 pass**. `python test_booking.py` → **12/12 OK**. `lint`, `typecheck` and `build` → **all exit 0** (`evidence/t1-*.txt`) |
| Baseline screenshots | `screenshots/00_baseline_p10_desktop.png`, `00_baseline_p10_mobile.png` |
| Frozen as | git tag **`p12-baseline`** (commit `3ba75e9`) |

**The booking rules were not changed.** `git diff p12-baseline -- src/lib/availability.ts` is empty. Practice #12 adds
a validation layer and an adapter around the unchanged `canBook()` rule engine.

---

## Task 02 — Shared requirement and acceptance-criteria sheet (both solutions)

The single source for both builds is **`shared/contract.json`**.

**User story.** *As a student, I want to choose a future start time and a duration for Room 304, so that I can see
immediately whether the room is available and why, without changing any existing booking.*

| ID | Acceptance criterion |
|---|---|
| AC1 | Start time must be in the future (strictly after `now`). |
| AC2 | Duration must be greater than zero and at most 120 minutes. |
| AC3 | Overlapping bookings are unavailable. Touching endpoints (e.g. ending 11:00 when a booking starts 11:00) are allowed. |
| AC4 | A blocked room is unavailable. |
| AC5 | Display a clear decision without changing existing bookings. |
| AC6 | Invalid input receives understandable feedback. |

**Inputs**

| Input | Type | Notes |
|---|---|---|
| `startTime` | `HH:MM` (24 h) | the same day only |
| `duration` | whole minutes | 1–120 |
| `blocked` | boolean | room status switch |
| `bookings` | fictional list | `10:00–11:00 Robotics Club`, `13:00–14:00 Study Group B` |
| `now` | fixed | `09:00`, simulated, so that tests are repeatable |

**Outputs:** `available` (boolean), `reason` (reason code), and a visible `message`.

| Reason code | Meaning |
|---|---|
| `OK` | free for the whole interval |
| `OVERLAP` | overlaps an existing booking |
| `BLOCKED` | room is blocked |
| `INVALID_DURATION` | duration is not a whole number 1–120 |
| `PAST_START` | start is not after `now` |
| `INVALID_INPUT` | the start time is malformed, or the interval would end after 24:00 |

**Evaluation order** (identical in both builds): format → duration → end of day → past start → blocked → overlap.
Validation errors are reported before the room status.

The test inputs below were fixed **before** either implementation was written.

---

## Task 03 — Code-based solution

| Layer | File | Responsibility |
|---|---|---|
| Validation | `src/lib/validation.ts` | `parseClock()` and `validateRequest()` turn raw strings into a validated request or a reason code and message. Raw input is never echoed back. |
| Availability | `src/lib/availability.ts` | **Unchanged** Practice #10 `canBook()` rule engine |
| Decision / contract | `src/lib/checker.ts` | `checkRoom()` runs validation, then `canBook()`, and maps the result to the shared reason codes. An unknown rule fails closed. |
| Data | `src/data/fixtures.ts` | Loads `shared/contract.json`. Bookings are `Object.freeze`d. |
| UI display | `src/App.tsx` | Form, T1–T7 preset buttons, result banner, T8 indicator, timeline. Responsive grid (desktop and 390 px). |
| Tests | `tests/practice12.contract.test.ts` | T1–T8 driven from `contract.json`, plus 11 validation and edge-case tests |

**Evidence**
- `screenshots/code_T1.png` … `code_T8.png`: the app in Chrome, one capture per test.
- `screenshots/code_mobile_390px.png`: narrow-screen layout.
- `screenshots/code_terminal_T1-T8_vitest.png`: verbose Vitest run, 19/19 pass.
- `screenshots/code_terminal_all_checks.png`: `lint`, `typecheck`, the full test suite (51/51) and `git log`.

---

## Task 04 — Low-code solution (Appsmith)

| Element | Appsmith implementation |
|---|---|
| Start time | Input widget `StartInput`, single-line text, default `11:30` |
| Duration | Input widget `DurationInput`, single-line text, default `60` |
| Room status | Switch widget `BlockedSwitch`, default off |
| Workflow | Button `CheckButton`, `onClick = {{Checker.run()}}` |
| Rules + fictional bookings | JS Object `Checker` (`lowcode/Checker.jsobject.js`, pasted into Appsmith unchanged) |
| Decision display | Text widget `ResultText`, bound to `Checker.result` |
| T8 indicator | Text widget `SnapshotText`, which compares `Checker.BOOKINGS` against the original literal |
| In-app test table | Table widget `SelfTestTable`, `{{Checker.selfTest()}}`: T1–T8 expected vs observed with PASS/FAIL |

**Platform expressions or scripts used.** One JS Object of about 80 lines, which holds the availability rule, the
bookings and a self-test. Appsmith's visual workflow builder has no way to express interval-overlap logic, so the
rules had to be written in JavaScript. This build is therefore **low-code, not no-code**.

**Requirements the platform could not implement as specified, and deviations**
- None of AC1–AC6 is missing. All eight tests pass in the **deployed** app; nothing is simulated.
- **Business rules need code (JS Object).** The platform's purely visual controls cannot express AC1–AC4.
- Duration uses a text input rather than Appsmith's *Number* type. This keeps invalid entries (`0`, `121`, text)
  testable, the same as in the code version.
- There is no timeline visual. It isn't in the acceptance criteria, but it would need a Custom widget (more code).
- The narrow-screen (mobile) layout of the Appsmith app was **not verified**.

**Evidence**
- `screenshots/lowcode_editor_js_object.png`: the JS Object in the editor.
- `screenshots/lowcode_editor_canvas_button_onclick.png`: the widget tree and the `onClick` binding.
- `screenshots/lowcode_00_app_loaded.png`, `lowcode_T1.png` … `lowcode_T7.png`, `lowcode_T8_and_selftest_table.png`:
  the deployed app.

---

## Task 05 — Identical tests (expected vs observed)

`now = 09:00`. Bookings `10:00–11:00` and `13:00–14:00`.

| # | Input (start · duration · blocked) | Expected | Code-based, observed | Low-code (Appsmith), observed |
|---|---|---|---|---|
| T1 | 11:30 · 60 · no | Available `OK` | Available `OK`: "free from 11:30–12:30 (60 min)" ✅ | ✅ Available `[OK]`: same message ✅ |
| T2 | 10:30 · 60 · no | Unavailable `OVERLAP` | Unavailable `OVERLAP`: "10:30–11:30 overlaps existing booking 10:00–11:00" ✅ | ❌ Unavailable `[OVERLAP]`: same message ✅ |
| T3 | 11:30 · 60 · **yes** | Unavailable `BLOCKED` | Unavailable `BLOCKED` ✅ | Unavailable `[BLOCKED]` ✅ |
| T4 | 11:30 · **0** · no | validation error `INVALID_DURATION` | `INVALID_DURATION`: "whole number of minutes from 1 to 120" ✅ | `[INVALID_DURATION]`: same ✅ |
| T5 | 11:30 · **121** · no | validation error `INVALID_DURATION` | `INVALID_DURATION` ✅ | `[INVALID_DURATION]` ✅ |
| T6 | **08:00** · 30 · no | validation error `PAST_START` | `PAST_START`: "08:00 is not in the future (current time is 09:00)" ✅ | `[PAST_START]`: same ✅ |
| T7 | 11:00 · 120 · no (11:00–13:00, touches both bookings) | Available `OK` | Available `OK` ✅ | ✅ Available `[OK]` ✅ |
| T8 | bookings after T1–T7 | unchanged | "Booking data unchanged after 7 checks", and frozen-array deep-equal test ✅ | "Booking data unchanged after 7 checks" and self-test row T8 PASS ✅ |
| | **Total** | | **8 / 8** | **8 / 8** |

Raw output: `evidence/t5-code-ui-run.txt`, `evidence/t5-lowcode-ui-run.txt`.

---

## Task 06 — Engineering effort

**Measured** from timestamps in `evidence/timing-log.txt`, git commits and tool logs. These are wall-clock times for
an AI coding agent (Claude Code) working on my PC. **They are not human typing times.**

| Phase | Code-based | Low-code (Appsmith) |
|---|---|---|
| Setup | Node.js install and `npm ci`: not logged precisely (≈ 5 min, estimate). Baseline checks and tag: **2.5 min** (19:53→19:55) | Account sign-up by me: not timed. Editor setup and JS Object: **≈ 2 min** |
| Implementation | **2.1 min** (19:55:47→19:57:53): validation, checker, UI and 19 tests | **≈ 7 min**: 9 widgets, bindings and properties |
| Debugging | **0 failing tests** on the first run. 1 tooling issue: the dev server started from the wrong folder, so Tailwind didn't load (≈ 2 min) | **≈ 5 min**, 6 problems: JS Object must *start* with `export default`; 4 widget drops failed (no free grid space); resize handles needed scaled coordinates; table column auto-typed as checkbox; PASS column hidden off-screen (fixed by freezing it); the button label property is `label`, not `text` |
| Testing / evidence | **2.2 min** (19:57:53→20:00:06) for 8 UI cases with screenshots and a terminal run | **≈ 2 min** for deploy and 8 cases in the deployed app with screenshots |
| **Total build + repair** | **≈ 7 min** measured (excluding Node install) | **≈ 15.5 min** measured (20:01:52→20:17:17) |
| Acceptance tests passed | 8 / 8 | 8 / 8 |
| Unresolved defects | 0 | 0 functional. 1 open item: mobile layout not verified |

**How changes are reviewed, exported and version-controlled**

| | Code-based | Low-code |
|---|---|---|
| Review | Every change is a git commit with a diff (`git log p12-baseline..HEAD`). Automated tests act as a gate. | Edits auto-save in the Appsmith cloud with no diff view on the free path used. The editor has no automated test runner, so I added the `selfTest()` table myself. |
| Export | Plain source files. `npm run build` gives a static site that runs anywhere. | App JSON export (re-importable only into Appsmith). Appsmith "Connect Git" exists but was **not used or verified** here. |
| Version control | git history, tags and branches | Platform-managed. The JS logic is mirrored by hand into `lowcode/Checker.jsobject.js` in git. |

**Measured results vs impressions.** Measured: both builds pass 8/8, and the low-code build took about 2× longer
with 6 platform-specific problems. Impressions: the low-code UI looks good with no styling work. The core logic was
the same JavaScript in both builds, so low-code did not remove the hard part here.

---

## Task 07 — Security review (Lecture #12)

| Check | Code-based | Low-code (Appsmith) |
|---|---|---|
| **Input validation** | Strict `HH:MM` regex. Duration must be digits only. Range checks. Fails closed on unknown rules. | Same regex and checks inside the JS Object |
| **Output handling / XSS** | React escapes all text. No `dangerouslySetInnerHTML`, `innerHTML` or `eval` (`evidence/t7-sast-grep.txt`). Messages never echo raw input. | Messages never echo raw input. The Text widget only shows `Checker.result`. |
| **Injection / SQL** | No database, no backend, no queries | No datasource or query connected |
| **DAST (safe manual runtime check)** | Payload `<img src=x onerror=alert(1)>` put in Duration (input forced to text): result `INVALID_DURATION`, **0 dialogs, 0 injected elements** (`screenshots/security_dast_code_xss_probe.png`) | Same payload in Start time on the **deployed** app: `INVALID_INPUT`, **0 dialogs, 0 injected elements** (`screenshots/security_dast_lowcode_xss_probe.png`) |
| **Secrets** | None in the repo. No `.env`, no API keys (grep). | None. The JS Object uses no APIs, so no keys exist in client-side workflows. |
| **Permissions / sharing** | Local only. Not deployed yet. | App is **private** (owner only). It must be made public or shared for the instructor's live demo, which needs my decision. Least privilege: no datasources, no connectors. |
| **Connector / AI-agent access** | The AI agent worked in my local folder only. Every change is a reviewed git commit. | The AI agent drove a **separate Chrome profile** where I signed in myself. It never saw or typed my password. |
| **SCA (dependencies)** | `npm audit`: **runtime deps: 0 vulnerabilities**. Dev/test tooling: 13 (2 critical, 1 high, 10 moderate) in `vitest` → `tinypool`, `@vitest/mocker`, `esbuild` (dev server) and `minimatch`. None ship in the built app. The fix needs a breaking `vitest` upgrade, so it is recorded as a follow-up. | Platform dependencies are **Appsmith's responsibility**. I cannot audit or patch them. My responsibility is limited to my JS Object and the app's sharing settings. |
| **Update responsibility** | Me: dependency upgrades, rebuild, redeploy | Appsmith: runtime, widgets, hosting and patching. Me: app logic and access. |
| **Unauthorized scanning** | — | No scans of Appsmith's platform. Only my own app's inputs were probed. |

---

## Comparison matrix (with evidence)

| Criterion | Code-based | Low-code (Appsmith) |
|---|---|---|
| Functional tests | **8 / 8** (`code_T*.png`, Vitest 19/19) | **8 / 8** (`lowcode_T*.png`, self-test table) |
| Build and repair time | **≈ 7 min** (measured, AI-agent wall-clock) | **≈ 15.5 min** (measured, AI-agent wall-clock) |
| Customization | Full control: timeline, responsive layout, native time picker, any styling | Limited to the widget set and grid layout. Logic still needed JavaScript. A timeline would need a Custom widget. |
| Security controls | Escaped rendering, strict validation, no backend, SCA visible and fixable by me | Same app-level validation. Platform security is managed by Appsmith and can't be audited. Private by default. |
| Versioning / portability | git history and tags. Static build runs on any host. | Cloud auto-save. JSON export works only in Appsmith (vendor lock-in). Git connect not verified. |
| Ongoing cost | $0 (static hosting, e.g. GitHub Pages) | $0 on the free plan used. Paid tiers exist but prices were not checked. No subscription bought. |

### Recommendation

**Use the code-based solution for the Smart Campus checker.** Both builds satisfied all six criteria and all eight
tests. The decisive evidence is:

1. **The rules needed code in both builds.** The low-code version still needed an ~80-line JavaScript object, so it did not remove the hard part.
2. **Effort:** the low-code build took about twice as long to build and repair, with six platform-specific problems.
3. **Control:** only the code version has diffable history, automated tests in CI, and dependencies I can audit and fix myself.
4. **Portability:** the code version runs anywhere for $0, while the low-code version only runs on Appsmith.

Low-code would make sense if non-developers needed to change the screens often, or if the app grew into a data-entry
tool connected to a real datasource.

---

## AI-use reflection

- **What the AI did:** Claude Code read the assignment PDF and found my Practice #10 project on disk. It froze the
  baseline, wrote the shared contract, the validation/checker layers and the tests, and wrote the Appsmith JS Object.
  It built the Appsmith app by driving a separate Chrome window after I signed in, ran all tests, and took these
  screenshots.
- **What I did:** chose the baseline and the platform, created and signed in to the Appsmith account, approved
  installing Node.js, and reviewed the results.
- **What was verified, and how:** every claim in this report links to a screenshot or a log. The same eight cases ran
  in a real browser on both builds, and the expected values were fixed before implementation.
- **What the AI got wrong and corrected:** the dev server initially ran from the wrong folder, so styling was
  missing. The JS Object had a header comment before `export default`, which Appsmith rejects. Several widget
  drops and resizes failed until the 1.25× screen scaling was taken into account. All were caught by looking at the
  screenshots, not by trusting the agent's own report.
- **Least privilege:** I typed the password myself in a separate browser profile. The agent connected only to that
  window and changed only my own app and project folder.

---

## Labels for incomplete or simulated behaviour

- **Simulated:** `now` is fixed at 09:00 in **both** builds (by design, for repeatable tests). All bookings are fictional.
- **Incomplete:** the Appsmith mobile layout was not verified. Appsmith Git integration was not tested.
- **Not done yet (needs my decision):** public GitHub repo, live demo link (GitHub Pages and a public Appsmith
  link), Appsmith JSON export file, and the submission email.
