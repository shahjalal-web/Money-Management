'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

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
      if (
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user'
      ) {
        setLoading(false);
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FcGoogle className="w-5 h-5" />
      {loading ? 'Connecting...' : 'Continue with Google'}
    </button>
  );
}
