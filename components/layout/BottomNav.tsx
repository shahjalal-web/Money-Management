'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RiHome5Line, RiHome5Fill, RiFileList3Line, RiFileList3Fill, RiHandCoinLine, RiHandCoinFill, RiMenuLine, RiAddLine } from 'react-icons/ri';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: RiHome5Line, activeIcon: RiHome5Fill },
  { href: '/transactions', label: 'History', icon: RiFileList3Line, activeIcon: RiFileList3Fill },
  null, // centre "+" button
  { href: '/loans', label: 'Loans', icon: RiHandCoinLine, activeIcon: RiHandCoinFill },
];

// Thumb-reachable navigation for phones; hidden from md up where the sidebar shows
export default function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      <div className="grid grid-cols-5 h-16">
        {TABS.map((tab) => {
          if (!tab) {
            return (
              <div key="new" className="flex items-center justify-center">
                <Link
                  href="/transactions/new"
                  aria-label="New transaction"
                  className="-mt-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
                >
                  <RiAddLine className="w-7 h-7" />
                </Link>
              </div>
            );
          }
          const active = pathname === tab.href;
          const Icon = active ? tab.activeIcon : tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors', active ? 'text-indigo-400' : 'text-muted')}
            >
              <Icon className="w-6 h-6" />
              {tab.label}
            </Link>
          );
        })}
        <button onClick={onMore} className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted">
          <RiMenuLine className="w-6 h-6" />
          More
        </button>
      </div>
    </nav>
  );
}
