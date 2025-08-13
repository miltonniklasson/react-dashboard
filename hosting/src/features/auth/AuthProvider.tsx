import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@config/firebase";
import { ensureUserProfile } from "@services/users";
import type { UserProfile } from "@services/users";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@config/firebase";
import { isFirestoreAvailable } from "@lib/firestoreStatus";
import { log } from "@lib/errors";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let profileUnsub: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = undefined;
      }
      setUser(u);
      if (u) {
        try {
          const p = await ensureUserProfile(u);
          setProfile(p);
        } catch (e) {
          // eslint-disable-next-line no-console
          log({ event: "auth.ensure_profile_failed", level: "warn", error: e });
          setProfile(null);
        }
        if (isFirestoreAvailable()) {
          profileUnsub = onSnapshot(
            doc(db, "users", u.uid),
            (snap) => {
              if (snap.exists()) {
                const data: any = snap.data();
                setProfile((prev) => ({
                  id: u.uid,
                  email: data.email ?? prev?.email ?? u.email ?? "unknown",
                  displayName: data.displayName ?? null,
                  createdAt:
                    (data.createdAt && data.createdAt.toDate?.()) ||
                    prev?.createdAt ||
                    null,
                }));
              }
            },
            (err) => {
              // eslint-disable-next-line no-console
              log({
                event: "auth.profile_snapshot_error",
                level: "warn",
                error: err,
              });
            }
          );
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
