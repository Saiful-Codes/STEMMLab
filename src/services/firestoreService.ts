import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';
import { Team } from '../types/Team';
import { Result } from '../types/Result';

// Collection layout
//   teams/{userId}                — one team document per signed-in user
//   activityResults/{result.id}   — one document per local Result, keyed by its
//                                   local id so re-syncs are idempotent
//
// Records carry an explicit `userId` field so activityResults can be filtered
// with `where('userId', '==', uid)` without needing the doc id to encode it.

function requireUid(): string {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Not signed in. Please sign in to use cloud features.');
  }
  return user.uid;
}

export async function saveTeamToFirestore(teamData: Team): Promise<void> {
  const uid = requireUid();
  const ref = doc(db, 'teams', uid);
  await setDoc(
    ref,
    {
      ...teamData,
      userId: uid,
      syncedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getTeamFromFirestore(userId: string): Promise<Team | null> {
  const ref = doc(db, 'teams', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    name: String(data.name ?? ''),
    members: Array.isArray(data.members) ? (data.members as string[]) : [],
    grade: String(data.grade ?? ''),
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

export async function saveActivityResultToFirestore(
  resultData: Result
): Promise<void> {
  const uid = requireUid();
  const ref = doc(db, 'activityResults', resultData.id);
  await setDoc(ref, {
    ...resultData,
    userId: uid,
    syncedAt: serverTimestamp(),
  });
}

export async function getActivityResultsFromFirestore(
  userId: string
): Promise<Result[]> {
  const q = query(
    collection(db, 'activityResults'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const results: Result[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: typeof data.id === 'string' ? data.id : d.id,
      activityId: String(data.activityId ?? ''),
      teamName: String(data.teamName ?? ''),
      members: Array.isArray(data.members) ? (data.members as string[]) : [],
      result: (data.result as number | string) ?? '',
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : 0,
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      comment: typeof data.comment === 'string' ? data.comment : undefined,
    };
  });
  // Sort newest-first client-side to avoid needing a composite index.
  return results.sort((a, b) => b.timestamp - a.timestamp);
}
