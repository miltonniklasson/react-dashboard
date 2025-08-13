// User Firestore service (guidelines: thin wrappers, typed, error normalization)
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { FirestoreDataConverter } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '@config/firebase';
import { createAppError, toAppError, type AppError, isFirestoreNotInitialized } from '@lib/errors';
import { isFirestoreAvailable, markFirestoreUnavailable } from '@lib/firestoreStatus';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string | null;
  createdAt: Date | null; // Firestore server timestamp becomes Date after converter
}

// Firestore converter for type safety & transformation
const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(profile: UserProfile) {
    return {
      email: profile.email,
      displayName: profile.displayName ?? null,
  createdAt: profile.createdAt ?? serverTimestamp()
    };
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      email: data.email as string,
      displayName: (data.displayName as string | null) ?? null,
  createdAt: data.createdAt ? (data.createdAt.toDate?.() ?? data.createdAt) : null
    };
  }
};

const usersCol = collection(db, 'users').withConverter(userProfileConverter);

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  if (!isFirestoreAvailable()) return null;
  try {
    const ref = doc(usersCol, id);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    const appError = toAppError(e, {
      code: 'FIRESTORE_READ_FAILED',
      message: `Failed to read user profile ${id}`,
      userMessage: 'Could not load user profile.',
      domain: 'FIRESTORE'
    });
    if (isFirestoreNotInitialized(appError)) {
      markFirestoreUnavailable(appError.message);
      return null; // graceful null until Firestore enabled
    }
    throw appError;
  }
}

export async function ensureUserProfile(user: FirebaseUser): Promise<UserProfile> {
  if (!isFirestoreAvailable()) {
    return {
      id: user.uid,
      email: user.email || 'unknown',
      displayName: user.displayName ?? null,
      createdAt: null
    };
  }
  try {
    const existing = await getUserProfile(user.uid);
    if (existing) return existing;
    const profile: UserProfile = {
      id: user.uid,
      email: user.email || 'unknown',
      displayName: user.displayName ?? null,
  createdAt: null // will be set by serverTimestamp converter
    };
    const ref = doc(usersCol, user.uid);
    await setDoc(ref, profile);
    const created = await getUserProfile(user.uid);
    if (!created) {
      throw createAppError({
        code: 'FIRESTORE_CREATE_INCONSISTENT',
        message: `User profile ${user.uid} creation not persisted`,
        userMessage: 'Profile creation inconsistent.',
        domain: 'FIRESTORE'
      });
    }
    return created;
  } catch (e) {
    const appError = toAppError(e, {
      code: 'FIRESTORE_CREATE_FAILED',
      message: `Failed to create user profile ${user.uid}`,
      userMessage: 'Could not initialize your profile.',
      domain: 'FIRESTORE'
    });
    if (isFirestoreNotInitialized(appError)) {
      markFirestoreUnavailable(appError.message);
      return {
        id: user.uid,
        email: user.email || 'unknown',
        displayName: user.displayName ?? null,
        createdAt: null
      };
    }
    throw appError;
  }
}

export async function updateUserProfile(id: string, data: Partial<Pick<UserProfile, 'displayName'>>): Promise<UserProfile> {
  // kept for backward compatibility; prefer updateUserProfilePartial for new fields
  if (!isFirestoreAvailable()) {
    throw createAppError({
      code: 'FIRESTORE_NOT_INITIALIZED',
      message: 'Firestore not initialized; cannot update profile',
      userMessage: 'Profile storage not ready yet.',
      domain: 'FIRESTORE'
    });
  }
  try {
    const ref = doc(usersCol, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw createAppError({
        code: 'FIRESTORE_NOT_FOUND',
        message: `User profile ${id} not found`,
        userMessage: 'Profile not found.',
        domain: 'FIRESTORE'
      });
    }
    await updateDoc(ref, {
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {})
    });
    const updated = await getDoc(ref);
    return updated.data() as UserProfile; // converter applied
  } catch (e) {
    throw toAppError(e, {
      code: 'FIRESTORE_UPDATE_FAILED',
      message: `Failed to update user profile ${id}`,
      userMessage: 'Could not update profile.',
      domain: 'FIRESTORE'
    });
  }
}

export async function updateUserProfilePartial(id: string, data: Partial<UserProfile>): Promise<void> {
  if (!isFirestoreAvailable()) return; // silently ignore if Firestore disabled
  try {
    const ref = doc(usersCol, id);
    await updateDoc(ref, data as any);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[userProfile] partial update failed', e);
  }
}

// Example of a result wrapper usage if preferred in UI layer
export async function safeGetUserProfile(id: string): Promise<{ ok: true; data: UserProfile | null } | { ok: false; error: AppError }> {
  try {
    const data = await getUserProfile(id);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: toAppError(e, { code: 'FIRESTORE_READ_FAILED', message: 'Read failed' }) };
  }
}
