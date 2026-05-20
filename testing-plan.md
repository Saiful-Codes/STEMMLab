# STEMMLab Testing Plan

Sprint 2 testing strategy for STEMMLab — a React Native + Expo + TypeScript mobile app.

This document is the single source of truth for what we test, how we test it, what we deliberately do **not** test, and how to execute the testing backlog step by step. It is also the evidence index for assessment submission.

---

## 1. Goals & Constraints

**Goals**

- Prove the app has a real, repeatable testing process.
- Cover the core, deterministic logic well (utils, storage, services).
- Catch regressions in Sprint 2 changes (GPS, notifications, save flow).
- Produce clean, copy-pasteable evidence (terminal output, coverage report, screenshots).

**Constraints (explicit non-goals)**

- This is a **university assignment**, not an enterprise app.
- **No overengineering** — small dependency footprint, no CI infra, no Detox.
- **No Firebase emulator** — Firebase is fully mocked.
- **No heavy native-module testing** — sensors / audio / SQLite / background tasks / battery are mocked at a shallow level only.
- **Coverage is evidence, not a gate** — no thresholds enforced in `jest.config.js`. A missing test never fails the build.
- **Expo Go compatibility preserved** — no native build required to run the test suite.

---

## 2. Stack & Tooling

| Layer | Choice | Why |
|---|---|---|
| Test runner | **Jest** via `jest-expo` preset | Official Expo preset; handles RN transforms + Flow strip |
| Component renderer | **@testing-library/react-native** | Standard RN testing library; built-in matchers in v12+ |
| AsyncStorage | `@react-native-async-storage/async-storage/jest/async-storage-mock` | Official mock shipped by the package |
| Firebase | Manual jest mocks for `firebase/app`, `firebase/auth`, `firebase/firestore` | Zero network, fully deterministic |
| Native modules | Manual jest mocks for `expo-location`, `expo-sensors`, `expo-audio`, `expo-notifications`, `expo-battery`, `expo-task-manager`, `expo-background-fetch`, `expo-sqlite`, `expo-speech` | Avoid runtime errors when these libs touch native bridges |
| Test file layout | **Co-located** `*.test.ts(x)` next to source files | Standard for RN, easy to discover, no mirrored directory tree |
| E2E | **Manual only** (documented checklist + Expo Go screenshots) | Detox needs a dev build → out of scope |

### Dev dependencies to add

```
jest
jest-expo
@types/jest
@testing-library/react-native
react-test-renderer
```

`react-test-renderer` version must match the installed React version (currently `19.1.0`).

### Scripts to add to `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Files to create

- `jest.config.js` — preset `jest-expo`, setup file, transform-ignore patterns for `expo`/`@expo`/`react-native`/`@react-native`/`firebase` packages
- `jest.setup.ts` — global mocks (AsyncStorage, expo modules, firebase, silenced warnings)
- `__mocks__/firebase/auth.ts` — manual mock for the auth SDK surface used by `authService.ts`
- `__mocks__/firebase/firestore.ts` — manual mock for the firestore SDK surface used by `firestoreService.ts`

---

## 3. What We Test vs. Skip

### Test — high value, pure or easily mockable

- `src/utils/resultUtils.ts` — ranking and aggregation math
- `src/utils/activityLabels.ts` — unit formatting, lowerIsBetter mapping, timestamp formatter
- `src/utils/parachutePhysics.ts` — finalVelocity, acceleration, drag, gForce, risk bands
- `src/utils/handFanPhysics.ts` — degrees-to-radians, force estimation, material lookup
- `src/services/authService.ts` — `getFriendlyAuthError` (pure mapping) + sign-in/sign-up via mocked `firebase/auth`
- `src/services/firestoreService.ts` — call-shape verification, malformed-doc resilience, no-uid throw
- `src/services/gpsService.ts` — `formatLocation`, `calculateDistance` (pure); permission + getCurrentLocation via mocked `expo-location`
- `src/storage/results.ts` — get/save/clear with AsyncStorage mock; JSON corruption fallback
- `src/storage/team.ts` — get/save/clear with AsyncStorage mock
- 3 component tests via @testing-library/react-native: `AuthScreen`, `HomeScreen`, `HistoryScreen`
- 1 root smoke render test for `App.tsx` — providers and navigation mount without crashing

### Skip — manual only or shallow mock only

| Module | Reason | Coverage strategy |
|---|---|---|
| `src/services/backgroundTaskService.ts` | OS-driven, can't run in Expo Go | One shallow mocked-module test only |
| `src/services/batteryService.ts` | Returns `null` in simulator | One shallow test for null-fallback path |
| `src/services/notificationService.ts` | Permission UX is manual | Shallow mock test for permission-request branch |
| `src/storage/sqliteDb.ts`, `sqliteResults.ts`, `sqliteTeams.ts` | `expo-sqlite` is awkward to mock cleanly; AsyncStorage is still the source of truth | One smoke test that the module loads without throwing |
| All `*RunScreen.tsx` | Heavily depend on sensors/audio/timers | **Manual E2E only** |
| Navigation graph, theme tokens, i18n strings | Visual and configuration | Manual |
| AdMob | Reverted from `dev` | One static assertion: no source file imports `react-native-google-mobile-ads` |

---

## 4. Test Categories & Target Counts

| Category | Files | Approx. test count | Purpose |
|---|---|---|---|
| **Unit (pure)** | resultUtils, activityLabels, parachutePhysics, handFanPhysics, authService (mapper), gpsService (formatters) | ~30 | Prove core deterministic logic is correct |
| **Unit (mocked I/O)** | storage/results, storage/team, services/firestoreService, services/authService (auth calls), services/gpsService (permission), services/notificationService (shallow), services/batteryService (shallow), services/backgroundTaskService (shallow) | ~15 | Prove data + Firebase wiring behave correctly without real I/O |
| **Component/Integration** | AuthScreen, HomeScreen, HistoryScreen | ~6 | Prove key UI flows render and respond to user input |
| **Smoke** | App.tsx | 1 | Prove providers + navigation render without crashing |
| **Manual E2E** | 6 implemented activities + auth + settings sync | ~10 scenarios | Capture screenshots for assessment evidence |

**Total: ~52 automated tests, ~10 manual scenarios.** Right-sized for a uni assignment.

---

## 5. Coverage Policy

- **Coverage is evidence, not a gate.** `jest.config.js` does **not** define `coverageThreshold`.
- `npm run test:coverage` writes:
  - `coverage/lcov-report/index.html` — browseable HTML report
  - Text summary to terminal — copy this for evidence
- Indicative levels we expect to see (informational only, not enforced):
  - `src/utils/` ≥ 80% statements
  - `src/storage/` ≥ 70% statements
  - `src/services/` (excluding background/battery/notifications native parts) ≥ 50% statements
  - Overall project ~35–45% — intentionally low because RN/native/UI is out of scope by design
- If coverage drops below these informational levels, that is a **signal to look**, not a failure.

---

## 6. Risky Areas After Sprint 2 (Priority Test Targets)

These are the areas that **changed most recently** or have the **highest blast radius** if broken. Tests here are written first.

1. **GPS service + LocationContext** — newly merged into dev. Permission edge cases can crash result-save. → tested via mocked `expo-location`.
2. **NotificationContext + notificationService** — most recently merged (PR #27). Interacts with app lifecycle and notification listeners. → shallow mocked test only; manual smoke check of permission request.
3. **AsyncStorage save path in `ResultSummaryScreen`** — single integration point for all 5 activities; if `saveResult` breaks, all activities silently fail. → covered by `storage/results.test.ts` and a manual E2E pass.
4. **Firestore re-sync idempotency** — `setDoc(activityResults/{result.id})` must not duplicate on re-sync. → covered by `firestoreService.test.ts` (verify `setDoc` called with deterministic id).
5. **`getActivityResultsFromFirestore` malformed-doc resilience** — added in Phase 6 Step 2. → explicit test with one good and one malformed doc.
6. **AdMob revert verification** — confirm no source file still imports `react-native-google-mobile-ads`, `AdBanner`, or `adService`. → one static grep-based test.

---

## 7. Test File Conventions

- Co-locate next to source: `src/utils/resultUtils.ts` → `src/utils/resultUtils.test.ts`.
- One `describe` block per public function or screen.
- One `it` (or `test`) per behaviour, not per code line.
- Mocks live either in `__mocks__/` (for external packages) or inline at the top of the test file via `jest.mock(...)`.
- Never import from `firebase/*` directly inside a test — go through `src/services/firebase.ts` so the manual mock catches it.
- Reset mocks in `beforeEach` when state leaks between tests (`jest.clearAllMocks()`).

---

## 8. Manual E2E Checklist

To be executed in Expo Go on a real device, with screenshots captured. Numbered for evidence filenames.

| # | Scenario | Pass criteria |
|---|---|---|
| 01 | Onboarding | Welcome → TeamSetup → enter team name + 1 member + grade → land on Home tab |
| 02 | Sound Pollution Hunter run | Request mic permission → record → see live dB → Stop → Save → result appears in History |
| 03 | Reaction Board run | Start → wait for green → tap → result recorded; false-start handled |
| 04 | Earthquake Resistance run | Toggle Simulate mode → Start → device vibrates → Stop → peak/avg recorded |
| 05 | Parachute Drop run | Enter drop height + mass + fall time → see computed velocity/acceleration/g-force |
| 06 | Hand Fan Challenge run | Pick material → enter bend angle → see estimated force |
| 07 | History screen | Past attempts appear newest-first; tapping one opens result view |
| 08 | Leaderboard screen | Implemented activities show ranked results |
| 09 | Auth flow | Sign up with email/password → see "Signed in as ..." in Settings → Sign out |
| 10 | GPS tagging | Allow location → run any activity → result shows lat/lon (or "Location not available" if denied) |

Each row is captured as a screenshot file:
`docs/testing-evidence/manual/NN-<short-name>.png`

---

## 9. Evidence to Capture for Submission

```
docs/testing-evidence/
  coverage/
    lcov-report/                 # HTML coverage report
    coverage-summary.txt         # paste of terminal coverage summary
  runs/
    npm-test-output.txt          # full passing `npm test` terminal output
  manual/
    01-onboarding.png
    02-sound-pollution-run.png
    03-reaction-board-run.png
    04-earthquake-run.png
    05-parachute-run.png
    06-handfan-run.png
    07-history.png
    08-leaderboard.png
    09-auth-flow.png
    10-gps-tagging.png
  manual-checklist-completed.md  # copy of Section 8 with each row ticked + date
testing-plan.md                  # this document
docs/progress.md                 # appended Sprint 2 Testing section
README.md                        # short "Testing" section linking to testing-plan.md
```

---

## 10. Sprint 2 Testing Plan (Scoped Execution)

Sprint 2 testing executes in two phases.

### Phase A — Infrastructure + risky areas first

Cover the **changed-this-sprint** code before backfilling stable utils. This protects the most fragile surfaces first.

- Task 1: install deps + write `jest.config.js`, `jest.setup.ts`, `babel.config.js` if missing
- Task 2: add `npm test` scripts
- Task 3: sanity test on `resultUtils` to prove infra works
- Task 4: GPS service tests (`gpsService.test.ts`)
- Task 5: Firestore service tests (`firestoreService.test.ts`)
- Task 6: AsyncStorage results/team storage tests
- Task 7: AdMob-removed static check

### Phase B — Breadth + evidence

- Task 8: remaining utils tests (activityLabels, parachutePhysics, handFanPhysics)
- Task 9: authService tests (mapper + mocked sign-in)
- Task 10: shallow mocks for notificationService, batteryService, backgroundTaskService
- Task 11: component tests (AuthScreen, HomeScreen, HistoryScreen)
- Task 12: `App.tsx` smoke render
- Task 13: `npm run test:coverage` → capture report into `docs/testing-evidence/coverage/`
- Task 14: execute Section 8 manual checklist → capture screenshots
- Task 15: append Sprint 2 Testing section to `docs/progress.md` + add short "Testing" section to `README.md`

---

## 11. Implementation Task Backlog

Each task below is self-contained and copy-pasteable into a future Claude Code terminal session. Each has an explicit **Done when** condition. Execute in order.

### Task 1 — Install test framework and configure Jest

**Goal:** project can run `npx jest --version` and `npm test` without errors (zero tests is fine).

**Steps:**
1. `npm install --save-dev jest jest-expo @types/jest @testing-library/react-native react-test-renderer@19.1.0`
2. Create `jest.config.js`:
   ```js
   module.exports = {
     preset: 'jest-expo',
     setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
     transformIgnorePatterns: [
       'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|firebase|@firebase/.*))',
     ],
     moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
     collectCoverageFrom: [
       'src/**/*.{ts,tsx}',
       '!src/**/*.d.ts',
       '!src/**/index.ts',
     ],
   };
   ```
   (Use `setupFilesAfterEach` only if jest-expo's default setup is kept; otherwise prefer `setupFiles` + `setupFilesAfterEach` per jest-expo docs. Verify against installed jest-expo version.)
3. Create `jest.setup.ts` containing default mocks for `expo-location`, `expo-sensors`, `expo-audio`, `expo-notifications`, `expo-battery`, `expo-task-manager`, `expo-background-fetch`, `expo-sqlite`, `expo-speech`, plus AsyncStorage mock import.

**Done when:** `npm test` runs and prints "No tests found" (or runs zero tests successfully).

---

### Task 2 — Add test scripts to package.json

**Goal:** standard npm scripts available.

**Steps:** edit `package.json` `scripts` to add `test`, `test:watch`, `test:coverage` as defined in Section 2.

**Done when:** `npm run test:coverage -- --passWithNoTests` produces a `coverage/` folder.

---

### Task 3 — Sanity test for resultUtils

**Goal:** prove the test infrastructure works end-to-end on a real source file.

**File:** `src/utils/resultUtils.test.ts`

**Cases:**
- `toNumeric` returns the number for numeric input
- `toNumeric` returns parsed number for numeric string
- `toNumeric` returns null for non-numeric string and for NaN
- `sortResultsForRanking` orders ascending for `reaction` (lower is better)
- `sortResultsForRanking` orders descending for `sound` (higher is better)
- `bestResult` returns null for non-ranked activity ids
- `averageResult` averages valid numbers and ignores non-numerics

**Done when:** `npm test` reports 7 passing tests, exit 0.

---

### Task 4 — GPS service tests

**Goal:** cover the Sprint 2 risky area first.

**File:** `src/services/gpsService.test.ts`

**Cases:**
- `formatLocation` returns "Location not available" when either arg is missing
- `formatLocation` returns formatted "lat, lon" string for valid coords
- `calculateDistance` returns 0 for identical coords
- `calculateDistance` returns ~111000 m for 1° latitude offset (within ±1%)
- `requestLocationPermission` returns true when `expo-location` mock grants
- `requestLocationPermission` returns false when status is denied
- `getCurrentLocation` returns null when permission missing
- `getCurrentLocation` returns coords + locationName when both APIs succeed
- `getCurrentLocation` returns coords with undefined locationName when reverse-geocode throws

**Done when:** all GPS tests pass; reverse-geocode-throw branch is exercised.

---

### Task 5 — Firestore service tests

**File:** `src/services/firestoreService.test.ts`

Mock `firebase/firestore` (`doc`, `setDoc`, `getDoc`, `getDocs`, `query`, `where`, `collection`, `serverTimestamp`) and `./authService` (`getCurrentUser`).

**Cases:**
- `saveActivityResultToFirestore` throws when no user is signed in
- `saveActivityResultToFirestore` calls `setDoc` with path `activityResults/{result.id}` and includes `userId` + `syncedAt`
- Re-calling `saveActivityResultToFirestore` with the same `result.id` calls `setDoc` against the **same** doc id (proves idempotency by id)
- `saveTeamToFirestore` calls `setDoc` at `teams/{uid}` with `merge: true`
- `getActivityResultsFromFirestore` returns parsed Results sorted newest-first
- `getActivityResultsFromFirestore` skips a malformed doc and still returns the valid ones

**Done when:** all 6 cases pass with no real Firebase imported.

---

### Task 6 — AsyncStorage storage tests

**Files:** `src/storage/results.test.ts`, `src/storage/team.test.ts`

Use `@react-native-async-storage/async-storage/jest/async-storage-mock` from `jest.setup.ts`.

**`results.test.ts` cases:**
- `getResults` returns `[]` when nothing stored
- `saveResult` then `getResults` returns the saved result at index 0 (newest-first)
- Saving twice prepends the newest
- `getResults` returns `[]` when storage contains invalid JSON (corruption fallback)
- `clearResults` empties the store

**`team.test.ts` cases:**
- `loadTeam` returns null when nothing stored
- `saveTeam` then `loadTeam` returns the same team
- `clearTeam` removes the team

**Done when:** all cases pass.

---

### Task 7 — AdMob-removed static check

**File:** `src/__tests__/adMobRemoved.test.ts` (or any single test file)

**Approach:** use Node `fs` + `path` to walk `src/` and assert no `.ts`/`.tsx` file contains the string `react-native-google-mobile-ads`. Also assert `package.json` has no AdMob dependency.

**Done when:** test passes; if AdMob ever gets re-introduced without being intended, this fails loudly.

---

### Task 8 — Remaining utils tests

**Files:**
- `src/utils/activityLabels.test.ts` — `formatResult` for each ranked activity id (correct unit + precision), `formatResult` returns string-as-is for non-numeric, `isLowerBetter` per activity, `formatTimestamp` returns a non-empty string for a known epoch
- `src/utils/parachutePhysics.test.ts` — `calculateTrial` for `primary` and `highschool` levels (verify finalVelocity, acceleration, weight, gForce, gForceRisk for known inputs); `getGForceRisk` returns correct band at boundaries (4.9, 5, 9.9, 10, 29.9, 30, 49.9, 50, 100)
- `src/utils/handFanPhysics.test.ts` — `degreesToRadians(180) ≈ π`, `getMaterial` returns known + undefined, `calculateForce` returns expected `bendAngleRad` + `estimatedForce` for a known material/angle

**Done when:** all three files pass.

---

### Task 9 — authService tests

**File:** `src/services/authService.test.ts`

Mock `firebase/auth` (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`).

**Cases:**
- `getFriendlyAuthError` returns the correct friendly string for every code in the switch + unknown code falls through to the default message
- `signInWithEmail` calls `signInWithEmailAndPassword` with a trimmed email
- `signUpWithEmail` calls `createUserWithEmailAndPassword` with a trimmed email
- `signOutUser` calls `signOut`
- `listenToAuthChanges` returns the unsubscribe function from `onAuthStateChanged`

**Done when:** all cases pass.

---

### Task 10 — Shallow tests for native-leaning services

**Files:**
- `src/services/notificationService.test.ts` — mock `expo-notifications`; assert request-permissions function resolves; assert the response listener subscription is created and returns a remove-able subscription
- `src/services/batteryService.test.ts` — mock `expo-battery` to return `null` from each API; assert `getBatteryStatus()` resolves with the documented null-fallback shape (`{ levelPercent: null, state: null, stateLabel: 'Unknown', isCharging: false, lowPowerMode: null }` or matching shape)
- `src/services/backgroundTaskService.test.ts` — mock `expo-task-manager` and `expo-background-fetch`; assert `getBackgroundTaskStatus()` returns the expected shape and `getLastBackgroundRun()` returns `{ lastRunAt: null, runCount: 0 }` when AsyncStorage is empty

**Done when:** all three files pass; no real native module called.

---

### Task 11 — Component tests

**Files:**
- `src/screens/auth/AuthScreen.test.tsx` — renders email + password fields; entering an invalid email and tapping submit surfaces the inline error message; the loading spinner appears while the submit promise is pending (use a controllable mock of `authService`)
- `src/screens/home/HomeScreen.test.tsx` — renders all 7 activity tiles by title (or count)
- `src/screens/history/HistoryScreen.test.tsx` — renders empty state when storage returns `[]`; renders a list item per result when storage returns 2 mocked results

Mock `react-navigation` hooks (`useNavigation`, `useRoute`) inline. Wrap rendered components in the minimum context providers needed (`ThemeProvider`, `LanguageProvider`).

**Done when:** all three component test files pass.

---

### Task 12 — App.tsx smoke render

**File:** `App.test.tsx` (at project root, next to `App.tsx`)

Render `<App />` with the standard `render(...)` from `@testing-library/react-native`. The test only asserts that rendering does not throw. All providers (`SafeAreaProvider`, `LanguageProvider`, `ThemeProvider`, `NotificationProvider`, `LocationProvider`, `TeamProvider`) and the navigation container must mount.

Mock side-effecting modules at the top of the test:
- `expo-notifications` — `requestPermissionsAsync` resolves
- `./src/storage/sqliteDb` — `initDatabase` resolves
- `./src/services/backgroundTaskService` — side-effect import is a no-op

**Done when:** test passes with a single assertion that `render(<App/>)` does not throw.

---

### Task 13 — Coverage capture

**Steps:**
1. `npm run test:coverage`
2. Copy terminal coverage summary table into `docs/testing-evidence/coverage/coverage-summary.txt`
3. Copy `coverage/lcov-report/` into `docs/testing-evidence/coverage/lcov-report/`
4. Copy the full `npm test` output into `docs/testing-evidence/runs/npm-test-output.txt`

**Done when:** all three artifacts exist on disk.

---

### Task 14 — Manual E2E execution

**Steps:**
1. Build the manual checklist file by copying Section 8 into `docs/testing-evidence/manual-checklist-completed.md`
2. Run each scenario on a real device via Expo Go
3. Capture one screenshot per scenario at the named path (`docs/testing-evidence/manual/NN-<name>.png`)
4. Tick each checklist row + add the date

**Done when:** all 10 screenshots exist and the completed checklist is committed.

---

### Task 15 — Documentation updates

**Steps:**
1. Append a "Sprint 2 — Testing" section to `docs/progress.md` summarising: framework installed, file counts (units, components, smoke, manual), where evidence lives, any known gaps
2. Add a short "Testing" section to `README.md` with three lines: how to run tests (`npm test`), how to get coverage (`npm run test:coverage`), and a link to `testing-plan.md`

**Done when:** both files updated.

---

## 12. Quick Reference

- Run all tests: `npm test`
- Run in watch mode: `npm run test:watch`
- Run with coverage: `npm run test:coverage`
- Run a single file: `npx jest src/utils/resultUtils.test.ts`
- Run a single test by name: `npx jest -t "averages valid numbers"`

---

## 13. Appendix — Files Created by This Plan

```
testing-plan.md                                   (this file, project root)
jest.config.js
jest.setup.ts
__mocks__/firebase/auth.ts
__mocks__/firebase/firestore.ts
App.test.tsx
src/utils/resultUtils.test.ts
src/utils/activityLabels.test.ts
src/utils/parachutePhysics.test.ts
src/utils/handFanPhysics.test.ts
src/services/authService.test.ts
src/services/firestoreService.test.ts
src/services/gpsService.test.ts
src/services/notificationService.test.ts
src/services/batteryService.test.ts
src/services/backgroundTaskService.test.ts
src/storage/results.test.ts
src/storage/team.test.ts
src/screens/auth/AuthScreen.test.tsx
src/screens/home/HomeScreen.test.tsx
src/screens/history/HistoryScreen.test.tsx
src/__tests__/adMobRemoved.test.ts
docs/testing-evidence/coverage/coverage-summary.txt
docs/testing-evidence/coverage/lcov-report/...
docs/testing-evidence/runs/npm-test-output.txt
docs/testing-evidence/manual/01..10-*.png
docs/testing-evidence/manual-checklist-completed.md
```

That is the entire Sprint 2 testing surface — every file accounted for, every task self-contained, every assumption made explicit.
