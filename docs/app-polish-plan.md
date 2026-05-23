# STEMM Lab — App Polish & Stability Plan

**Branch:** `stemmlab/app-polish`
**Sprint:** 3 — final-week polish
**Posture:** stabilise + present. No architecture rewrites. Local-first preserved.
**Date:** 2026-05-24

---

## 1. Assessment-risk analysis

Final week. Goal is to ship a marker-ready, stable build — not to chase ambitious features. Three risk pockets, each with a deliberate mitigation:

| Risk | Where | Mitigation |
|---|---|---|
| Auth/onboarding restructure introduces a regression in the offline path | Welcome / Auth / RootNavigator | Offline branch stays byte-identical (`Continue offline → TeamSetup → MainTabs`). Auth integration is additive only. **No new screens, no conflict routing, no sync-resolution trees.** Binary post-auth choice is a native `Alert.alert`. |
| Visual regression in dark mode after theme migration | parachute / handfan / earthquake Run+Result | Token-only swaps (no layout edits). Verify each screen in light + dark + large-text per phase commit. |
| Auto-mirror to Firestore introduces silent async failures | `ResultSummaryScreen.handleSave`, `TeamContext.saveTeam` | Fire-and-forget with try/catch + `console.warn`. Only runs when `getCurrentUser()` is non-null. Manual "Back up to cloud" button retained as safety net. Firestore writes already idempotent via `setDoc(..., { merge: true })`. |

Explicit non-goals for this polish phase (locked):
- **No** Firebase native persistence work — we accept the documented limitation that auth doesn't survive app restart.
- **No** SQLite save-path activation, no fake "mirrored rows" counters. SQLite stays an honestly-presented dormant integrated layer.
- **No** TeamChooser screen, no conflict-routing logic, no auto-push/auto-load decision tree, no team-sharing capability.
- **No** changes to AsyncStorage keys, `AttemptEntry` union, `TeamContext` shape, ResultSummary save flow, or Firestore schema.
- **No** new native dependencies. Expo Go must keep launching.

---

## 2. Prioritized polish checklist

### P0 — must-have for demo

1. Navigation rename: `ActivityStack` inner `Home` route → `Dashboard` (fixes the Metro `Home > Home` warning).
2. `WelcomeScreen` redesign: three primary buttons — *Continue offline*, *Sign in*, *Create account*.
3. `AuthScreen` accepts a `mode: 'signin' | 'signup'` route param so Welcome can deep-link to either tab.
4. `RootNavigator`: `Auth` route reachable from both `!team` and `team` branches (today it's only the team-set branch).
5. Post-auth handler (inline in `AuthScreen`): after success, check `getTeamFromFirestore(uid)`.
   - Cloud team found → `Alert.alert` with two buttons: *Load saved team* (loads into `TeamContext`) / *Create new team* (navigate to `TeamSetup`).
   - No cloud team → navigate to `TeamSetup`.
6. Auto-mirror new saves to Firestore when signed in (fire-and-forget, no UI blocking):
   - `ResultSummaryScreen.handleSave` → `saveActivityResultToFirestore(result)` after `saveResult` succeeds.
   - `TeamContext.saveTeam` → `saveTeamToFirestore(team)` after AsyncStorage write succeeds.
7. Settings Account section: a "Cloud sync: ON ✓ / OFF" status row that reflects current sign-in state.
8. Sign-out preserves local team intact + small toast: *"Signed out — saves are local only"*.

### P1 — high value, low risk

9. Full theme-token migration on `parachute`, `handfan`, `earthquake` (Run + Result screens) — replace hardcoded hex colors with `useTheme()` tokens and `fontScale`. Verify both modes.
10. Permission / error / loading state audit on all Run screens (mic, accelerometer, location). Ensure denial paths render a friendly message rather than crashing or staying blank.
11. Activity catalogue card polish: consistent *Coming Soon* badge styling on the breathing card; consistent card heights / press feedback.
12. Translation coverage check for newly-added strings (Welcome buttons, post-auth alert, sync status, sign-out toast) across all four locales (`en`, `es`, `ar`, `zh`).
13. Noisy log cleanup: remove `console.log` debug stragglers; keep `console.warn` diagnostics intact.
14. Settings screen visual hierarchy pass: clean section order (*Account → Display → Device Status → Background Task → Language*), consistent spacing.

### P2 — nice-to-have

15. Empty-state polish on History and Leaderboard (clearer copy + iconography).
16. Loading state consistency: same spinner size/color across screens.
17. Notification presentation tightening (titles, body copy).
18. Battery / background status section copy refresh.
19. Pre-fill TeamSetup with the existing local team data if the user signs in, has no cloud team, and an offline team already exists — saves typing. (Small, safe, defer if time runs out.)

### P3 — stretch, defer if time runs out

20. Component-level test for the post-auth Alert chooser flow (mock Firestore, assert `Alert.alert` call shape).
21. Hand-checked accessibility sweep with VoiceOver / TalkBack on the new Welcome layout.

**Explicitly dropped from prior drafts:**
- ~~Firebase native persistence (`getReactNativePersistence`)~~ — accept the limitation.
- ~~"X rows mirrored" SQLite stat in Settings~~ — no real writes exist; presenting one would overstate the integration.

---

## 3. Safe vs. unsafe polish items

**Safe** — well-bounded, easy revert, no data risk:
- Nav rename (`Home → Dashboard`)
- Welcome 3-button layout
- AuthScreen mode param
- Post-auth `Alert.alert` handler
- Auto-mirror fire-and-forget calls (additive)
- Settings status row + sign-out toast
- Translation gap fills
- Log cleanup
- Theme token migration on older screens
- `progress.md` documentation entry

**Unsafe — DO NOT attempt in this polish phase:**
- Restructuring RootNavigator's `team ? / !team` branching beyond making Auth reachable from both
- Adding any new dedicated screen (TeamChooser, post-auth router, etc.) — use `Alert.alert` instead
- Changing `TeamContext` shape, public methods, or storage keys
- Changing `AsyncStorage` keys for results, attempts, team, or preferences
- Modifying the `AttemptEntry` union or `Result` type
- Touching `ActivityRunScreen` / `ActivityResultScreen` dispatcher logic
- Modifying Firestore document layout (`teams/{uid}`, `activityResults/{localResultId}`)
- Replacing AsyncStorage with SQLite as canonical store
- Activating SQLite save paths
- Adding `getReactNativePersistence` or any Firebase native-persistence shim
- Adding any new native dependency
- Reworking `ResultSummaryScreen` save flow beyond the single auto-mirror call
- Any change that would break Expo Go launch

---

## 4. Auth/team-setup problem analysis

**Symptoms**
- Auth is buried inside Settings; markers won't discover it on a casual demo.
- Sign-in has no user-visible effect besides enabling two manual Settings buttons.
- Team creation happens before auth, so cloud and local teams can drift apart.
- Firestore round-trip features (backup, load, auto-mirror) are invisible to a first-time user.

**Root cause**
Auth was added late (Phase 4c) and bolted onto Settings as an optional capability rather than integrated into onboarding. The cloud and local stores were deliberately kept separate, but with no UX bridge connecting them.

**Constraint posture for the fix**
- Local-first philosophy is non-negotiable: offline path must remain fully functional and byte-identical.
- No "join existing team" / team-sharing. Single-user-per-team model preserved.
- No conflict-resolution UI beyond the binary post-auth alert.
- No new screens. Use `Alert.alert` for the post-auth choice.
- No new contexts, no schema changes, no storage key changes.

---

## 5. Recommended auth/onboarding flow (simplified)

```
Welcome (revised)
 ├─ Continue offline   → TeamSetup → MainTabs            (existing path, unchanged)
 ├─ Sign in            → AuthScreen(mode = 'signin')  ──┐
 └─ Create account     → AuthScreen(mode = 'signup')  ──┘
                                                         │
                                              on success │
                                                         ▼
                                      getTeamFromFirestore(uid)
                                                         │
                          ┌──────────────────────────────┴──────────────────────┐
                          ▼                                                     ▼
                  cloud team found                                       no cloud team
                          │                                                     │
                          ▼                                                     ▼
        Alert.alert "Cloud team found"                              navigation.navigate('TeamSetup')
         "Load saved team"   → TeamContext.saveTeam(cloud)          (existing TeamSetup flow;
                              → RootNavigator flips to MainTabs      since signed in, save will
         "Create new team"   → navigation.navigate('TeamSetup')      auto-mirror to cloud)
                              → TeamSetup save flow runs as normal
```

**Sign-out behaviour:** `clearAuth()` only. Local team in AsyncStorage stays intact. A brief confirmation is shown — implemented as an inline `Text` banner inside the Settings Account section, or a one-button `Alert.alert`, whichever sits more cleanly in the existing layout. Copy: *"Signed out — saves are local only."* User continues in MainTabs. Auto-mirror stops firing until they sign in again. (React Native has no built-in toast component, so this is a deliberately low-tech presentation.)

**Auto-mirror behaviour (when signed in):**
- After `ResultSummaryScreen.handleSave` calls `saveResult` successfully, fire-and-forget `saveActivityResultToFirestore(payload)` wrapped in try/catch + `console.warn`.
- After `TeamContext.saveTeam` writes to AsyncStorage successfully, fire-and-forget `saveTeamToFirestore(team)` wrapped in try/catch + `console.warn`.
- Manual "Back up to cloud" button in Settings is retained as a full-resync action.
- Settings Account section shows current state: *"Cloud sync: ON ✓"* when signed in, *"Cloud sync: OFF"* when signed out.

**Why this is safe**
- Zero new screen files. The only new UI is one `Alert.alert` call and a status row in Settings.
- `TeamContext` public surface (`team`, `loading`, `saveTeam`, `clearTeam`) is unchanged.
- AsyncStorage and Firestore schemas unchanged.
- The offline path's runtime behaviour is unchanged.
- Any phase below is independently revertable via `git revert <commit>`.

---

## 6. Files to modify

**Create (0 net-new screen / service files)**
- *(none)* — post-auth logic lives inline in `AuthScreen.tsx` via `Alert.alert`.

**Modify**

| File | Purpose |
|---|---|
| `src/screens/onboarding/WelcomeScreen.tsx` | Replace single CTA with three buttons (Continue offline / Sign in / Create account). |
| `src/screens/auth/AuthScreen.tsx` | Accept `mode?: 'signin' \| 'signup'` route param; default tab from param. On successful auth, call `getTeamFromFirestore(uid)` and route via `Alert.alert` (cloud team) or `navigation.navigate('TeamSetup')` (no cloud team). |
| `src/navigation/RootNavigator.tsx` | Add `Auth` route to the `!team` branch (already present in the `team` branch). Add `mode` to `RootStackParamList['Auth']`. |
| `src/navigation/ActivityStack.tsx` | Rename inner route `Home` → `Dashboard`. Update `ActivityStackParamList`. |
| `src/screens/home/HomeScreen.tsx` | Type-prop update for the renamed route name. |
| `src/screens/activity/*.tsx` and `src/screens/common/ResultSummaryScreen.tsx` | Update every `navigation.navigate('Home')` / `popToTop()` call site that depends on the inner route name. |
| `src/screens/common/ResultSummaryScreen.tsx` | Add fire-and-forget `saveActivityResultToFirestore(payload)` after `saveResult` succeeds, gated on `getCurrentUser()`. |
| `src/context/TeamContext.tsx` | Add fire-and-forget `saveTeamToFirestore(team)` inside `saveTeam` after AsyncStorage write succeeds, gated on `getCurrentUser()`. |
| `src/screens/settings/SettingsScreen.tsx` | Account section: add a "Cloud sync: ON/OFF" status row driven by `listenToAuthChanges`. Sign-out keeps local team, shows the toast/inline message instead of clearing team data. Section order normalised. |
| `src/i18n/translations.ts` | New keys for Welcome buttons, post-auth alert title/message/buttons, cloud-sync status row, sign-out toast. All four locales (`en`, `es`, `ar`, `zh`). |
| `src/screens/activity/parachute/ParachuteRunScreen.tsx` | Hex colors → theme tokens; `baseFont * fontScale`. |
| `src/screens/activity/parachute/ParachuteResultScreen.tsx` | Same. |
| `src/screens/activity/handfan/HandFanRunScreen.tsx` | Same. |
| `src/screens/activity/handfan/HandFanResultScreen.tsx` | Same. |
| `src/screens/activity/earthquake/EarthquakeRunScreen.tsx` | Same. |
| `src/screens/activity/earthquake/EarthquakeResultScreen.tsx` | Same. |
| `docs/progress.md` | Append polish phase entry at the bottom in the existing voice. |

**Explicitly NOT modified**
- `App.tsx` (provider tree, init hooks)
- `ThemeContext`, `LanguageContext`, `LocationContext`, `NotificationContext`
- `storage/attempts.ts`, `storage/results.ts`, `storage/team.ts`, `storage/preferences.ts`
- `storage/sqliteDb.ts`, `storage/sqliteResults.ts`, `storage/sqliteTeams.ts`
- `services/firebase.ts`, `services/firestoreService.ts`, `services/authService.ts` (existing functions used as-is)
- `services/gpsService.ts`, `services/notificationService.ts`, `services/batteryService.ts`, `services/backgroundTaskService.ts`
- All other activity Run/Result screens (`sound`, `reaction`, `performance`)
- `data/activities.ts`, `utils/activityLabels.ts`, `utils/performanceMetrics.ts`, etc.
- `jest.config.js`, `jest.setup.ts`, test suites (except optional P3 component test)

---

## 7. Manual testing checklist (post-polish, on a real device via Expo Go)

### Onboarding paths

- [ ] Fresh install → Welcome → *Continue offline* → TeamSetup → MainTabs renders.
- [ ] Fresh install → Welcome → *Create account* → AuthScreen on sign-up tab → success → no cloud team → TeamSetup → MainTabs renders.
- [ ] Fresh install → Welcome → *Sign in* → AuthScreen on sign-in tab → success → no cloud team → TeamSetup → MainTabs renders.
- [ ] Existing user with cloud team → Welcome → *Sign in* → Alert *"Cloud team found"* appears → tap *Load saved team* → MainTabs renders with cloud team name.
- [ ] Existing user with cloud team → Welcome → *Sign in* → Alert appears → tap *Create new team* → TeamSetup renders.
- [ ] Mid-session: tap Sign out from Settings → toast/banner shows "Signed out — saves are local only" → still in MainTabs with the same team.

### Save / result / history / leaderboard

- [ ] Run sound, reaction, earthquake, parachute, handfan, performance — each saves successfully via ResultSummary.
- [ ] When signed in: open Settings → *Load from cloud (verify)* → confirms the new result appears in Firestore.
- [ ] When signed out: result saves locally only; nothing fires to Firestore.
- [ ] History tab lists the newly saved result with correct unit / formatting.
- [ ] Leaderboard ranks correctly across all six implemented activities.
- [ ] Home recent activity card updates after each save.

### UI / accessibility

- [ ] Light mode + dark mode on every screen, including parachute / handfan / earthquake.
- [ ] Large-text toggle scales fonts on every Run + Result screen, no clipping or overflow.
- [ ] All four locales (`en`, `es`, `ar`, `zh`) render Welcome / post-auth alert / sync status row / sign-out toast.
- [ ] Activity catalogue: breathing card shows *Coming Soon* badge with consistent style.

### Stability

- [ ] Metro `MainTabs > Home, MainTabs > Home > Home` warning is gone.
- [ ] No new console errors on cold start.
- [ ] Permission-denial paths (mic / accelerometer / location / notifications) render a friendly message rather than crashing.
- [ ] `npx tsc --noEmit` is clean.
- [ ] `npm test` is green (existing 18 suites + any new metric tests).
- [ ] App still launches in Expo Go.

---

## 8. Phased execution plan

Each phase ends with `npx tsc --noEmit` clean + (where listed) `npm test` clean. Commit at every phase boundary. Each phase is independently revertable.

### Phase A — Navigation rename + warning cleanup

1. Rename `ActivityStack` root screen from `Home` to `Dashboard`. Update `ActivityStackParamList`.
2. Update every `navigation.navigate('Home')` call site inside `src/screens/activity/**` and `src/screens/common/ResultSummaryScreen.tsx`. (`navigation.popToTop()` is route-name-agnostic and does not need to change.)
3. Update `HomeScreen` prop typing.
4. `tabBarLabel` stays as the translated *Home* — only the internal route name changes.
5. **Verify:** Metro warning gone; navigation still works end-to-end; tests green.

### Phase B — Auth/onboarding integration

1. **B1 — Welcome layout.** Replace the single CTA with three buttons. Add i18n keys for the three button labels in all four locales. Verify layout in both themes + large-text.
2. **B2 — AuthScreen mode + post-auth handler.** Add `mode` route param; default the pill toggle to it on mount. On successful auth: call `getTeamFromFirestore(uid)`. If a cloud team comes back, show `Alert.alert` with the two buttons. *Load saved team* → `saveTeam(cloudTeam)` via TeamContext (this flips RootNavigator into the `team` branch automatically). *Create new team* → `navigation.navigate('TeamSetup')`. If no cloud team, navigate to TeamSetup directly.
3. **B3 — RootNavigator wiring.** Add `Auth` screen registration to the `!team` branch (preserving the existing `team`-branch registration so it's still reachable from Settings). Add `mode` to `RootStackParamList['Auth']`.
4. **Verify:** All onboarding paths from the checklist work end-to-end; offline path is unchanged.

### Phase C — Auto-mirror + Settings sync UX

1. `ResultSummaryScreen.handleSave`: after `saveResult` succeeds, if `getCurrentUser()` is non-null, fire-and-forget `saveActivityResultToFirestore(payload)` in a try/catch with `console.warn` on failure. No UI blocking, no alert on failure.
2. `TeamContext.saveTeam`: after AsyncStorage write succeeds, same pattern with `saveTeamToFirestore(team)`.
3. `SettingsScreen` Account section: add a "Cloud sync: ON ✓ / OFF" status row, sourced from the existing `listenToAuthChanges` subscription. Sign-out button keeps local team intact, shows the new toast/inline message, no `clearTeam` call.
4. **Verify:** signed-in saves appear in Firestore via the existing *Load from cloud (verify)* button; signed-out saves stay local only; sign-out keeps the user in MainTabs with the team intact.

### Phase D — Theme migration on older activity screens

Migrate one screen at a time, verifying light + dark + large-text after each:
1. `ParachuteRunScreen` → `ParachuteResultScreen`
2. `HandFanRunScreen` → `HandFanResultScreen`
3. `EarthquakeRunScreen` → `EarthquakeResultScreen`

Token-only swaps. No layout / behaviour edits. Keep the visual structure of the screen identical — only the colour and font-size sources change.

### Phase E — UI / Settings / i18n / log polish

1. Settings section order + spacing pass.
2. Activity catalogue card polish (Coming Soon badge consistency).
3. Permission / error / loading state audit on all Run screens (read-only audit unless a regression is spotted).
4. Translation completeness sweep across all new keys for `ar` and `zh` (most-likely-missed locales).
5. `console.log` cleanup: remove debug stragglers; keep `console.warn` diagnostics.

### Phase F — Manual E2E pass + progress.md

1. Walk the full manual checklist (§7) on a real device through Expo Go.
2. Append a polish phase entry to `docs/progress.md` in the existing voice — what changed, why, what was deliberately not done, `tsc` + `npm test` notes.
3. Final `npx tsc --noEmit` and `npm test`.

**Priority if time runs short:** A → B → C must ship. D is high value but skippable. E and F are valuable but lowest urgency.

---

## 9. Rollback strategy

- Every phase ships as a single commit. Rollback = `git revert <commit>` for that one commit.
- No data migrations, no AsyncStorage key changes, no Firestore schema changes — so revert is purely code-side. User data is never at risk.
- Firestore writes are idempotent via `setDoc(..., { merge: true })` — a reverted auto-mirror cannot orphan rows.
- Phase A (nav rename) blocks nothing. Reverting it only re-introduces the Metro warning.
- Phase B (auth/onboarding) reverts cleanly to the current Settings-only auth surface. Welcome falls back to the single CTA, AuthScreen reverts to its current behaviour.
- Phase C (auto-mirror) reverts to manual cloud backup. Existing manual Settings button still works.
- Phase D (theme migration) is purely cosmetic — revert restores the prior hex-colored screens.
- Phase E + F are independently revertable per change.
- **Worst case:** if any phase destabilises the build during demo prep, revert just that commit. AsyncStorage data persists across reverts. The app remains demoable at every phase boundary.
