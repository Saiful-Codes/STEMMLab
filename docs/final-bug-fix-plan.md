# STEMM Lab — Final Bug Fix Plan

**Branch:** `stemmlab/final-bug-fix`
**Date:** 2026-05-30
**Posture:** minimal, targeted fixes only — APK build follows immediately after.

---

## Issues to Fix (5 total)

### Fix 1 — Earthquake, Reaction, Sound missing summary/insight page

**Problem:** These three RunScreens save results directly via `saveActivityResultWithLocation`, show leftover GPS debug `Alert.alert` popups ("GPS Test", "Activity Saved!"), and then navigate to `ResultSummary`. The newer activities (Parachute, HandFan, Performance, Breathing) navigate to `ResultSummary` *without* pre-saving, letting that screen handle the save with rating + comment. The three older screens bypass this, so students can't rate or reflect before submission.

**Fix:** Align Sound, Reaction, and Earthquake to the same flow as the other activities:
1. Remove the direct `saveActivityResultWithLocation()` call from each `handleFinish`
2. Remove the `saveActivityResultWithLocation` and related imports (`useLocation`, `useNotifications`, `useTeam`, `Result` type, `saveActivityResultWithLocation`)
3. Remove all debug `Alert.alert('GPS Test', ...)` and `Alert.alert('Activity Saved!', ...)` calls
4. Remove the `sendAchievement(...)` notification calls (ResultSummary already handles notifications via `sendActivityCompleteNotification`)
5. Keep only the core logic: calculate the headline result, then `navigation.replace('ResultSummary', { activityId, result })`
6. The `handleFinish` should still validate entries > 0 and team exists before navigating

**Files:**
- `src/screens/activity/sound/SoundRunScreen.tsx`
- `src/screens/activity/reaction/ReactionRunScreen.tsx`
- `src/screens/activity/earthquake/EarthquakeRunScreen.tsx`

**Verify:** Run each activity → Finish → should see ResultSummary with rating stars + comment field → Save → popToTop. No debug alerts. No double-saving.

---

### Fix 2 — Leaderboard and History missing Parachute

**Problem:** `parachute` is missing from the `META` object in `src/utils/activityLabels.ts`. `RANKED_ACTIVITY_IDS = Object.keys(META)` drives both the Leaderboard filter chips and History filter chips. Without an entry, Parachute results exist in storage but can't be filtered or ranked.

**Fix:** Add `parachute` to `META`:
```ts
parachute: { unit: 'm/s', lowerIsBetter: true, precision: 2 },
```
The unit is `m/s` (final velocity — lower is better since the goal is to minimize landing speed). Precision 2 matches the velocity calculation output.

**Files:**
- `src/utils/activityLabels.ts` — add the entry to `META`
- `src/utils/activityLabels.test.ts` — update the ranked-activity-ids assertion to include `'parachute'`

**Verify:** Leaderboard shows a "Parachute" chip; History shows a "Parachute" filter; existing parachute results appear in both.

---

### Fix 3 — Background Task Status register error

**Problem:** The "Register Task" button in Settings throws an error and shows a raw error alert. In Expo Go this is expected (documented limitation), but even in a dev build / APK the error message is unfriendly. The UI should handle this gracefully.

**Fix:** Wrap the register/unregister handlers with a user-friendly error message and disable the section when unavailable:
1. In `SettingsScreen.tsx`, when `bgStatus?.available === false` (OS denied or restricted), show a hint text explaining background tasks aren't available on this device/build instead of letting the user tap Register and get an error
2. Change the error alert messages from raw error text to friendly messages like "Background tasks are not available in this app build. Use a development build to enable this feature."
3. Disable the Register button when `bgStatus?.available === false` (in addition to the existing `registered === true` check)

**Files:**
- `src/screens/settings/SettingsScreen.tsx`

**Verify:** In Expo Go / APK where background fetch is unavailable, the Register button is disabled and a friendly hint shows instead of crashing.

---

### Fix 4 — Dark mode text visibility

**Problem:** `SoundRunScreen`, `ReactionRunScreen`, and `BreathingRunScreen` use hardcoded hex colors in their `StyleSheet.create` (e.g. `#111827` for text, `#6b7280` for hints, `#f9fafb` / `#fff` for backgrounds, `#2563eb` for primary). In dark mode these are invisible or unreadable because the background switches to dark but text stays near-black or backgrounds stay white.

**Fix:** Migrate these three screens to the `useTheme()` + `fontScale` pattern (same migration done for Parachute/HandFan/Earthquake in the app-polish sprint Phase D):
1. Replace `StyleSheet.create({...})` with `makeStyles(colors, fontScale)` factory pattern
2. Swap every hardcoded hex with the appropriate theme token (`colors.text`, `colors.textMuted`, `colors.background`, `colors.surface`, `colors.primary`, `colors.border`, etc.)
3. Swap fixed `fontSize` values with `baseFont.* * fontScale`
4. No layout changes — only color and font-size sources change

**Files:**
- `src/screens/activity/sound/SoundRunScreen.tsx`
- `src/screens/activity/reaction/ReactionRunScreen.tsx`
- `src/screens/activity/breathing/BreathingRunScreen.tsx`

**Verify:** Each screen is readable in both light and dark mode. Large-text toggle scales all fonts. No layout regressions.

---

### Fix 5 — Home page bottom looks empty

**Problem:** Below the Recent Activity card, the HomeScreen only shows a small "Tap any card to explore" hint. The bottom half of the screen feels hollow, especially for new users with no results.

**Fix:** Add two new sections below the Recent Activity card:
1. **Activity Progress** — a simple progress bar or indicator showing "X of 7 activities completed" based on distinct `activityId` values in saved results. Shows which activities have been tried (filled dots/icons) and which haven't.
2. **Tip Card** — a motivational/informational card that rotates tips like:
   - "Try all 7 activities to complete your STEMM journey!"
   - "Run activities in different locations for GPS-tagged results"
   - "Rate and comment on activities to record your team's reflections"

Both sections use existing theme tokens and `fontScale`. No new dependencies.

**Files:**
- `src/screens/home/HomeScreen.tsx` — add the two sections
- No new component files needed — keep it inline in HomeScreen (simple enough)

**Verify:** HomeScreen bottom shows progress + tip. Updates after saving a new result. Looks good in light/dark mode.

---

## Execution Order

Prioritized by dependency and risk:

1. **Fix 2** (Parachute in META) — 2-minute edit, unblocks nothing but lowest risk
2. **Fix 1** (Sound/Reaction/Earthquake save flow) — medium effort, removes debug code
3. **Fix 3** (Background task error UX) — small, isolated
4. **Fix 4** (Dark mode migration) — medium effort, purely cosmetic
5. **Fix 5** (Home page bottom) — new UI, highest creative effort

After each fix: `npx tsc --noEmit` must stay clean, `npm test` must stay green.

---

## Out of Scope

- No new screens, no new navigation routes
- No storage/schema changes
- No new dependencies
- No changes to ResultSummaryScreen, TeamContext, Firebase services, or SQLite
- No i18n for the tip card (English-only for now, matches Device Status / Background Task pattern)
- No changes to Parachute/HandFan/Performance RunScreens (already correct)
