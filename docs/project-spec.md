# STEMM Lab – Project Specification

## Overview

STEMM Lab is a mobile application that transforms real-world physical activities into game-based **Science, Technology, Engineering, Mathematics, and Medicine (STEMM)** learning experiences. Students use everyday materials and their surroundings to complete hands-on challenges while the app captures data via the phone's camera, sensors, GPS, timers, and analytics.

**Target audience:** Upper Primary School and lower High School students.

---

## App Onboarding / Start-Up

On first launch, collect the following team details:

| Field | Input Type | Notes |
|---|---|---|
| Team Name | Text | User-entered |
| First Name (each member) | Text (multiple) | One per member |
| Grade / Year Level | Text or Picker | |
| Team Discriminator | Auto-generated | Assigned by app |

---

## Core App Features (Global)

- **Video upload** per activity (slow-motion support required for some activities)
- **Results recording** and tabular data entry
- **Activity rating and comments**
- **GPS location tagging** on submission
- **Leaderboards** — team-based scoring/competition
- **Timed challenges** — 20-minute challenge windows
- **Iterative design prompts** — up to 3 prototype attempts per activity
- **Vibration sensor** access (accelerometer)
- **Microphone / audio sensor** access (decibel measurement)

---

## Activities

### Category 1: Engineering Challenges

---

#### Activity 1: Parachute Drop Challenge
**Domain:** Engineering + Physics

**Concept:** Students design, build, and test a parachute for a small toy to minimise landing speed and impact force. Up to 3 iterative designs tested within 20 minutes.

**Required equipment (user-provided):** Small toy, paper/plastic, string, scissors, tape, elevated surface.

**App functionality required:**
- Timer (drop timer + contact time for slow-motion analysis)
- Slow-motion video capture and upload
- Data entry table: prediction, drop time (first hit), stop time (slow-motion), correctness
- Results display: calculated velocity, acceleration, net force, drag force, G-force
- Differentiated output: simplified for Primary (time + final speed), extended for High School (full force calculations)

**Key calculations (app may assist or display):**
- Final velocity = distance / time
- Acceleration = Δv / t
- Net Force = mass × acceleration
- Weight = mass × 9.8
- Drag Force = Weight − Net Force
- G-force = Δv / t_contact ÷ 9.8 (both bounce and no-bounce cases)

**Curriculum links:** ACSSU076, ACSSU117, ACSIS124, ACSIS126, ACTDEP036, ACMMG108, ACMSP147

---

#### Activity 2: Sound Pollution Hunter
**Domain:** Environmental Science

**Concept:** Students measure and compare sound levels across different classroom actions and map loud/quiet zones.

**App functionality required:**
- Live decibel (dB) meter using device microphone
- GPS-tagged sound readings
- Data entry table: action, prediction, outcome (dB), correctness
- Display of reference dB risk table (safe vs. dangerous hearing exposure levels)

**Curriculum links:** ACSSU073, ACPPS053

---

#### Activity 3: Hand Fan Challenge
**Domain:** Physics – Air Movement

**Concept:** Students fan air at paper/cardboard targets from varying distances and record the bend angle to investigate force, flexibility, and material stiffness.

**App functionality required:**
- Camera-based angle measurement (bend angle in degrees), or manual entry
- Data entry table: fan design, predicted bend, outcome, observations
- Distance variations: 15 cm, 30 cm, 45 cm
- Optional: stiffness coefficient calculator (F ≈ k × θ)

**Curriculum links:** ACSSU076

---

#### Activity 4: Earthquake-Resistant Structure
**Domain:** Engineering + Earth Science

**Concept:** Students build a vibration-absorbing platform for the phone. The app's accelerometer measures movement while a simulated earthquake vibration plays through the device.

**App functionality required:**
- Vibration/shake mode — device vibrates as simulated "earthquake"
- Accelerometer reads phone movement (displacement in cm or mm)
- Data entry table: design description, predicted movement, actual movement, correctness

**Curriculum links:** ACSSU096, ACTDEP036

---

### Category 2: Health and Medical Sciences

---

#### Activity 5: Human Performance Lab – Stretch Speed & Gracefulness
**Domain:** Medical Science + Biomechanics

**Concept:** Students hold the phone and perform guided stretching movements. The accelerometer measures vibration/smoothness during slow vs. fast movements.

**App functionality required:**
- Live accelerometer/vibration sensor display
- Guided on-screen movement instructions (3 movement types shown)
- Vibration feedback mode (optional haptic feedback during movement)
- Data entry table: attempt, predicted vibration, outcome (time + movement magnitude), correctness
- Group reflection upload

**Curriculum links:** ACPPS051, ACPPS054, ACSSU176

---

#### Activity 6: Reaction Board Challenge
**Domain:** Neuroscience + Mathematics

**Concept:** Students test reaction time, coordination, and improvement across 3 phases: dominant hand tap, non-dominant hand tap, and tracing challenge.

**App functionality required:**
- **Phase 1 – Tap Reaction:** Hidden button appears; tap as fast as possible. Record reaction time (ms).
- **Phase 2 – Swap Hands:** Repeat Phase 1 with non-dominant hand.
- **Phase 3 – Tracing Challenge:** On-screen moving shape; trace it. Record accuracy and delay.
- Rotate through team members (multi-player session within same team)
- Data entry table: attempt, predicted time, actual time, correctness
- Statistics display: average, best, comparison between dominant/non-dominant

**Curriculum links:** ACSIS130, ACMSP147, ACPPS057

---

#### Activity 7: Breathing Pace Trainer
**Domain:** Medical Science

**Concept:** Students place the phone on their chest. The accelerometer detects chest rise/fall to measure breathing rate at rest and after exercise.

**App functionality required:**
- Accelerometer-based breathing rate detection (breaths per minute)
- Two-phase recording: at rest and post-exercise
- Exercise prompts: 1-minute jog on spot, 100 star jumps
- Rotate through team members
- Data entry table: condition, predicted BPM, actual outcome, correctness
- Visual graph of breathing pattern over time

**Curriculum links:** ACSSU176, ACPPS054

---

## Technical Requirements Summary

| Sensor / Feature | Used In |
|---|---|
| Camera (standard + slow-motion) | Activity 1, 5 |
| Microphone (dB meter) | Activity 2 |
| Accelerometer / Vibration sensor | Activities 4, 5, 7 |
| GPS | All activities (location tagging) |
| Timer | Activities 1, 6, 7 |
| Video upload | Activities 1, 5 |
| On-screen interactive UI (tap, trace) | Activity 6 |
| Leaderboard / scoring | All activities |
| Team session / multi-player | All activities |

---

## Data Model (High-Level)

- **Team:** teamName, members[], gradeLevel, discriminator
- **Activity Session:** activityId, teamId, timestamp, gpsLocation, attempts[]
- **Attempt:** attemptNumber, predictions, outcomes, videoUrl, notes, rating
- **Leaderboard entry:** teamId, activityId, score, timestamp

---

## Notes for Development

- App should support **offline data entry** with sync on reconnect (students may be in areas with limited connectivity).
- Differentiate UI/instructions by **year level** where relevant (Primary vs. High School views).
- Slow-motion video analysis for Activity 1 is critical — ensure the video player supports frame-by-frame scrubbing or auto-extracts contact time.
- Activity 4's "vibration mode" requires the app to programmatically trigger device vibration in a controlled, sustained pattern.
- Activity 7's breathing detection via accelerometer will require signal processing (smoothing, peak detection) to count breaths per minute reliably.
