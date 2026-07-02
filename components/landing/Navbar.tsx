'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiMenuLine, RiCloseLine, RiMoneyDollarCircleLine } from 'react-icons/ri';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <RiMoneyDollarCircleLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MoneyWise</span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all font-medium"
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-white/80 hover:bg-white/5"
          >
            {mobileOpen ? <RiCloseLine className="w-6 h-6" /> : <RiMenuLine className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 space-y-2"
        >
          <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center py-2.5 rounded-xl text-white/80 hover:bg-white/5 font-medium">
            Sign In
          </Link>
          <Link href="/register" onClick={() => setMobileOpen(false)} className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium">
            Get Started
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
