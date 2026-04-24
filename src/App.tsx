import { motion, AnimatePresence } from 'motion/react';
import { Tent, Truck, MapPin, Phone, Mail, CheckCircle2, Menu, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import styled, { css } from 'styled-components';
import { CAMPERS, TRANSPORTS, imgUrl, type Trailer } from './data/trailers';
import { media } from './styles/theme';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicy from './components/PrivacyPolicy';

const PRIVACY_HASH = '#polityka-prywatnosci';
type View = 'main' | 'privacy';

function getViewFromHash(): View {
  return typeof window !== 'undefined' && window.location.hash === PRIVACY_HASH
    ? 'privacy'
    : 'main';
}

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
    <TrailerCard
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <TrailerGrid $reverse={!!reverse}>
        {/* GALLERY */}
        <TrailerGallery>
          <TrailerImageWrap>
            <TrailerMainImg
              src={imgUrl(activeImage)}
              alt={trailer.name}
              loading="lazy"
              decoding="async"
            />
            <TrailerBadge style={{ backgroundColor: badgeColor }}>
              {badge}
            </TrailerBadge>
          </TrailerImageWrap>

          {trailer.images.length > 1 && (
            <ThumbGrid $count={trailer.images.length}>
              {trailer.images.map((img, idx) => (
                <ThumbButton
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  $active={activeImage === img}
                  aria-label={`Pokaż zdjęcie ${idx + 1} z ${trailer.images.length}`}
                  aria-pressed={activeImage === img}
                >
                  <ThumbImg
                    src={imgUrl(img)}
                    alt={`${trailer.name} - zdjęcie ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                </ThumbButton>
              ))}
            </ThumbGrid>
          )}
        </TrailerGallery>

        {/* DETAILS */}
        <TrailerDetails>
          <TrailerHeader>
            <TrailerTitle>{trailer.name}</TrailerTitle>
            <TrailerPrice>{trailer.priceShort}</TrailerPrice>
          </TrailerHeader>
          <TrailerDescription>{trailer.description}</TrailerDescription>
          <TrailerFooter>
            <TrailerCta href="tel:+48509146666">Zadzwoń</TrailerCta>
          </TrailerFooter>
        </TrailerDetails>
      </TrailerGrid>
    </TrailerCard>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<View>(() => getViewFromHash());
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = `Zapytanie o wynajem - ${formName || 'formularz'}`;
    const body = [
      `Imię i nazwisko: ${formName}`,
      `Telefon: ${formPhone}`,
      '',
      'Wiadomość:',
      formMessage,
    ].join('\n');
    const mailto = `mailto:biuro@motowycena.pl?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setFormName('');
    setFormPhone('');
    setFormMessage('');
  };

  useEffect(() => {
    const onHashChange = () => {
      const next = getViewFromHash();
      setView(next);

      if (next === 'privacy') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        // Po powrocie z polityki: jeśli hash wskazuje sekcję, scrolluj do niej,
        // w innym wypadku wjedź na samą górę.
        const hash = window.location.hash;
        requestAnimationFrame(() => {
          if (hash && hash.length > 1 && hash !== PRIVACY_HASH) {
            const el = document.querySelector(hash);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              return;
            }
          }
          window.scrollTo({ top: 0, behavior: 'auto' });
        });
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goToMain = () => {
    if (window.location.hash) {
      // czysto: usuń hash z URL i wróć na górę
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    setView('main');
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageWrapper>
      {/* BACKGROUND WATERMARK */}
      <WatermarkFixed>
        {Array.from({ length: 12 }).map((_, i) => (
          <WatermarkText key={i}>2mcode.pl</WatermarkText>
        ))}
      </WatermarkFixed>

      {/* FLOATING CORNER WATERMARK */}
      <CornerWatermark>
        <CornerBadge>
          Design by <CornerBrand>2mcode.pl</CornerBrand>
        </CornerBadge>
      </CornerWatermark>

      {/* HEADER */}
      <HeaderBar>
        <Container>
          <HeaderRow>
            <Logo
              onClick={goToMain}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToMain()}
              aria-label="Przejdź na stronę główną"
            >
              <LogoIcon>
                <Tent size={20} />
              </LogoIcon>
              <LogoText>Motowycena Rafał Pelczar</LogoText>
            </Logo>

            <DesktopNav>
              <NavLink href="#kempingowe">Kempingowe</NavLink>
              <NavLink href="#transportowe">Transportowe</NavLink>
              <NavContactLink href="#kontakt">Kontakt</NavContactLink>
            </DesktopNav>

            <MobileMenuButton
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </MobileMenuButton>
          </HeaderRow>
        </Container>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <MobileMenu
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MobileMenuInner>
                <MobileNavLink href="#kempingowe" onClick={() => setIsMenuOpen(false)}>
                  Przyczepy Kempingowe
                </MobileNavLink>
                <MobileNavLink href="#transportowe" onClick={() => setIsMenuOpen(false)}>
                  Przyczepy Transportowe
                </MobileNavLink>
                <MobileContactLink href="#kontakt" onClick={() => setIsMenuOpen(false)}>
                  Kontakt
                </MobileContactLink>
              </MobileMenuInner>
            </MobileMenu>
          )}
        </AnimatePresence>
      </HeaderBar>

      <MainContent>
      {view === 'privacy' ? (
        <PrivacyPolicy onBack={goToMain} />
      ) : (
      <>
      {/* HERO SECTION */}
      <HeroSection2>
        <HeroBg>
          <HeroBgImg
            src={imgUrl('trailers/T1.jpg')}
            alt="Tabbert Bellini - przyczepa kempingowa"
            fetchPriority="high"
            decoding="async"
          />
          <HeroDarkGradientR />
          <HeroDarkGradientT />
        </HeroBg>

        <HeroInner2>
          <HeroTextBlock
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <HeroKickerV2>Twój Partner w Podróży</HeroKickerV2>
            <HeroTitleV2>
              Kierunek - <br />
              <HeroTitleV2Accent>wolność.</HeroTitleV2Accent>
            </HeroTitleV2>
            <HeroSubtitleV2>
              Wynajmujemy komfortowe przyczepy kempingowe (Tabbert Bellini i Lunar Clubman) oraz
              solidne przyczepy transportowe - lawetę i przyczepę motocyklową. Wypożycz i jedź w
              nieznane!
            </HeroSubtitleV2>
            <HeroButtons>
              <HeroPrimaryBtnDark href="#kempingowe">Zobacz Przyczepy</HeroPrimaryBtnDark>
              <HeroSecondaryBtnV2 href="#kontakt">Skontaktuj Się</HeroSecondaryBtnV2>
            </HeroButtons>
          </HeroTextBlock>
        </HeroInner2>
      </HeroSection2>

      {/* QUICK HIGHLIGHT */}
      <QuickHighlight>
        <QuickHighlightInner>
          <QuickHighlightItem>
            <CheckCircle2 size={20} color="#0066FF" /> Przyczepy kempingowe klasy premium
          </QuickHighlightItem>
          <QuickHighlightItem>
            <CheckCircle2 size={20} color="#0066FF" /> Laweta dwuosiowa i przyczepa motocyklowa
          </QuickHighlightItem>
        </QuickHighlightInner>
      </QuickHighlight>

      {/* SECTION: CAMPING */}
      <CampingSection id="kempingowe">
        <SectionHeader>
          <SectionHeaderText>
            <SectionKicker>Oferta Kempingowa</SectionKicker>
            <SectionTitle>Twój hotel z niezłym widokiem.</SectionTitle>
            <SectionLead>
              Zadbana, w pełni wyposażona flota na każdy rodzaj wakacji. Tabbert Bellini klasy
              premium i bogato wyposażony Lunar Clubman - pełna niezależność na kempingu.
            </SectionLead>
          </SectionHeaderText>
        </SectionHeader>

        <TrailerList>
          {CAMPERS.map((camper, i) => (
            <TrailerRow
              key={camper.id}
              trailer={camper}
              badge="Kemping"
              badgeColor="#0066FF"
              reverse={i % 2 === 1}
            />
          ))}
        </TrailerList>
      </CampingSection>

      {/* SECTION: TRANSPORT */}
      <TransportSection id="transportowe">
        <Container>
          <TransportHeader>
            <SectionKicker>Oferta Transportowa</SectionKicker>
            <TransportIconBox>
              <Truck size={32} />
            </TransportIconBox>
            <SectionTitle>Mamy dwie mocne sztuki.</SectionTitle>
            <SectionLead>
              Oprócz rekreacji, zajmujemy się tym co praktyczne. Potrzebujesz przewieźć obniżone
              auto lub trzy motocykle? Polecamy nasze przyczepy transportowe.
            </SectionLead>
          </TransportHeader>

          <TrailerList>
            {TRANSPORTS.map((trans, i) => (
              <TrailerRow
                key={trans.id}
                trailer={trans}
                badge="Transport"
                badgeColor="#1E293B"
                reverse={i % 2 === 1}
              />
            ))}
          </TrailerList>
        </Container>
      </TransportSection>

      {/* CONTACT */}
      <ContactSection id="kontakt">
        <Container>
          <ContactWrapper>
            <ContactLeft>
              <SectionKicker>Kontakt</SectionKicker>
              <ContactTitle>
                Czas rezerwować <br />
                Twój termin
              </ContactTitle>
              <ContactLead>
                Sprawdź dostępność przyczepy. Napisz lub zadzwoń, a przygotujemy dla Ciebie całą
                umowę pod wypożyczenie.
              </ContactLead>

              <ContactList>
                <ContactLink href="tel:+48509146666">
                  <ContactIconCircle>
                    <Phone size={20} />
                  </ContactIconCircle>
                  <div>
                    <ContactLabel>Bezpośredni telefon</ContactLabel>
                    <ContactValue>+48 509 146 666</ContactValue>
                  </div>
                </ContactLink>

                <ContactLink href="mailto:biuro@motowycena.pl">
                  <ContactIconCircle>
                    <Mail size={20} />
                  </ContactIconCircle>
                  <div>
                    <ContactLabel>Wyślij zapytanie</ContactLabel>
                    <ContactValue>biuro@motowycena.pl</ContactValue>
                  </div>
                </ContactLink>

                <ContactStatic>
                  <ContactIconCircleStatic>
                    <MapPin size={20} />
                  </ContactIconCircleStatic>
                  <div>
                    <ContactLabel>Punkt odbioru</ContactLabel>
                    <ContactValueSm>Ul. Spacerowa 10, 63-430 Garki</ContactValueSm>
                  </div>
                </ContactStatic>
              </ContactList>
            </ContactLeft>

            <ContactRight>
              <ContactForm onSubmit={handleContactSubmit}>
                <FormRow>
                  <FormLabel htmlFor="contact-name">Imię i nazwisko</FormLabel>
                  <FormInput
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="np. Anna Nowak"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </FormRow>
                <FormRow>
                  <FormLabel htmlFor="contact-phone">Telefon</FormLabel>
                  <FormInput
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+48 XXX XXX XXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                  />
                </FormRow>
                <FormRow>
                  <FormLabel htmlFor="contact-message">O co pytasz?</FormLabel>
                  <FormTextarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    placeholder="Interesuje mnie Tabbert Bellini na weekend majowy..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    required
                  />
                </FormRow>
                <FormSubmit type="submit">Wyślij Wiadomość</FormSubmit>
              </ContactForm>
            </ContactRight>
          </ContactWrapper>
        </Container>
      </ContactSection>
      </>
      )}
      </MainContent>

      {/* FOOTER */}
      <Footer>
        <FooterInner>
          <FooterTop>
            <FooterLogo>
              <Tent size={24} color="#0066FF" />
              <FooterLogoText>Motowycena Rafał Pelczar</FooterLogoText>
            </FooterLogo>
            <FooterLinks>
              <FooterLink href={PRIVACY_HASH}>Polityka Prywatności</FooterLink>
            </FooterLinks>
          </FooterTop>
          <FooterBottom>
            <FooterCopy>© 2026 Motowycena Rafał Pelczar.</FooterCopy>
            <FooterCredit>
              Projekt &amp; Wykonanie:{' '}
              <FooterCreditBrand
                href="https://www.2mcode.pl/"
                target="_blank"
                rel="noopener noreferrer"
              >
                2mcode.pl
              </FooterCreditBrand>
            </FooterCredit>
          </FooterBottom>
        </FooterInner>
      </Footer>

      {/* COOKIE CONSENT */}
      <CookieConsent />
    </PageWrapper>
  );
}

/* =========================================================================
   STYLED COMPONENTS
   ========================================================================= */

const containerBase = css`
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;

  ${media.sm} {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  ${media.lg} {
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

const Container = styled.div`
  ${containerBase}
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: transparent;
  color: #1e293b;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  padding-bottom: 0;
  position: relative;
`;

const MainContent = styled.main`
  display: contents;
`;

/* --------- Watermark ---------- */
const WatermarkFixed = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 0;
`;

const WatermarkText = styled.span`
  font-size: 7vw;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #1e293b;
  opacity: 0.12;
  transform: rotate(-35deg);
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
`;

const CornerWatermark = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  pointer-events: none;
  user-select: none;
`;

const CornerBadge = styled.span`
  background: #0f172a;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid #0066ff;
  box-shadow: 0 8px 32px -4px rgba(0, 102, 255, 0.5);
  font-size: 13px;
  font-weight: 900;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CornerBrand = styled.span`
  color: #0066ff;
`;

/* --------- Header ---------- */
const HeaderBar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 50;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 5rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  min-width: 0;
  flex: 0 1 auto;
`;

const LogoIcon = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  background: #1e293b;
  color: #ffffff;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${media.md} {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const LogoText = styled.span`
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: -0.025em;
  color: #0066ff;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;

  ${media.sm} {
    font-size: 1.125rem;
  }

  ${media.md} {
    font-size: 1.25rem;
  }

  ${media.lg} {
    font-size: 1.5rem;
  }
`;

const DesktopNav = styled.nav`
  display: none;
  align-items: center;
  gap: 2rem;
  font-weight: 600;

  ${media.md} {
    display: flex;
  }
`;

const NavLink = styled.a`
  transition: color 150ms ease;
  font-size: 15px;
  color: #1e293b;

  &:hover {
    color: #0066ff;
  }
`;

const NavContactLink = styled.a`
  padding: 0.625rem 1.5rem;
  background: #1e293b;
  color: #ffffff;
  border-radius: 12px;
  transition: background 150ms ease;
  font-size: 15px;
  font-weight: 700;
  margin-left: 0.5rem;

  &:hover {
    background: #334155;
  }
`;

const MobileMenuButton = styled.button`
  display: inline-flex;
  padding: 0.5rem;
  color: #1e293b;
  flex-shrink: 0;

  ${media.md} {
    display: none;
  }
`;

const MobileMenu = styled(motion.div)`
  background: #ffffff;
  border-bottom: 1px solid rgba(30, 41, 59, 0.1);

  ${media.md} {
    display: none;
  }
`;

const MobileMenuInner = styled.div`
  padding: 0.5rem 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MobileNavLink = styled.a`
  display: block;
  padding: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
  transition: color 150ms ease;

  &:hover {
    color: #0066ff;
  }
`;

const MobileContactLink = styled.a`
  display: block;
  padding: 0.75rem;
  color: #0066ff;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

/* --------- Hero ---------- */
const HeroBg = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
`;

const HeroBgImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroTextBlock = styled(motion.div)`
  flex: 1;
  max-width: 42rem;
`;

const HeroButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  ${media.sm} {
    flex-direction: row;
  }
`;

const heroButtonBase = css`
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 700;
  text-align: center;
  font-size: 16px;
  transition: background 150ms ease, color 150ms ease;
`;

const HeroSection2 = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
`;

const HeroDarkGradientR = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(15, 23, 42, 0.9),
    rgba(15, 23, 42, 0.6),
    rgba(15, 23, 42, 0.3)
  );
`;

const HeroDarkGradientT = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent, transparent);
`;

const HeroInner2 = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  ${containerBase}
  padding-top: 8rem;
  padding-bottom: 5rem;
  color: #ffffff;
`;

const HeroKickerV2 = styled.span`
  display: inline-block;
  padding: 0.375rem 1rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.025em;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const HeroTitleV2 = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.05;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04));

  ${media.md} {
    font-size: 72px;
  }
`;

const HeroTitleV2Accent = styled.span`
  color: #60a5fa;
`;

const HeroSubtitleV2 = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2.5rem;
  max-width: 36rem;
  font-weight: 500;
  line-height: 1.625;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));

  ${media.md} {
    font-size: 20px;
  }
`;

const HeroPrimaryBtnDark = styled.a`
  ${heroButtonBase}
  background: #0066ff;
  color: #ffffff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);

  &:hover {
    background: #0044bb;
  }
`;

const HeroSecondaryBtnV2 = styled.a`
  ${heroButtonBase}
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

/* ---------- Quick highlight ---------- */
const QuickHighlight = styled.div`
  background: #ffffff;
  color: #1e293b;
  padding: 1.25rem 0;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  z-index: 20;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const QuickHighlightInner = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;

  ${media.sm} {
    flex-direction: row;
    align-items: center;
    font-size: 0.875rem;
  }
`;

const QuickHighlightItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  ${media.sm} {
    margin-bottom: 0;
  }
`;

/* ---------- Section shared ---------- */
const CampingSection = styled.section`
  padding-top: 2rem;
  padding-bottom: 6rem;
  ${containerBase}

  ${media.md} {
    padding-top: 4rem;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 4rem;

  ${media.md} {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
`;

const SectionHeaderText = styled.div`
  max-width: 42rem;
`;

const SectionKicker = styled.span`
  color: #0066ff;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  display: block;
`;

const SectionTitle = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1.5rem;
  letter-spacing: -0.025em;

  ${media.md} {
    font-size: 40px;
  }
`;

const SectionLead = styled.p`
  color: #64748b;
  font-size: 1.125rem;
  line-height: 1.625;
`;

const TrailerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

/* ---------- Transport ---------- */
const TransportSection = styled.section`
  padding: 2rem 0 6rem;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;

  ${media.md} {
    padding-top: 4rem;
  }
`;

const TransportHeader = styled.div`
  margin-bottom: 5rem;
  text-align: center;
  max-width: 48rem;
  margin-left: auto;
  margin-right: auto;
`;

const TransportIconBox = styled.div`
  width: 4rem;
  height: 4rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #0066ff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

/* ---------- Contact ---------- */
const ContactSection = styled.section`
  padding: 2rem 0 6rem;
  background: #1e293b;
  color: #ffffff;

  ${media.md} {
    padding-top: 4rem;
  }
`;

const ContactWrapper = styled.div`
  background: rgba(51, 65, 85, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: 24px;
  border: 1px solid #334155;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  ${media.md} {
    padding: 4rem;
    flex-direction: row;
  }
`;

const ContactLeft = styled.div`
  ${media.md} {
    width: 50%;
  }
`;

const ContactTitle = styled.h2`
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 2rem;
  letter-spacing: -0.025em;

  ${media.md} {
    font-size: 40px;
  }
`;

const ContactLead = styled.p`
  color: #cbd5e1;
  margin-bottom: 3rem;
  font-size: 1.125rem;
  line-height: 1.625;
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ContactLink = styled.a`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: transform 300ms ease;
  min-width: 0;

  &:hover {
    transform: translateX(4px);
  }

  &:hover > div:first-child {
    background: rgba(0, 102, 255, 0.95);
    border-color: rgba(96, 165, 250, 0.6);
    box-shadow: 0 10px 25px -10px rgba(0, 102, 255, 0.6);
  }
`;

const ContactStatic = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
`;

const ContactIconCircle = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
`;

const ContactIconCircleStatic = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContactLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.5;
  margin-bottom: 0.25rem;
`;

const ContactValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  overflow-wrap: anywhere;
  word-break: break-word;

  ${media.sm} {
    font-size: 20px;
  }
`;

const ContactValueSm = styled.div`
  font-size: 15px;
  font-weight: 700;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.4;

  ${media.sm} {
    font-size: 16px;
  }
`;

const ContactRight = styled.div`
  ${media.md} {
    width: 50%;
  }
`;

const ContactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: #0f172a;
  padding: 2rem;
  border-radius: 24px;
  border: 1px solid #334155;
`;

const FormRow = styled.div``;

const FormLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin-bottom: 0.625rem;
`;

const FormInput = styled.input`
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  color: #ffffff;
  font-family: inherit;
  font-size: 1rem;
  transition: border 150ms ease;

  &::placeholder {
    color: #64748b;
  }

  &:focus-visible {
    outline: none;
    border-color: #0066ff;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  color: #ffffff;
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  transition: border 150ms ease;

  &::placeholder {
    color: #64748b;
  }

  &:focus-visible {
    outline: none;
    border-color: #0066ff;
  }
`;

const FormSubmit = styled.button`
  width: 100%;
  background: #0066ff;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-size: 14px;
  text-transform: uppercase;
  padding: 1rem 0;
  border-radius: 12px;
  transition: background 300ms ease, transform 300ms ease;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;

  &:hover {
    background: #0044bb;
    transform: translateY(-2px);
  }
`;

/* ---------- Footer ---------- */
const Footer = styled.footer`
  background: #0f172a;
  color: #94a3b8;
  padding: 2.5rem 0;
  border-top: 1px solid #1e293b;
  font-size: 0.875rem;
  text-align: center;
`;

const FooterInner = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  font-weight: 500;

  ${media.sm} {
    padding: 0 1.5rem;
  }
`;

const FooterTop = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;

  ${media.md} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
  }
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
`;

const FooterLogoText = styled.span`
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.025em;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${media.md} {
    font-size: 18px;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  font-weight: 700;
`;

const FooterLink = styled.a`
  transition: color 150ms ease;

  &:hover {
    color: #ffffff;
  }
`;

const FooterBottom = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #1e293b;
`;

const FooterCopy = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
`;

const FooterCredit = styled.p`
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
  letter-spacing: 0.05em;
  line-height: 1.5;
`;

const FooterCreditBrand = styled.a`
  color: #cbd5e1;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: color 150ms ease;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #60a5fa;
  }
`;

/* ---------- TrailerRow ---------- */
const TrailerCard = styled(motion.article)`
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
`;

const TrailerGrid = styled.div<{ $reverse: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;

  ${media.lg} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    ${({ $reverse }) =>
      $reverse &&
      css`
        & > *:first-child {
          order: 2;
        }
      `}
  }
`;

const TrailerGallery = styled.div`
  padding: 1.25rem;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  ${media.lg} {
    padding: 2rem;
  }
`;

const TrailerImageWrap = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  overflow: hidden;
  background: #cbd5e1;
`;

const TrailerMainImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TrailerBadge = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #ffffff;
  padding: 0.375rem 1rem;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const ThumbGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => Math.min($count, 6)}, minmax(0, 1fr));
  gap: 0.5rem;
`;

const ThumbButton = styled.button<{ $active: boolean }>`
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid ${({ $active }) => ($active ? '#0066FF' : 'transparent')};
  transition: border 150ms ease;
  padding: 0;

  ${({ $active }) =>
    !$active &&
    css`
      &:hover {
        border-color: #cbd5e1;
      }
    `}
`;

const ThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TrailerDetails = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  min-width: 0;

  ${media.lg} {
    padding: 2.5rem;
  }
`;

const TrailerHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TrailerTitle = styled.h3`
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.025em;
  min-width: 0;
  overflow-wrap: anywhere;

  ${media.md} {
    font-size: 28px;
  }
`;

const TrailerPrice = styled.span`
  flex-shrink: 0;
  background: rgba(0, 102, 255, 0.1);
  color: #0066ff;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
`;

const TrailerDescription = styled.div`
  color: #475569;
  line-height: 1.625;
  font-size: 14px;
  white-space: pre-line;
  overflow-wrap: anywhere;
  margin-bottom: 1.5rem;
`;

const TrailerFooter = styled.div`
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
`;

const TrailerCta = styled.a`
  display: block;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #0066ff;
  color: #ffffff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  transition: background 150ms ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background: #0044bb;
  }
`;
