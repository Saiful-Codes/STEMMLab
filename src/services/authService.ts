import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';

export type AuthUser = User;

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  return cred.user;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function getCurrentUser(): AuthUser | null {
  return auth.currentUser;
}

export function listenToAuthChanges(
  callback: (user: AuthUser | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback, (err) => {
    console.warn('[authService] onAuthStateChanged error:', err);
  });
}

// Map Firebase auth error codes to short, kid-friendly messages.
// Codes: https://firebase.google.com/docs/auth/admin/errors
export function getFriendlyAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return "That doesn't look like a valid email.";
    case 'auth/missing-email':
      return 'Please enter an email.';
    case 'auth/missing-password':
      return 'Please enter a password.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/user-not-found':
      return 'No account found with that email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
