'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  RiWalletLine, RiArrowLeftRightLine, RiAddCircleLine,
  RiSubtractLine, RiSettings4Line, RiBarChartBoxLine,
} from 'react-icons/ri';

const features = [
  {
    icon: RiWalletLine,
    title: 'Multiple Accounts',
    description: 'Create accounts for Payoneer, bKash, Bank, Cash or any custom wallet. Track each balance separately.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: RiAddCircleLine,
    title: 'Income Tracking',
    description: 'Record income from Fiverr, Upwork, or any source. See exactly where your money comes from.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: RiSubtractLine,
    title: 'Expense Tracking',
    description: 'Categorize expenses by purpose — food, rent, software. Know where every taka goes.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: RiArrowLeftRightLine,
    title: 'Smart Transfers',
    description: 'Transfer between accounts with fee tracking and currency conversion. Payoneer to bKash, done right.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: RiSettings4Line,
    title: 'Custom Categories',
    description: 'Create your own income sources and expense categories. Your money, your rules.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: RiBarChartBoxLine,
    title: 'Dashboard Overview',
    description: 'See your financial snapshot at a glance — balances, monthly trends, and recent transactions.',
    color: 'from-cyan-500 to-teal-500',
  },
];

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-32 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#0f0520] to-[#0a0a1a]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Everything You{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Need
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
            Powerful features designed for freelancers and anyone managing money across multiple platforms.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
