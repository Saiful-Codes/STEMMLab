import { Activity } from '../types/Activity';

export const activities: Activity[] = [
  {
    id: 'parachute',
    title: 'Parachute Drop Challenge',
    category: 'Engineering',
    domain: 'Engineering + Physics',
    shortDescription:
      'Design and test a parachute to minimise landing speed and impact force.',
    comingSoon: false,
    hasDetail: true,
  },
  {
    id: 'sound',
    title: 'Sound Pollution Hunter',
    category: 'Engineering',
    domain: 'Environmental Science',
    shortDescription:
      'Measure and compare sound levels across different actions and places.',
    comingSoon: false,
    hasDetail: true,
  },
  {
    id: 'handfan',
    title: 'Hand Fan Challenge',
    category: 'Engineering',
    domain: 'Physics – Air Movement',
    shortDescription:
      'Fan air at targets from set distances and record the bend angle.',
    comingSoon: false,
    hasDetail: true,
  },
  {
    id: 'earthquake',
    title: 'Earthquake-Resistant Structure',
    category: 'Engineering',
    domain: 'Engineering + Earth Science',
    shortDescription:
      'Build a vibration-absorbing platform; measure phone movement during a simulated quake.',
    comingSoon: false,
    hasDetail: true,
  },
  {
    id: 'performance',
    title: 'Human Performance Lab',
    category: 'Health',
    domain: 'Medical Science + Biomechanics',
    shortDescription:
      'Use accelerometer to measure smoothness during slow vs. fast movements.',
    comingSoon: true,
  },
  {
    id: 'reaction',
    title: 'Reaction Board Challenge',
    category: 'Health',
    domain: 'Neuroscience + Mathematics',
    shortDescription:
      'Test reaction time, coordination, and improvement across three phases.',
    comingSoon: false,
    hasDetail: true,
  },
  {
    id: 'breathing',
    title: 'Breathing Pace Trainer',
    category: 'Health',
    domain: 'Medical Science',
    shortDescription:
      'Use the accelerometer to measure breathing rate at rest and after exercise.',
    comingSoon: true,
  },
];
