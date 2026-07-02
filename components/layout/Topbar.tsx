'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { RiLogoutBoxLine, RiUser3Line, RiArrowDownSLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function Topbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success('Signed out');
      router.push('/');
    } catch {
      toast.error('Failed to sign out');
    }
  }

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="md:ml-0 ml-12">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome{user?.displayName ? `, ${user.displayName}` : ''}
        </h2>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-all"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <RiUser3Line className="w-4 h-4 text-indigo-400" />
            </div>
          )}
          <span className="hidden sm:block text-sm text-foreground">{user?.displayName || user?.email}</span>
          <RiArrowDownSLine className={`w-4 h-4 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-2xl py-1 z-50">
            <button
              onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <RiUser3Line className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface-hover transition-colors"
            >
              <RiLogoutBoxLine className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
