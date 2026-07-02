import { RiMoneyDollarCircleLine, RiHeartFill } from 'react-icons/ri';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <RiMoneyDollarCircleLine className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">MoneyWise</span>
          </div>
          <p className="flex items-center gap-1 text-sm text-white/40">
            Made with <RiHeartFill className="w-4 h-4 text-red-400" /> for smart money management
          </p>
        </div>
      </div>
    </footer>
  );
}
