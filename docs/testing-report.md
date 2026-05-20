# STEMMLab — Testing Progress Report

**Branch:** `testing`
**Scope of this report:** Tasks 1–8 of `testing-plan.md` (Phase A complete + first chunk of Phase B utils backfill).
**Audience:** future developer/maintainer continuing the testing backlog.
**Source of truth for plan/scope:** `testing-plan.md` at project root.

This document tracks what has been built, what is intentionally out of scope, and what is still pending. It is meant to be appended to as Tasks 9–15 land.

---

## 1. Strategy overview

STEMMLab is a React Native + Expo + TypeScript app. The testing strategy is deliberately right-sized for a university Sprint 2 deliverable, not enterprise:

- **Deterministic logic first.** Pure utils, storage helpers, and service-layer wiring carry the bulk of automated coverage.
- **Native / device code is shallow-mocked.** Anything that touches the Expo native bridge (sensors, audio, SQLite, battery, background tasks, notifications) is stubbed at the module boundary so tests run in Node without a device.
- **Firebase is fully mocked.** No emulator, no network — `firebase/auth` and `firebase/firestore` are replaced by inline `jest.mock(...)` calls per test file. `./firebase` (the `db` export) is replaced with a sentinel object.
- **No CI yet.** Tests run locally via `npm test`. Coverage is captured as evidence, not enforced via a threshold.
- **Expo Go compatibility preserved.** No native build needed; no test introduces a dependency that would break the Expo Go runtime.
- **Screens / navigation / sensor-driven runs are manual-only or deferred to component tests in Task 11.** They are too entangled with the native bridge to be worth a fragile unit test.

---

## 2. Stack & tooling

| Layer | Choice |
|---|---|
| Test runner | `jest@29.7.0` |
| Preset | `jest-expo@~54` (matches `expo ~54`) |
| Component renderer (Task 11+) | `@testing-library/react-native@^13` (not yet used) |
| Renderer | `react-test-renderer@19.1.0` (matches React 19.1.0) |
| Types | `@types/jest` |
| AsyncStorage mock | `@react-native-async-storage/async-storage/jest/async-storage-mock` (official) |
| Firebase | inline `jest.mock('firebase/...')` per file |
| Native modules | shallow `jest.mock(...)` in `jest.setup.ts` for `expo-location`, `expo-sensors`, `expo-audio`, `expo-notifications`, `expo-battery`, `expo-task-manager`, `expo-background-fetch`, `expo-sqlite`, `expo-speech` |

**Files defining the test environment:**

- `jest.config.js` — `preset: 'jest-expo'`, `setupFiles: ['<rootDir>/jest.setup.ts']`, `transformIgnorePatterns` covering RN/Expo/`@react-navigation`/Firebase, `collectCoverageFrom` scoped to `src/**/*.{ts,tsx}` (excluding `.d.ts` and `index.ts`).
- `jest.setup.ts` — AsyncStorage mock + the nine native-module mocks above + a `console.warn` filter that swallows known RN noise (`useNativeDriver`, `Animated:`, `Require cycle`).
- `package.json` scripts: `test` → `jest`, `test:watch` → `jest --watch`, `test:coverage` → `jest --coverage`.
- `.gitignore` — `coverage/` is ignored (added Task 2 housekeeping).

---

## 3. Completed tasks (1–8)

### Task 1 — Jest + jest-expo infrastructure
- Installed `jest`, `jest-expo`, `@types/jest`, `@testing-library/react-native`, `react-test-renderer@19.1.0`.
- Authored `jest.config.js` and `jest.setup.ts`.
- Validation: `npx jest --passWithNoTests` → exit 0, "No tests found".

### Task 2 — npm scripts + coverage pipeline
- Added `test`, `test:watch`, `test:coverage` to `package.json`.
- `coverage/` added to `.gitignore` so generated reports don't pollute the repo.
- Validation: `npm test -- --passWithNoTests` and `npm run test:coverage -- --passWithNoTests` both exit 0; `coverage/lcov-report/` generated.

### Task 3 — `resultUtils` sanity tests
- File: `src/utils/resultUtils.test.ts` (7 tests).
- Covers `toNumeric`, `sortResultsForRanking` (ascending for `reaction`, descending for `sound`), `bestResult` null-for-non-ranked, `averageResult` with mixed numeric/string inputs.
- Purpose: prove the test infra works end-to-end on a real source file before scaling out.

### Task 4 — GPS service
- File: `src/services/gpsService.test.ts` (9 tests).
- `formatLocation` missing-args + happy path, `calculateDistance` zero + 1°-latitude ≈ 111 km within ±1%, `requestLocationPermission` granted/denied, `getCurrentLocation` permission-missing / full success / reverse-geocode-throws (the resilient branch).
- Mocks: per-test `mockResolvedValueOnce`/`mockRejectedValueOnce` overrides on the global `expo-location` mock.

### Task 5 — Firestore service
- File: `src/services/firestoreService.test.ts` (6 tests).
- `saveActivityResultToFirestore` — throws when no user is signed in; calls `setDoc` at `activityResults/{result.id}` with `userId` + `syncedAt`; idempotency by id (same `result.id` re-save calls `doc()` with the same key).
- `saveTeamToFirestore` — `setDoc` at `teams/{uid}` with `{ merge: true }`.
- `getActivityResultsFromFirestore` — newest-first ordering by `timestamp`; malformed-doc resilience (a doc whose `data()` throws is skipped while valid docs survive).
- Mocks: inline `jest.mock('firebase/firestore')`, `jest.mock('./authService')`, `jest.mock('./firebase')` with a sentinel `db`. `serverTimestamp()` returns the literal `'__server_ts__'` for deterministic payload assertions.

### Task 6 — AsyncStorage persistence
- Files: `src/storage/results.test.ts` (5 tests), `src/storage/team.test.ts` (3 tests).
- `results`: empty → `[]`; save+get; prepend-newest ordering; invalid-JSON corruption fallback returns `[]` + warns; `clearResults` empties the store.
- `team`: empty → `null`; save/load round-trip; `clearTeam` removes.
- Mocks: official AsyncStorage mock from `jest.setup.ts`; `AsyncStorage.clear()` in `beforeEach` for isolation.

### Task 7 — AdMob removal guardrail
- File: `src/__tests__/adMobRemoved.test.ts` (2 assertions).
- Walks `src/` recursively via `fs.readdirSync` and asserts no `.ts`/`.tsx` file contains the string `react-native-google-mobile-ads` (this guardrail test self-excludes).
- Asserts `package.json` has no AdMob dependency across `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`.
- Purpose: hard-fail `npm test` if AdMob ever sneaks back in (it was reverted because it broke Expo Go).

### Task 8 — Remaining utils
- Files:
  - `src/utils/activityLabels.test.ts` (16 tests) — `formatResult` per ranked id (correct unit + precision), non-numeric passthrough, `isLowerBetter` per activity (including default-false for unknown), `isRankedActivity` whitelist, `formatTimestamp` non-empty for a known epoch and for `0`.
  - `src/utils/parachutePhysics.test.ts` (11 tests) — `getGForceRisk` boundary classification at **4.9, 5, 9.9, 10, 29.9, 30, 49.9, 50, 100**; `calculateTrial` for `primary` (gForce stays 0) and `highschool` no-bounce (gForce = 10 → moderate) with cleanly-roundable inputs.
  - `src/utils/handFanPhysics.test.ts` (8 tests) — `degreesToRadians(180) ≈ π`, `0`, `π/2`; `getMaterial` known + unknown + every entry in `MATERIALS`; `calculateForce(0.5, 90)` → `{ bendAngleRad: 1.57, estimatedForce: 0.79 }`; 0° → both outputs zero; linear scaling with stiffness at fixed angle.

---

## 4. Test categories implemented so far

| Category | Files | Test count |
|---|---|---|
| Unit (pure) — resultUtils, activityLabels, parachutePhysics, handFanPhysics, gps formatters/distance | 4 | 7 + 16 + 11 + 8 + 4 (`formatLocation`/`calculateDistance` subset of gps) |
| Unit (mocked I/O) — gps permission/location, firestoreService, storage/results, storage/team | 4 | 5 (gps) + 6 + 5 + 3 |
| Static guardrail — AdMob removal | 1 | 2 |
| Component / integration | — | not yet (Task 11) |
| Smoke (`App.tsx`) | — | not yet (Task 12) |

**Current totals: 9 test suites, 65 passing tests, 0 skipped, 0 failing.**

---

## 5. Important mocks & setup

### `jest.setup.ts` global mocks
All Expo native modules are stubbed shallowly — only the surface the source code actually calls is provided. Key behaviours:

- `expo-location`: permission APIs return `{ status: 'granted' }`, `getCurrentPositionAsync` returns a `(0, 0)` fixture, `reverseGeocodeAsync` returns `[]`. Tests override with `mockResolvedValueOnce`/`mockRejectedValueOnce` per case.
- `expo-sensors`: `Accelerometer` / `Gyroscope` / `DeviceMotion` expose listener-add/remove stubs and `isAvailableAsync → true`.
- `expo-audio`: recording permission granted; `useAudioRecorder` returns a no-op recorder; `setAudioModeAsync` is a no-op.
- `expo-notifications`: permissions granted; listener adders return a `{ remove }` subscription.
- `expo-battery`: every read returns `null` to mimic the simulator no-data case.
- `expo-task-manager` / `expo-background-fetch`: registration/unregistration no-ops; `getStatusAsync` returns `Available`.
- `expo-sqlite`: `openDatabaseAsync`/`openDatabaseSync` return stub DBs that resolve every API to safe defaults.
- `expo-speech`: speak/stop no-ops.
- `console.warn` filter for known RN noise so test output stays readable.

### Per-file inline mocks (Task 5)
`firebase/firestore` is mocked locally where it's used so that production imports remain unchanged and the rest of the codebase can keep using the real SDK at runtime. `./firebase` is mocked to expose a sentinel `db` object so `expect(doc).toHaveBeenCalledWith(db, 'activityResults', id)` reads naturally.

### Reset strategy
- `jest.clearAllMocks()` in `beforeEach` everywhere mocks have state that could leak.
- `AsyncStorage.clear()` in storage suites' `beforeEach`.
- `console.warn` is spied + restored per test that intentionally exercises a warning path.

---

## 6. Notable edge cases covered

- **GPS reverse-geocode failure** — `getCurrentLocation` returns coords with `locationName: undefined` when `reverseGeocodeAsync` rejects, so a save flow never crashes because of geocoding.
- **Firestore re-sync idempotency** — same `result.id` ⇒ same doc id ⇒ no duplicate documents.
- **Firestore malformed-doc resilience** — one bad `data()` throw does not poison the rest of the result set.
- **AsyncStorage corruption fallback** — `getResults` returns `[]` (not throw) when the stored JSON is unparseable; the warn is asserted.
- **G-force band boundaries** — explicit tests at every lower edge (5, 10, 30, 50) confirming `<` semantics in `getGForceRisk` push the boundary into the next band.
- **Activity ranking default-false** — `isLowerBetter` returns `false` for unknown activity ids, so a future un-metadata'd activity won't silently reverse the leaderboard.
- **AdMob re-introduction guardrail** — any future import of `react-native-google-mobile-ads` from `src/` or any package.json dependency entry will fail `npm test` immediately.

---

## 7. Coverage observations (informational, not enforced)

`jest.config.js` deliberately defines **no** `coverageThreshold`. Last `npm run test:coverage` snapshot for files that now have tests:

| File | % Stmts | % Funcs | Notes |
|---|---|---|---|
| `src/utils/handFanPhysics.ts` | 100% | 100% | full |
| `src/utils/parachutePhysics.ts` | 86.36% | 100% | uncovered: `getGForceRisk` unreachable fallback line, bounce branch in `calculateTrial` |
| `src/utils/resultUtils.ts` | 80.76% | 100% | uncovered: `bestResult` empty-array return (sortedResults.length === 0) |
| `src/services/gpsService.ts` | 81.08% | 100% | uncovered: outer try/catch warn branches + `if (!location)` null return |
| `src/services/firestoreService.ts` | 76.92% | 83.33% | uncovered: `getTeamFromFirestore` (out of Task 5 scope) |
| `src/storage/results.ts` | 78.94% | 100% | uncovered: `saveResult`/`clearResults` catch+throw branches |
| `src/storage/team.ts` | 62.5% | 100% | uncovered: catch+throw branches across all 3 functions |
| `src/utils/activityLabels.ts` | 54.16% | 40% | uncovered: i18n / translation helpers (out of Task 8 scope) |

Activities, screens, sensor-driven services, navigation, and SQLite remain at 0% by design (covered manually or via shallow tests scheduled for Tasks 10–12).

---

## 8. Why some things are intentionally deferred or shallow-tested

| Module | Strategy | Reason |
|---|---|---|
| `*RunScreen.tsx` (Sound Pollution, Reaction, Earthquake, Parachute, Hand Fan, Breathing) | **Manual E2E only** (Task 14) | They wire sensors / audio / timers / animation frames; mocking deeply gives high-maintenance, low-confidence tests. Screenshots on a real device are better evidence. |
| `src/services/notificationService.ts` | Shallow mock test (Task 10) | Permission UX is OS-level and lifecycle-bound; only the permission-request branch is worth a unit assertion. |
| `src/services/batteryService.ts` | Shallow mock test (Task 10) | `expo-battery` returns `null` on simulators; the meaningful test is the null-fallback shape. |
| `src/services/backgroundTaskService.ts` | Shallow mock test (Task 10) | OS-scheduled, can't run in Expo Go; verify it doesn't throw and returns the documented empty shape. |
| `src/storage/sqliteDb.ts`, `sqliteResults.ts`, `sqliteTeams.ts` | One smoke "loads without throw" each (Task 10 scope) | `expo-sqlite` is awkward to mock cleanly and AsyncStorage remains the source of truth for results/team. |
| Navigation graph, theme tokens, i18n strings | Visual/manual | Configuration data, not logic. |
| AdMob | Static guardrail (Task 7) | The intentional decision was to remove it; we only need to prevent it coming back. |

---

## 9. Pending tasks (9–15)

From `testing-plan.md` §11. Each is self-contained and runnable in isolation.

| # | File(s) | Summary |
|---|---|---|
| **9** | `src/services/authService.test.ts` | `getFriendlyAuthError` every code + default; `signInWithEmail` / `signUpWithEmail` trim email; `signOutUser`; `listenToAuthChanges` returns the unsubscribe from `onAuthStateChanged`. |
| **10** | `src/services/notificationService.test.ts`, `batteryService.test.ts`, `backgroundTaskService.test.ts` | Shallow native-leaning service mocks. |
| **11** | `src/screens/auth/AuthScreen.test.tsx`, `home/HomeScreen.test.tsx`, `history/HistoryScreen.test.tsx` | First component tests via `@testing-library/react-native`. Will need `react-navigation` hook mocks + minimal context providers (`ThemeProvider`, `LanguageProvider`). |
| **12** | `App.test.tsx` (project root) | Smoke render — all providers and the navigation container mount without throwing. |
| **13** | `docs/testing-evidence/...` | Run `npm run test:coverage`, copy the lcov-report folder + terminal summary + npm test transcript into `docs/testing-evidence/`. |
| **14** | `docs/testing-evidence/manual/` | Execute the 10-scenario manual checklist in Expo Go on a real device; capture one screenshot per scenario. |
| **15** | `docs/progress.md`, `README.md` | Append a Sprint 2 testing section to `progress.md`; add a short Testing section to `README.md` linking back to `testing-plan.md`. |

---

## 10. Current project testing status

- ✅ **Phase A complete** (Tasks 1–7): infrastructure, risky-area Sprint 2 surfaces (GPS, Firestore, storage), AdMob guardrail.
- ✅ **Phase B partially complete** (Task 8 done): remaining pure utils backfilled.
- 🟡 **Phase B in progress** (Tasks 9–12 pending): authService + shallow native-service tests + component tests + App smoke.
- 🔲 **Evidence pass not yet started** (Tasks 13–15): coverage artifacts, manual E2E screenshots, doc updates.

Run anytime:

```
npm test                  # full suite
npm run test:watch        # watch mode
npm run test:coverage     # writes coverage/ and prints summary table
npx jest src/utils/resultUtils.test.ts   # single file
npx jest -t "newest-first"               # single test by description
```

---

## 11. Appendix — file inventory

**Configuration**

```
jest.config.js
jest.setup.ts
package.json   (test scripts)
.gitignore     (coverage/ ignored)
```

**Test files (9 suites, 65 tests)**

```
src/__tests__/adMobRemoved.test.ts
src/utils/resultUtils.test.ts
src/utils/activityLabels.test.ts
src/utils/parachutePhysics.test.ts
src/utils/handFanPhysics.test.ts
src/services/gpsService.test.ts
src/services/firestoreService.test.ts
src/storage/results.test.ts
src/storage/team.test.ts
```

**Plan / evidence sources**

```
testing-plan.md          (single source of truth for scope)
docs/testing-report.md   (this file)
```

---

*Last updated after Task 8 completion. Append new sections (or extend §3, §4, §7, §9) as Tasks 9–15 land — do not rewrite history.*
