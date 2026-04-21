import { useState } from 'react';
import { motion } from 'motion/react';
import { Tent, Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-forest text-sand rounded-full flex items-center justify-center">
              <Tent className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#0066FF]">przyczepy.pl</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-semibold">
            <a href="#kempingowe" className="hover:text-[#0066FF] transition-colors text-[15px] text-[#1E293B]">Kempingowe</a>
            <a href="#transportowe" className="hover:text-[#0066FF] transition-colors text-[15px] text-[#1E293B]">Transportowe</a>
            <a href="#dlaczego-my" className="hover:text-[#0066FF] transition-colors text-[15px] text-[#1E293B]">Warto Wypożyczyć</a>
            <a href="#kontakt" className="px-6 py-2.5 bg-[#1E293B] text-white rounded-[12px] hover:bg-[#334155] transition text-[15px] font-bold ml-2">Kontakt</a>
          </nav>

          <button
            className="md:hidden p-2 text-forest"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-sand border-b border-forest/10"
        >
          <div className="px-4 pt-2 pb-6 flex flex-col space-y-1">
            <a href="#kempingowe" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 font-medium text-forest uppercase tracking-wider text-sm">Przyczepy Kempingowe</a>
            <a href="#transportowe" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 font-medium text-forest uppercase tracking-wider text-sm">Przyczepy Transportowe</a>
            <a href="#dlaczego-my" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 font-medium text-forest uppercase tracking-wider text-sm">Skąd Jesteśmy</a>
            <a href="#kontakt" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-clay font-bold uppercase tracking-wider text-sm mt-2">Kontakt</a>
          </div>
        </motion.div>
      )}
    </header>
  );
}
