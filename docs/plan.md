● I'll start by reading the project files to understand the context.

  Read 2 files (ctrl+o to expand)
  ⎿  Loaded docs\CLAUDE.md
                                                   
● Read both. Here's the analysis — no code, just plan.

  ---
  1. App Architecture Plan

  A single-process Expo app with local-first storage. No backend in MVP.

  Layers
  - UI — React Native screens + small reusable components (Button, Card, DataTable, SensorReadout)
  - Navigation — React Navigation: a Stack for onboarding, a Bottom Tab for the main app, Stack inside each tab for activity flows
  - State — React Context only (TeamContext, ThemeContext, SettingsContext). No Redux/Zustand — overkill for a beginner submission
  - Persistence — AsyncStorage for team + attempts + leaderboard; expo-file-system for any captured media
  - Device APIs — wrapped in custom hooks: useAccelerometer, useDecibelMeter, useTimer, useLocation, useHaptics
  - Theme + accessibility — one theme object, font-scale toggle for "poor eyesight" mode

  Why this shape: every activity = "instructions → run with sensor → enter data → save attempt → show result." That's one template you'll fill in 7 times, which
  keeps your code volume small and consistent for marking.

  ---
  2. Screen List

  Onboarding (Stack)
  - Welcome / Splash
  - Team Setup (name → members → grade → auto discriminator → confirm)

  Main App (Bottom Tabs: Home, Leaderboard, Profile, Settings)
  - Home — Activity Catalogue (cards for the 7 activities)
  - Leaderboard — local team scores per activity
  - Team Profile — team info + attempt history
  - Settings — theme toggle, large-text toggle, reset team

  Per-Activity (Stack inside Home tab, one route per activity)
  - Activity Detail / Instructions (with curriculum link + equipment list)
  - Activity Run (sensor view + timer + data entry table)
  - Activity Results (calculated outputs + rating + comment + save)
  - Attempt History (list of past attempts for that activity)

  That's ~6 generic screens + 7 activity routes. The activity routes can share one templated screen with config per activity.

  ---
  3. Folder Structure

  STEMMLab/
  ├── App.tsx
  ├── app.json
  ├── tsconfig.json
  ├── src/
  │   ├── navigation/          # RootNavigator, TabNavigator, ActivityStack
  │   ├── screens/
  │   │   ├── onboarding/      # WelcomeScreen, TeamSetupScreen
  │   │   ├── home/            # HomeScreen (catalogue)
  │   │   ├── leaderboard/
  │   │   ├── profile/
  │   │   ├── settings/
  │   │   └── activities/
  │   │       ├── _shared/     # ActivityInstructions, ActivityResults, AttemptHistory
  │   │       ├── sound/       # SoundActivityScreen
  │   │       ├── reaction/    # ReactionActivityScreen
  │   │       ├── earthquake/  # EarthquakeActivityScreen
  │   │       ├── parachute/   # (placeholder until Phase 5)
  │   │       ├── handfan/     # (placeholder)
  │   │       ├── performance/ # (placeholder)
  │   │       └── breathing/   # (placeholder)
  │   ├── components/          # Button, Card, DataTable, SensorBar, RatingStars
  │   ├── contexts/            # TeamContext, ThemeContext, SettingsContext
  │   ├── hooks/               # useAccelerometer, useDecibelMeter, useTimer, useLocation
  │   ├── storage/             # team.ts, attempts.ts, leaderboard.ts (AsyncStorage wrappers)
  │   ├── data/                # activities.ts (static metadata for all 7)
  │   ├── types/               # Team.ts, Attempt.ts, Activity.ts
  │   ├── theme/               # colors.ts, spacing.ts, typography.ts
  │   ├── utils/               # calculations.ts, formatters.ts, idGenerator.ts
  │   └── assets/              # images, icons
  └── docs/

  Flat and predictable. No services/, repositories/, or features/ layers — those add ceremony you don't need yet.

  ---
  4. Phased Development Roadmap

  ┌────────────────────────────────────────────┬────────────────────────────────────────────────────────────┬───────────────────────────────────────────────┐
  │                   Phase                    │                            Goal                            │                Why this order                 │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 0. Setup                                   │ Init Expo + TS, install deps, set up navigation skeleton,  │ Everything depends on this                    │
  │                                            │ theme + types                                              │                                               │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 1. Onboarding + Shell                      │ Welcome → Team Setup → save team to AsyncStorage → tabs    │ Proves persistence + navigation work          │
  │                                            │ visible                                                    │ end-to-end                                    │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 2. First Activity (Sound Pollution Hunter) │ Mic/dB meter + data table + save attempt                   │ Simplest sensor; defines the activity         │
  │                                            │                                                            │ template                                      │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 3. Second Activity (Reaction Board – tap   │ Tap timing + stats                                         │ No hardware; reuses the template; builds      │
  │ phase only)                                │                                                            │ confidence                                    │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 4. Third Activity (Earthquake-Resistant)   │ Accelerometer + vibration trigger                          │ Adds a second sensor type, completes "sensor  │
  │                                            │                                                            │ variety" story                                │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 5. Leaderboard + History + Profile         │ Local scoring, attempt list, team view                     │ Now there's data to display                   │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 6. Polish                                  │ Light/dark theme, large-text mode, empty states, loading   │ Submission readiness                          │
  │                                            │ states, error handling                                     │                                               │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 7. Stretch (only if time allows)           │ One camera-based activity (Hand Fan with manual angle      │ Optional impressiveness                       │
  │                                            │ entry first), GPS tagging                                  │                                               │
  ├────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
  │ 8. Submission Prep                         │ README, screenshots, demo video, EAS build, final test     │ Required for marking                          │
  │                                            │ pass                                                       │                                               │
  └────────────────────────────────────────────┴────────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘

  Each phase ends with a working app you could demo. If time runs out at any point, you still have something submission-ready.

  ---
  5. Safest MVP Scope for Submission

  In scope (must work)
  - Full onboarding → team saved
  - Activity catalogue showing all 7 cards
  - 3 fully working activities, each demonstrating a different capability:
    a. Sound Pollution Hunter — microphone
    b. Reaction Board (Phase 1: dominant-hand tap only) — UI/timing
    c. Earthquake-Resistant Structure — accelerometer + vibration
  - Save attempts locally; show in attempt history
  - Local leaderboard (sort completed attempts by score per activity)
  - Team profile screen
  - Light/dark theme + large-text accessibility toggle
  - Settings screen with reset team

  Marked "Coming Soon" in the UI (still appear in catalogue)
  - Parachute Drop (slow-mo video is the riskiest feature — defer)
  - Hand Fan (camera angle measurement is hard)
  - Human Performance Lab
  - Breathing Pace Trainer (signal processing)
  - Reaction Board Phases 2 & 3

  Explicitly out of scope
  - Backend / cloud sync / cross-device leaderboard
  - Auth
  - Slow-motion video analysis
  - Real-time multiplayer

  Why this is safe: you ship a polished, complete experience for 3 activities covering 3 distinct sensor categories — that demonstrates the full breadth of the
  spec without the riskiest features. The "Coming Soon" cards show the marker you understood the full scope; they aren't broken features, they're a planned
  roadmap.

  ---
  Want me to start Phase 0 (project init + folder scaffold), or refine any section first?

● Ran 1 stop hook (ctrl+o to expand)
  ⎿  Stop hook error: Failed with non-blocking status code: /usr/bin/bash: line 1: uv: command not found
