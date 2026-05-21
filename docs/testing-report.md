# STEMMLab — Testing Progress Report

**Branch:** `testing`
**Scope of this report:** Tasks 1–11 of `testing-plan.md` (Phase A complete + Phase B utils + authService + native-leaning service shallow tests + component tests for the three main user-facing screens).
**Audience:** future developer/maintainer continuing the testing backlog.
**Source of truth for plan/scope:** `testing-plan.md` at project root.

This document tracks what has been built, what is intentionally out of scope, and what is still pending. It is meant to be appended to as Tasks 12–15 land.

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

### Task 9 — authService
- File: `src/services/authService.test.ts` (16 tests).
- `getFriendlyAuthError` — table-driven coverage for every code in the switch (`auth/invalid-email`, `auth/missing-email`, `auth/missing-password`, `auth/weak-password`, `auth/email-already-in-use`, `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential`, `auth/too-many-requests`, `auth/network-request-failed`) + default fallthrough for an unknown code + default fallthrough when `err` has no `code` (Error instance, `null`, plain string).
- `signInWithEmail` — calls `signInWithEmailAndPassword(auth, trimmedEmail, password)` and returns `cred.user`.
- `signUpWithEmail` — calls `createUserWithEmailAndPassword(auth, trimmedEmail, password)` and returns `cred.user`. Both trim leading/trailing whitespace including newlines.
- `signOutUser` — calls `signOut(auth)`.
- `listenToAuthChanges` — passes the supplied callback to `onAuthStateChanged`, supplies its own error handler, and returns the unsubscribe function untouched.
- Mocks: inline `jest.mock('./firebase', () => ({ auth: { __mock: 'auth' } }))` (sentinel `auth`) and `jest.mock('firebase/auth')` with `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged` stubs. No real Firebase imported.

### Task 10 — Shallow tests for native-leaning services
- File: `src/services/notificationService.test.ts` (6 tests).
  - `requestNotificationPermissions` — short-circuits when `getPermissionsAsync` already reports `'granted'` (no re-prompt); requests when undetermined and resolves to `true` on grant / `false` on denial; resolves to `false` when the permissions API throws (covers the `try/catch` warn branch).
  - `setupNotificationResponseListener` — calls `addNotificationResponseReceivedListener`, returns a subscription whose `remove()` is invocable; when the registered handler fires with a fake response, the user callback receives `response.notification.request.content.data` verbatim.
  - Mocks: relies on the global `expo-notifications` mock from `jest.setup.ts`; overrides with `mockResolvedValueOnce` / `mockImplementationOnce` per case. Captures the listener via `mockImplementationOnce` so the handler can be invoked synchronously inside the test.
- File: `src/services/batteryService.test.ts` (5 tests).
  - `getBatteryStatus` — full **simulator/unavailable fallback** when every battery API throws: `{ levelPercent: null, state: BatteryState.UNKNOWN, stateLabel: 'Unknown', isCharging: false, lowPowerMode: null }`. `-1` sentinel from `getBatteryLevelAsync` ⇒ `levelPercent: null`. `BatteryState.CHARGING` ⇒ `'Charging'` + `isCharging: true`; `FULL` ⇒ `'Full'` + `isCharging: true`; `UNPLUGGED` ⇒ `'On battery'` + `isCharging: false`. `levelPercent` rounds `level * 100` (0.42 ⇒ 42, 0.78 ⇒ 78, 1 ⇒ 100). `lowPowerMode` round-trips `true` / `false` / `null` unchanged.
  - Mocks: relies on the global `expo-battery` mock (whose defaults already return `null` for the simulator case); per-test overrides via `mockResolvedValueOnce` / `mockRejectedValueOnce`. `console.warn` spied + restored per `describe`.
- File: `src/services/backgroundTaskService.test.ts` (6 tests).
  - **Module side-effect** — importing the module calls `TaskManager.defineTask(BACKGROUND_TASK_NAME, taskFn)` exactly once at top level, with the public `BACKGROUND_TASK_NAME` constant.
  - `getBackgroundTaskStatus` — happy path: OS = `Available` + registered ⇒ `{ available: true, statusLabel: 'Available', registered: true }`. Denied path: OS = `Denied` + unregistered ⇒ `{ available: false, statusLabel: 'Denied', registered: false }`. Failure path: both `getStatusAsync` and `isTaskRegisteredAsync` throw ⇒ `{ available: false, statusLabel: 'Unknown', registered: false }` (exercises both warn branches).
  - `getLastBackgroundRun` — empty AsyncStorage ⇒ `{ lastRunAt: null, runCount: 0 }`; persisted `'1700000000000'` + `'7'` ⇒ `{ lastRunAt: 1700000000000, runCount: 7 }` (verifies the `multiGet` parsing path).
  - Mocks: global `expo-task-manager`, `expo-background-fetch`, and AsyncStorage mocks from `jest.setup.ts`; `AsyncStorage.clear()` in `beforeEach` for isolation. No real native task ever registers; the `defineTask` callback body is never executed by these tests (and is intentionally out of scope per the plan).

### Task 11 — Component tests for the three main user-facing screens
- File: `src/screens/auth/AuthScreen.test.tsx` (4 tests).
  - Renders heading + email field + password field (queries by visible "Sign in" text and the literal placeholders `you@example.com` / `At least 6 characters`).
  - Submitting an invalid email surfaces the inline friendly error: when `signInWithEmail` rejects with `{ code: 'auth/invalid-email' }`, the screen renders **"That doesn't look like a valid email."**.
  - Pressing submit with an empty email shows the local validation message **"Please enter an email."** and does **not** call the auth service.
  - Loading state: a controllable pending promise from `signInWithEmail` (never resolves until test teardown) causes the submit-button text to be replaced by the `ActivityIndicator` — asserted by the `getAllByText('Sign in')` count dropping by exactly one after `fireEvent.press` (one of the three "Sign in" occurrences — the submit label — is gone). The dangling promise is resolved in `act(...)` at the end of the test so React does not warn.
  - Mocks: inline `jest.mock('../../services/authService', ...)` with stubbed `signInWithEmail`/`signUpWithEmail` + a small re-implementation of `getFriendlyAuthError` for the one code we trigger. The real `getFriendlyAuthError` is **not** loaded via `requireActual` because the real `authService.ts` transitively imports `firebase/auth`, an ESM file Jest cannot parse from `node_modules`. The friendly-error mapping itself is already fully unit-tested in `authService.test.ts`.
  - Providers: `ThemeProvider` only. `navigation` and `route` are passed as structural stubs (`goBack`, `navigate`, `addListener`, ...).
- File: `src/screens/home/HomeScreen.test.tsx` (3 tests).
  - Renders the **Quick Access** section title and the **four navigation-tile labels** ("Activities", "Leaderboard", "History", "Settings"). This is what HomeScreen actually shows — the seven STEMM activity tiles live on the `ActivityList` screen, not here.
  - Team banner falls back to **"Your Team"** when no team is persisted (`TeamProvider` loads `null` from the mocked AsyncStorage).
  - Renders the welcome ribbon ("Welcome back,") and the footer hint ("Tap any card to explore").
  - Mocks: `@react-navigation/native` via `requireActual` + override of `useFocusEffect` (re-implemented as plain `useEffect` so the focus-driven `getResults()` fires in tests); `../../storage/results` returns `[]` so `RecentActivityCard` has nothing to render but does not crash.
  - Providers: `ThemeProvider` → `LanguageProvider` → `TeamProvider`. Navigation is a structural stub.
- File: `src/screens/history/HistoryScreen.test.tsx` (2 tests).
  - Empty state: `getResults` resolves to `[]` ⇒ the empty-state title **"No results yet"** and message **"Finish an activity to see your history grow."** both render.
  - Populated state: `getResults` resolves to two `Result` objects (teams `Falcons` and `Hawks`) ⇒ both team names appear in their cards and the empty-state title is absent.
  - Mocks: `@react-navigation/native` `useFocusEffect` override (same pattern as HomeScreen); `react-native-gifted-charts` stubbed to a plain `View` so the chart's native imports don't load; `../../storage/results` `getResults` controlled per case.
  - Providers: `ThemeProvider` → `LanguageProvider`.

---

## 4. Test categories implemented so far

| Category | Files | Test count |
|---|---|---|
| Unit (pure) — resultUtils, activityLabels, parachutePhysics, handFanPhysics, gps formatters/distance, authService error mapper | 5 | 7 + 16 + 11 + 8 + 4 (`formatLocation`/`calculateDistance` subset of gps) + 12 (`getFriendlyAuthError` cases) |
| Unit (mocked I/O) — gps permission/location, firestoreService, storage/results, storage/team, authService sign-in/up/out/listen, batteryService, backgroundTaskService persistence + status | 7 | 5 (gps) + 6 + 5 + 3 + 4 + 5 + 6 |
| Native-leaning shallow — notificationService permission + listener | 1 | 6 |
| Static guardrail — AdMob removal | 1 | 2 |
| Component / integration — AuthScreen, HomeScreen, HistoryScreen | 3 | 4 + 3 + 2 |
| Smoke (`App.tsx`) | — | not yet (Task 12) |

**Current totals: 16 test suites, 107 passing tests, 0 skipped, 0 failing.**

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
- **Auth email trimming** — `signInWithEmail` and `signUpWithEmail` strip leading/trailing whitespace (including newlines) before handing the email to Firebase, so user-entered "  alice@example.com  " never reaches the backend untrimmed.
- **Auth error mapping** — every Firebase error code referenced in the `getFriendlyAuthError` switch has a corresponding assertion; an unknown code or non-`code`-bearing error falls through to the generic friendly message instead of leaking the raw Firebase string.
- **`listenToAuthChanges` resilience** — the wrapper installs its own error handler around `onAuthStateChanged` and returns Firebase's unsubscribe verbatim, so callers can always tear the listener down.
- **Notification permission short-circuit** — when `getPermissionsAsync` already returns `'granted'`, `requestNotificationPermissions` does **not** call `requestPermissionsAsync` (no UX prompt regression on app re-launch).
- **Notification listener cleanup contract** — `setupNotificationResponseListener` returns a subscription whose `remove()` is invocable; the registered handler forwards `response.notification.request.content.data` to the user callback.
- **Battery simulator fallback** — `getBatteryStatus` produces the exact documented shape (`levelPercent: null`, `state: UNKNOWN`, `stateLabel: 'Unknown'`, `isCharging: false`, `lowPowerMode: null`) when **all three** native APIs throw — i.e. an unavailable bridge does not crash callers.
- **Battery state mapping** — `CHARGING` and `FULL` both map to `isCharging: true`; only `UNPLUGGED` maps to `isCharging: false`. `levelPercent` is rounded from `level * 100` (e.g. `0.42 ⇒ 42`).
- **Background task side-effect** — importing `backgroundTaskService` registers the task with `TaskManager.defineTask(BACKGROUND_TASK_NAME, ...)` exactly once, so the runtime knows the task name before the OS asks for it.
- **Background task fallback** — `getBackgroundTaskStatus` returns the same documented `{ available: false, statusLabel: 'Unknown', registered: false }` shape whether the OS denies background fetch *or* the native API throws.
- **Background-run AsyncStorage parsing** — `getLastBackgroundRun` returns `{ lastRunAt: null, runCount: 0 }` when storage is empty and parses persisted strings into a `number` `lastRunAt` and integer `runCount` correctly.
- **AuthScreen ↔ authService wiring** — a rejected `signInWithEmail({ code: 'auth/invalid-email' })` propagates through `handleSubmit`, lands in `getFriendlyAuthError`, and renders the friendly inline error in the UI (no `code` is leaked).
- **AuthScreen local validation** — an empty email triggers the local "Please enter an email." message **before** the service is called, so we never make a doomed network round-trip on empty input.
- **AuthScreen loading state** — while the submit promise is pending, the button label is replaced with the `ActivityIndicator` (text count drops by one) and the field/Pressable `disabled` state engages.
- **HomeScreen navigation surface** — the four Quick-Access tile labels ("Activities", "Leaderboard", "History", "Settings") all render, so the user always has a path into the rest of the app even before a team is created.
- **HomeScreen empty-team fallback** — when no team is persisted, the banner shows the localised "Your Team" string instead of crashing on a `null` team.
- **HistoryScreen empty state** — when `getResults()` returns `[]`, the empty-state title + message both render via the `EmptyState` component (the FlatList path is skipped).
- **HistoryScreen list rendering** — when `getResults()` returns multiple results, each card renders its team name and the empty-state is absent, proving the focus-effect → setState → FlatList path.

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
| `src/services/authService.ts` | 90% | 71.42% | uncovered: `getCurrentUser` (out of Task 9 scope) and the `onAuthStateChanged` error-callback `console.warn` line (not worth asserting) |
| `src/services/batteryService.ts` | **100%** | **100%** | full — every branch of `stateLabelFor` + every try/catch in `getBatteryStatus` |
| `src/services/backgroundTaskService.ts` | 46.55% | 50% | covered: `defineTask` side-effect, `getBackgroundTaskStatus` happy/denied/throw paths, `getLastBackgroundRun` empty + populated paths. Uncovered (intentionally): the `defineTask` body itself (lines 22–40), `registerBackgroundTask` / `unregisterBackgroundTask` (lines 71–104), and the `getLastBackgroundRun` catch branch — all out of Task 10 scope per the plan |
| `src/services/notificationService.ts` | 42.1% | 23.07% | covered: `requestNotificationPermissions` (all branches) and `setupNotificationResponseListener`. Uncovered (intentionally): `sendImmediateNotification`, `scheduleNotification`, `sendActivityCompleteNotification`, `notifyActivityComplete`, `notifyNewHighScore`, and the in-app `create*Notification` factories — all out of Task 10 scope per the plan (UX-driven, used at call sites, no logic worth asserting) |
| `src/storage/results.ts` | 78.94% | 100% | uncovered: `saveResult`/`clearResults` catch+throw branches |
| `src/storage/team.ts` | 62.5% | 100% | uncovered: catch+throw branches across all 3 functions |
| `src/utils/activityLabels.ts` | 54.16% | 40% | uncovered: i18n / translation helpers (out of Task 8 scope) |

Activities, screens, sensor-driven services, navigation, and SQLite remain at 0% by design (covered manually or via component tests scheduled for Tasks 11–12). Overall `services/` jumped from **~31.77%** to **~62.61%** statements after Task 10.

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

## 9. Pending tasks (12–15)

From `testing-plan.md` §11. Each is self-contained and runnable in isolation.

| # | File(s) | Summary |
|---|---|---|
| **12** | `App.test.tsx` (project root) | Smoke render — all providers and the navigation container mount without throwing. |
| **13** | `docs/testing-evidence/...` | Run `npm run test:coverage`, copy the lcov-report folder + terminal summary + npm test transcript into `docs/testing-evidence/`. |
| **14** | `docs/testing-evidence/manual/` | Execute the 10-scenario manual checklist in Expo Go on a real device; capture one screenshot per scenario. |
| **15** | `docs/progress.md`, `README.md` | Append a Sprint 2 testing section to `progress.md`; add a short Testing section to `README.md` linking back to `testing-plan.md`. |

---

## 10. Current project testing status

- ✅ **Phase A complete** (Tasks 1–7): infrastructure, risky-area Sprint 2 surfaces (GPS, Firestore, storage), AdMob guardrail.
- ✅ **Phase B partially complete** (Tasks 8–11 done): remaining pure utils backfilled + authService (mapper + sign-in/up/out/listen) covered + shallow native-leaning service tests (notification, battery, background task) + component tests for AuthScreen, HomeScreen, HistoryScreen.
- 🟡 **Phase B in progress** (Task 12 pending): App smoke render.
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

**Test files (16 suites, 107 tests)**

```
src/__tests__/adMobRemoved.test.ts
src/utils/resultUtils.test.ts
src/utils/activityLabels.test.ts
src/utils/parachutePhysics.test.ts
src/utils/handFanPhysics.test.ts
src/services/gpsService.test.ts
src/services/firestoreService.test.ts
src/services/authService.test.ts
src/services/notificationService.test.ts
src/services/batteryService.test.ts
src/services/backgroundTaskService.test.ts
src/storage/results.test.ts
src/storage/team.test.ts
src/screens/auth/AuthScreen.test.tsx
src/screens/home/HomeScreen.test.tsx
src/screens/history/HistoryScreen.test.tsx
```

**Plan / evidence sources**

```
testing-plan.md          (single source of truth for scope)
docs/testing-report.md   (this file)
```

---

*Last updated after Task 11 completion. Append new sections (or extend §3, §4, §7, §9) as Tasks 12–15 land — do not rewrite history.*
