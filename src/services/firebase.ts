import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config is read from environment variables defined in .env.
// In Expo, any variable prefixed with EXPO_PUBLIC_ is inlined into the JS
// bundle at build time and exposed via process.env. See .env.example for
// the full list of variables — copy that file to .env and fill in the real
// values from Firebase Console → Project settings → Your apps → SDK setup
// and configuration → Config.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// One-time dev diagnostic so missing env vars surface clearly instead of as
// opaque "auth/internal-error" or Firestore failures at first use. Does not
// change runtime behaviour — Firebase still initialises and throws naturally.
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];
const missingConfigKeys = requiredConfigKeys.filter((k) => !firebaseConfig[k]);
if (missingConfigKeys.length > 0) {
  console.warn(
    '[firebase] Missing config values:',
    missingConfigKeys.join(', '),
    '— check EXPO_PUBLIC_FIREBASE_* in .env'
  );
}

// Initialize Firebase exactly once. Fast Refresh / re-imports would otherwise
// throw "Firebase App named '[DEFAULT]' already exists".
let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.error('[firebase] initializeApp failed:', err);
  throw err;
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;
