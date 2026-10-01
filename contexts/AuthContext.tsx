'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { apiPost, apiPut } from '@/lib/api';
import { setApiCacheUser } from '@/lib/useApi';
import type { User as UserProfile } from '@/types';

interface ProfileUpdate {
  displayName?: string;
  defaultCurrency?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  /** The app's user record (default currency etc.); null until the first sync finishes */
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function setAuthCookie() {
  document.cookie = `firebase-auth-token=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = 'firebase-auth-token=; path=/; max-age=0; SameSite=Lax';
}

async function syncUser(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
  try {
    return await apiPost<UserProfile>('/auth/sync', {
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    });
  } catch {
    // non-critical: the API also creates the user on its first authenticated request
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Firebase mutates the same User object on profile changes; bump to re-render consumers
  const [, setVersion] = useState(0);

  const applySync = useCallback((firebaseUser: FirebaseUser) => {
    syncUser(firebaseUser).then((p) => {
      if (p && auth.currentUser?.uid === firebaseUser.uid) setProfile(p);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Scope cached API data to this user before any page renders with it
      setApiCacheUser(firebaseUser?.uid ?? null);
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthCookie();
        // Don't block the UI on the sync round-trip
        applySync(firebaseUser);
      } else {
        clearAuthCookie();
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [applySync]);

  async function signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    setAuthCookie();
    setUser(result.user);
  }

  async function signUp(email: string, password: string, displayName: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateFirebaseProfile(result.user, { displayName });
    setAuthCookie();
    setUser(result.user);
    // onAuthStateChanged synced before the name was set; sync again with it
    applySync(result.user);
  }

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    setAuthCookie();
    setUser(result.user);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setApiCacheUser(null);
    clearAuthCookie();
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function updateProfile(data: ProfileUpdate) {
    const updated = await apiPut<UserProfile>('/auth/profile', data);
    setProfile(updated);
    if (data.displayName !== undefined && auth.currentUser && auth.currentUser.displayName !== data.displayName) {
      await updateFirebaseProfile(auth.currentUser, { displayName: data.displayName });
      setVersion((v) => v + 1);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
