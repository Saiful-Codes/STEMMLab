# STEMM Lab – Progress

## Current Status
Phase 1 completed successfully.

## Completed Work
- Phase 0: Expo + TypeScript project initialised, git set up (main + dev branches)
- Phase 1: Navigation and App Shell
  - Installed React Navigation (native, native-stack, bottom-tabs) + react-native-screens + react-native-safe-area-context
  - Created `src/` folder structure (navigation, screens, data, types)
  - Onboarding stack: Welcome → TeamSetup
  - Bottom tabs: Home, Leaderboard, Profile, Settings
  - Placeholder screens only (no logic, no storage)
  - Activity data file with all 7 STEMM activities
  - `App.tsx` wired with SafeAreaProvider + NavigationContainer + RootNavigator
  - TypeScript type-check passes

## Current Phase
Phase 2 – First Activity (Sound Pollution Hunter)

## Next Tasks
- Build the Activity Catalogue UI on HomeScreen (cards from `src/data/activities.ts`)
- Add activity Stack inside Home tab (Detail / Run / Results)
- Microphone / dB meter hook
- Data entry table for Sound Pollution Hunter
- Local persistence of attempts (introduce AsyncStorage)

## Rules (IMPORTANT)
- Build step-by-step
- Do NOT over-engineer
- Do NOT add backend
- Keep code simple and clean

## Notes
- Using Claude Code for guided development
- Local-first app (AsyncStorage starts in Phase 2)
