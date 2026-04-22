import { motion } from 'motion/react';
import { Tent, Truck, MapPin, Phone, Mail, CheckCircle2, Menu, X, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CAMPERS, TRANSPORTS, type Trailer } from './data/trailers';

type TrailerRowProps = {
  trailer: Trailer;
  badge: string;
  badgeColor: string;
  reverse?: boolean;
  key?: string | number;
};

function TrailerRow({ trailer, badge, badgeColor, reverse }: TrailerRowProps) {
  const [activeImage, setActiveImage] = useState(trailer.images[0]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-[24px] overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#E2E8F0]"
    >
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        {/* GALLERY */}
        <div className="p-5 lg:p-8 bg-[#F8FAFC] flex flex-col gap-3">
          <div className="relative aspect-[4/3] rounded-[16px] overflow-hidden bg-[#CBD5E1]">
            <img
              src={activeImage}
              alt={trailer.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute top-4 left-4 text-white px-4 py-1.5 rounded-[20px] text-[11px] font-bold uppercase tracking-widest shadow-sm"
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </div>
          </div>
          {trailer.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {trailer.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-[8px] overflow-hidden border-2 transition ${
                    activeImage === img ? 'border-[#0066FF]' : 'border-transparent hover:border-[#CBD5E1]'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${trailer.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="p-6 lg:p-10 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="text-[24px] md:text-[28px] font-extrabold text-[#1E293B] tracking-tight">{trailer.name}</h3>
            <span className="flex-shrink-0 bg-[#0066FF]/10 text-[#0066FF] px-4 py-2 rounded-[12px] text-[13px] font-bold whitespace-nowrap">
              {trailer.priceShort}
            </span>
          </div>
          <div className="text-[#475569] leading-relaxed text-[14px] whitespace-pre-line mb-6">
            {trailer.description}
          </div>
          <div className="mt-auto pt-6 border-t border-[#E2E8F0]">
            <a
              href="tel:+48123456789"
              className="block w-full px-6 py-3.5 bg-[#0066FF] text-white rounded-[12px] text-[14px] font-bold text-center hover:bg-[#0044BB] transition shadow-sm"
            >
              Zadzwoń
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-[#1E293B] font-sans selection:bg-[#0066FF] selection:text-white pb-0 relative">
      {/* BACKGROUND WATERMARK */}
      <div className="fixed inset-0 z-[9999] pointer-events-none select-none flex items-center justify-center overflow-hidden">
        <span className="text-[20vw] font-black tracking-tighter text-[#1E293B] opacity-10 -rotate-45 mix-blend-multiply">2mcode</span>
      </div>

      {/* FLOATING CORNER WATERMARK */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none select-none">
        <span className="bg-white px-5 py-3 rounded-[12px] border-2 border-[#E2E8F0] shadow-2xl text-[13px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
          Design by <span className="text-[#0066FF]">2mcode</span>
        </span>
      </div>

      {/* HEADER */}
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

        {/* Mobile menu */}
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

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/trailers/T1.jpg"
            alt="Tabbert Bellini – przyczepa kempingowa"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 via-[#0F172A]/60 to-[#0F172A]/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block py-1.5 px-4 mb-6 bg-white/10 backdrop-blur-md rounded-full font-bold text-sm tracking-wide border border-white/20">
              Twój Partner w Podróży
            </span>
            <h1 className="text-5xl md:text-[72px] font-extrabold leading-[1.05] mb-6 drop-shadow-lg">
              Kierunek — <br/><span className="text-[#60A5FA]">wolność.</span>
            </h1>
            <p className="text-[18px] md:text-[20px] text-white/90 mb-10 max-w-xl font-medium leading-relaxed drop-shadow">
              Wynajmujemy komfortowe przyczepy kempingowe (Tabbert Bellini i Lunar Clubman) oraz solidne przyczepy transportowe — lawetę i przyczepę motocyklową. Wypożycz i jedź w nieznane!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#kempingowe" className="px-8 py-4 bg-[#0066FF] text-white rounded-[12px] font-bold hover:bg-[#0044BB] transition text-center shadow-2xl shadow-black/40 text-[16px]">
                Zobacz Przyczepy
              </a>
              <a href="#kontakt" className="px-8 py-4 border-2 border-white/40 bg-white/5 backdrop-blur-md text-white rounded-[12px] font-bold hover:bg-white/15 transition text-center text-[16px]">
                Skontaktuj Się
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK HIGHLIGHT */}
      <div className="bg-white text-[#1E293B] py-5 border-b border-[#E2E8F0] relative z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs md:text-sm uppercase tracking-widest font-bold">
          <span className="flex items-center gap-2 mb-3 sm:mb-0"><CheckCircle2 className="w-5 h-5 text-[#0066FF]" /> Przyczepy kempingowe klasy premium</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#0066FF]" /> Laweta dwuosiowa i przyczepa motocyklowa</span>
        </div>
      </div>

      {/* SECTION: CAMPING */}
      <section id="kempingowe" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 md:flex justify-between items-end">
          <div className="max-w-2xl">
            <span className="text-[#0066FF] font-bold tracking-widest uppercase text-sm mb-4 block">Oferta Kempingowa</span>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#1E293B] mb-6 tracking-tight">Twój hotel z niezłym widokiem.</h2>
            <p className="text-[#64748B] text-lg leading-relaxed">Zadbana, w pełni wyposażona flota na każdy rodzaj wakacji. Tabbert Bellini klasy premium i bogato wyposażony Lunar Clubman — pełna niezależność na kempingu.</p>
          </div>
        </div>

        <div className="space-y-10">
          {CAMPERS.map((camper, i) => (
            <TrailerRow
              key={camper.id}
              trailer={camper}
              badge="Kemping"
              badgeColor="#0066FF"
              reverse={i % 2 === 1}
            />
          ))}
        </div>
      </section>

      {/* SECTION: TRANSPORT */}
      <section id="transportowe" className="py-24 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <span className="text-[#0066FF] font-bold tracking-widest uppercase text-sm mb-4 block">Oferta Transportowa</span>
            <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] flex items-center justify-center mx-auto mb-6 text-[#0066FF] shadow-sm">
              <Truck className="w-8 h-8" />
            </div>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#1E293B] mb-6 tracking-tight">Mamy dwie mocne sztuki.</h2>
            <p className="text-[#64748B] text-lg leading-relaxed">Oprócz rekreacji, zajmujemy się tym co praktyczne. Potrzebujesz przewieźć obniżone auto lub trzy motocykle? Polecamy nasze przyczepy transportowe.</p>
          </div>

          <div className="space-y-10">
            {TRANSPORTS.map((trans, i) => (
              <TrailerRow
                key={trans.id}
                trailer={trans}
                badge="Transport"
                badgeColor="#1E293B"
                reverse={i % 2 === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="dlaczego-my" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-[#0066FF] font-bold tracking-widest uppercase text-sm mb-4 block">Dlaczego przyczepy.pl</span>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#1E293B] mb-12 tracking-tight">Jedziesz, <br/>my załatwiamy resztę.</h2>

            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 text-[#0066FF]">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-[20px] font-bold text-[#1E293B] mb-2">Pełne ubezpieczenie (OC/AC)</h4>
                  <p className="text-[#64748B] leading-relaxed text-sm">Wszystkie nasze przyczepy posiadają dedykowane ubezpieczenie do bezpiecznego wynajmu. Podróżujesz bez zbędnego stresu, niezależnie od sytuacji.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 text-[#0066FF]">
                  <Phone className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-[20px] font-bold text-[#1E293B] mb-2">Jasne zasady wynajmu</h4>
                  <p className="text-[#64748B] leading-relaxed text-sm">Zadnych ukrytych opłat za "gotowość", sprzątanie czy instruktaż. Prosta umowa, jeden depozyt i uczciwe rozliczenie.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square md:aspect-[4/3] rounded-[24px] overflow-hidden shadow-lg border border-[#E2E8F0]">
              <img src="https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=800&q=80" alt="Happy customers loading trailer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-[#0066FF] text-white p-10 rounded-[24px] max-w-[280px] shadow-xl hidden md:block">
              <div className="text-[48px] font-extrabold mb-3">100%</div>
              <p className="text-[15px] opacity-90 font-medium leading-relaxed">przygotowania technicznego przed każdym wydaniem przyczepy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="kontakt" className="py-24 bg-[#1E293B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#334155]/20 backdrop-blur-sm rounded-[24px] border border-[#334155] p-8 md:p-16 flex flex-col md:flex-row gap-16 shadow-2xl">
            <div className="md:w-1/2">
              <span className="text-[#0066FF] font-bold tracking-widest uppercase text-sm mb-4 block">Kontakt</span>
              <h2 className="text-[32px] md:text-[40px] font-extrabold mb-8 tracking-tight">Czas rezerwować <br/>Twój termin</h2>
              <p className="text-[#CBD5E1] mb-12 text-lg leading-relaxed">Sprawdź dostępność przyczepy. Napisz lub zadzwoń, a przygotujemy dla Ciebie całą umowę pod wypożyczenie.</p>

              <div className="space-y-8">
                <a href="tel:+48123456789" className="flex items-center gap-5 hover:text-[#0066FF] transition group">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#0066FF] transition duration-300">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Bezpośredni telefon</div>
                    <div className="text-[20px] font-bold">+48 123 456 789</div>
                  </div>
                </a>

                <a href="mailto:pytania@przyczepy.pl" className="flex items-center gap-5 hover:text-[#0066FF] transition group">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#0066FF] transition duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Wyślij zapytanie</div>
                    <div className="text-[20px] font-bold">pytania@przyczepy.pl</div>
                  </div>
                </a>

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Punkt odbioru</div>
                    <div className="text-[16px] font-bold">ul. Długa 12, Północne Okolice Warszawy</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2">
              <form className="space-y-6 bg-[#0F172A] p-8 rounded-[24px] border border-[#334155]" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2.5">Imię i nazwisko</label>
                  <input type="text" className="w-full bg-[#1E293B] border border-[#334155] rounded-[12px] px-5 py-4 text-white placeholder-[#64748B] focus:outline-none focus:border-[#0066FF] transition" placeholder="np. Anna Nowak" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2.5">Telefon</label>
                  <input type="tel" className="w-full bg-[#1E293B] border border-[#334155] rounded-[12px] px-5 py-4 text-white placeholder-[#64748B] focus:outline-none focus:border-[#0066FF] transition" placeholder="+48 XXX XXX XXX" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2.5">O co pytasz?</label>
                  <textarea rows={4} className="w-full bg-[#1E293B] border border-[#334155] rounded-[12px] px-5 py-4 text-white placeholder-[#64748B] focus:outline-none focus:border-[#0066FF] transition resize-none" placeholder="Interesuje mnie Tabbert Bellini na weekend majowy..."></textarea>
                </div>
                <button type="submit" className="w-full bg-[#0066FF] text-white font-bold tracking-widest text-[14px] uppercase py-4 rounded-[12px] hover:bg-[#0044BB] hover:-translate-y-0.5 transition-all duration-300 shadow-lg mt-4">
                  Wyślij Wiadomość
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] text-[#94A3B8] py-10 border-t border-[#1E293B] text-sm text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 font-medium">
          <div className="flex items-center gap-3">
            <Tent className="w-6 h-6 text-[#0066FF]" />
            <span className="font-extrabold text-[#E2E8F0] tracking-tight text-[18px]">przyczepy.pl</span>
          </div>
          <div className="flex gap-6 uppercase tracking-widest text-[11px] font-bold">
            <a href="#" className="hover:text-white transition">Regulamin Wynajmu</a>
            <a href="#" className="hover:text-white transition">Polityka Prywatności</a>
          </div>
          <p className="text-[12px]">© 2026 przyczepy.pl. Cała Naprzód. | Projekt & Wykonanie: 2mcode</p>
        </div>
      </footer>
    </div>
  );
}
