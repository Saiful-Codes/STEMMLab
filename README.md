# STEMM Lab

A mobile application that turns real-world STEMM (Science, Technology, Engineering, Mathematics, and Medicine) activities into game-based learning challenges for upper primary and lower high school students.

Students form teams, complete hands-on experiments, record data, and analyse outcomes — all from their mobile devices.

## Activities

| Activity | Domain | Status |
|----------|--------|--------|
| Parachute Drop Challenge | Engineering + Physics | Available |
| Sound Pollution Hunter | Environmental Science | Available |
| Hand Fan Challenge | Physics — Air Movement | Available |
| Earthquake-Resistant Structure | Engineering + Earth Science | Available |
| Reaction Board Challenge | Neuroscience + Mathematics | Available |
| Human Performance Lab | Medical Science + Biomechanics | Coming Soon |
| Breathing Pace Trainer | Medical Science | Coming Soon |

Each available activity includes a detail screen (introduction, objectives, materials, instructions, interpreting results), a run screen for data entry and calculations, and a result screen with analysis and optional science deep dives.

## Features

- **Team onboarding** — enter team name, member first names, and grade level; the app assigns a team discriminator
- **Activity catalogue** — browse activities by category (Engineering / Health), with available and coming soon sections
- **Data recording** — form-based data entry with validation, expandable trial cards, and auto-calculated physics results
- **Result analysis** — hero stats, comparison tables, and collapsible science explanations (e.g. F ≈ k · θ force calculations)
- **Leaderboard** — ranked team results per activity
- **Attempt history** — view past attempts with timestamps
- **Multilingual** — English, Spanish, Arabic, and Chinese (with text-to-speech support)
- **Light / dark theme** — with font scaling for accessibility
- **Firebase auth and sync** — anonymous authentication with Firestore cloud backup
- **Local-first storage** — SQLite + AsyncStorage for offline use

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation (native stack + bottom tabs) |
| Local storage | AsyncStorage + expo-sqlite |
| Cloud | Firebase Auth + Firestore |
| Sensors | expo-sensors (accelerometer), expo-audio (microphone) |
| Charts | react-native-gifted-charts |
| i18n | Custom translation system (4 languages) |
| TTS | expo-speech |

## Project Structure

```
src/
├── context/           # Theme, language, and team providers
├── components/        # Shared UI components
├── data/              # Activity registry
├── i18n/              # Translation strings (en, es, ar, zh)
├── navigation/        # Root navigator, tab bar, activity stack
├── screens/
│   ├── activity/      # Activity list, detail, run, and result screens
│   │   ├── earthquake/
│   │   ├── handfan/
│   │   ├── parachute/
│   │   ├── reaction/
│   │   └── sound/
│   ├── auth/          # Firebase authentication
│   ├── common/        # Result summary (shared save flow)
│   ├── history/       # Attempt history
│   ├── home/          # Home dashboard
│   ├── leaderboard/   # Team rankings
│   ├── onboarding/    # Welcome + team setup
│   └── settings/      # Theme, language, font size
├── services/          # Firebase, background tasks, battery
├── storage/           # AsyncStorage + SQLite persistence
├── theme/             # Colour tokens and font scales
├── types/             # Shared TypeScript types
└── utils/             # Physics calculations, activity labels, result formatting
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (or an emulator)

### Setup

```bash
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or `w` for web. Alternatively, scan the QR code with Expo Go.

## Author

**Saiful Islam**
Bachelor of Computer Science (AI Major) — La Trobe University
