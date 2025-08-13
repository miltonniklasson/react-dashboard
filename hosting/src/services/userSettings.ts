import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@config/firebase';
import { isFirestoreAvailable } from '@lib/firestoreStatus';

export interface UserSettings {
  ui?: {
    scale?: number;
  };
  // future: notifications, theme, feature flags, etc.
  updatedAt?: any; // Firestore timestamp
}

const COL = 'userSettings';

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!isFirestoreAvailable()) return null;
  const ref = doc(db, COL, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserSettings) : null;
}

export async function ensureUserSettings(userId: string): Promise<UserSettings> {
  if (!isFirestoreAvailable()) return { ui: { scale: 1.25 } };
  const existing = await getUserSettings(userId);
  if (existing) return existing;
  const initial: UserSettings = { ui: { scale: 1.25 }, updatedAt: serverTimestamp() };
  await setDoc(doc(db, COL, userId), initial);
  return initial;
}

export async function updateUserSettings(userId: string, partial: Partial<UserSettings>): Promise<void> {
  if (!isFirestoreAvailable()) return;
  const ref = doc(db, COL, userId);
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() } as any);
}
