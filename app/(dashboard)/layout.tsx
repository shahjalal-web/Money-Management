'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState({ open: false, path: pathname });
  // Close the mobile drawer on navigation (derived, no effect needed)
  const mobileOpen = drawer.open && drawer.path === pathname;

  // The auth cookie can outlive the Firebase session (or come from another app on
  // localhost); without a user, send them to login instead of a blank page
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    // dvh: on phones 100vh is taller than the visible area while the URL bar shows
    <div className="flex h-dvh bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setDrawer({ open: false, path: pathname })} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        {/* Bottom padding clears the mobile bottom nav (+ the iPhone home indicator) */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav onMore={() => setDrawer({ open: true, path: pathname })} />
    </div>
  );
}
