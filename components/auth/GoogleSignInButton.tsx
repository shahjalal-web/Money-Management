'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

// Firebase error codes worth explaining in plain words
const GOOGLE_ERRORS: Record<string, string> = {
  'auth/unauthorized-domain':
    'Google sign-in is not enabled for this website address yet. Add this domain in Firebase → Authentication → Settings → Authorized domains.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a password. Sign in with email and password instead.',
};

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      // These are not real errors — user closed popup or another popup was already open
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      const message = (code && GOOGLE_ERRORS[code])
        || (err instanceof Error ? err.message : 'Failed to sign in with Google');
      toast.error(message, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  // Fixed light styling (Google's standard button): the auth pages always use a dark
  // background, so theme colors like text-foreground can end up dark-on-dark
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-white text-slate-800 font-semibold border border-white shadow-sm hover:bg-slate-100 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a1a] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" aria-hidden />
      ) : (
        <FcGoogle className="w-5 h-5" aria-hidden />
      )}
      {loading ? 'Connecting…' : 'Continue with Google'}
    </button>
  );
}
