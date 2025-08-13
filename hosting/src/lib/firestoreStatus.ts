// Tracks Firestore availability to avoid spamming failing requests when not yet enabled.

let unavailableReason: string | null = null;

export function markFirestoreUnavailable(reason: string) {
  if (!unavailableReason) unavailableReason = reason; // first reason wins
}

export function isFirestoreAvailable(): boolean {
  return unavailableReason === null;
}

export function getFirestoreUnavailableReason(): string | null {
  return unavailableReason;
}
