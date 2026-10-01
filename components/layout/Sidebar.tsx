'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  RiDashboardLine, RiExchangeDollarLine, RiWalletLine,
  RiPriceTag3Line, RiSettings4Line, RiMoneyDollarCircleLine,
  RiMenuFoldLine, RiMenuUnfoldLine, RiAddCircleLine, RiHandCoinLine, RiCloseLine,
} from 'react-icons/ri';

export const navItems = [
  { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { href: '/transactions/new', icon: RiAddCircleLine, label: 'New Transaction' },
  { href: '/transactions', icon: RiExchangeDollarLine, label: 'Transactions' },
  { href: '/loans', icon: RiHandCoinLine, label: 'Loans' },
  { href: '/accounts', icon: RiWalletLine, label: 'Accounts' },
  { href: '/categories', icon: RiPriceTag3Line, label: 'Categories' },
  { href: '/settings', icon: RiSettings4Line, label: 'Settings' },
];

interface Props {
  /** Mobile drawer state, owned by the layout (opened from the bottom nav "More") */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <RiMoneyDollarCircleLine className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && <span className="text-lg font-bold text-foreground">MoneyWise</span>}
        </div>
        <button onClick={onMobileClose} aria-label="Close menu" className="md:hidden p-2 -mr-2 rounded-lg text-muted hover:text-foreground">
          <RiCloseLine className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-indigo-400')} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors w-full"
        >
          {isCollapsed ? <RiMenuUnfoldLine className="w-5 h-5" /> : <RiMenuFoldLine className="w-5 h-5" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-50 bg-black/50"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-surface border-r border-border"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {renderContent(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'hidden md:block border-r border-border bg-surface transition-[width] duration-300 flex-shrink-0',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {renderContent(collapsed)}
      </aside>
    </>
  );
}
