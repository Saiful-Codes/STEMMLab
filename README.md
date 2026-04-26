# STEMM Lab – Mobile Application

STEMM Lab is a mobile application designed to transform real-world STEMM (Science, Technology, Engineering, Mathematics, and Medicine) activities into engaging, game-based learning experiences for upper primary and lower high school students.

The app allows students to complete hands-on challenges, record results, and analyse outcomes using their mobile devices.

---

## Current Features 

### Activity Catalogue
- Displays a list of STEMM activities
- Includes 7 activities defined in the project specification

### Activity Flow
- Users can navigate through:
  - Activity Detail Screen
  - Activity Run Screen
  - Activity Results Screen

### Implemented Activity
**Sound Pollution Hunter**
- Users manually input sound level data (dB)
- Multiple entries can be recorded per activity
- Results are displayed with basic statistics

### Data Persistence
- Activity attempts are stored locally using AsyncStorage
- Data remains available after app restart

---

## Tech Stack

- React Native (Expo)
- TypeScript
- React Navigation (Stack + Bottom Tabs)
- AsyncStorage (local data persistence)

---

## How to Run the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on:
   - Android Emulator (`a`)
   - iOS Simulator (`i`)
   - Web (`w`)
   - Or scan QR code using Expo Go

---

##  Project Structure (Simplified)

```
src/
├── navigation/       # App navigation (stack + tabs)
├── screens/          # App screens (onboarding, activity, etc.)
├── data/             # Static activity data
├── types/            # TypeScript types
├── storage/          # AsyncStorage logic
```
---

## Notes
    - This project is built incrementally in phases.
    - Phase 2 focuses on core app flow and one fully implemented activity.
    - Sensor-based features (e.g., microphone input) will be implemented in later phases.

---

## Author
Saiful Islam

Bachelor of Computer Science (AI Major)

La Trobe University