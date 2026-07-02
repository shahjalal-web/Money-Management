'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { apiPostPublic } from '@/lib/api';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function setAuthCookie() {
  document.cookie = `firebase-auth-token=true; path=/; max-age=${60 * 60 * 24 * 7}`;
}

function clearAuthCookie() {
  document.cookie = 'firebase-auth-token=; path=/; max-age=0';
}

async function syncUser(firebaseUser: FirebaseUser) {
  try {
    await apiPostPublic('/auth/sync', {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    });
  } catch {
    // non-critical
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthCookie();
        await syncUser(firebaseUser);
      } else {
        clearAuthCookie();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    setAuthCookie();
    setUser(result.user);
    await syncUser(result.user);
  }

  async function signUp(email: string, password: string, displayName: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    setAuthCookie();
    setUser(result.user);
    await syncUser(result.user);
  }

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    setAuthCookie();
    setUser(result.user);
    await syncUser(result.user);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    clearAuthCookie();
    setUser(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
