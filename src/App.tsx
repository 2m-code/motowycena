import { Truck, MapPin, Phone, Mail, CheckCircle2, Menu, X } from 'lucide-react';
import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ImgHTMLAttributes,
} from 'react';
import styled, { css } from 'styled-components';
import { DEFAULT_SITE_CONTENT, imgUrl, type SiteContent, type Trailer } from './data/siteContent';
import { media } from './styles/theme';

// Maps a source path like 'trailers/T1.jpg' to its WebP / small variants
// produced by scripts/generate-image-variants.mjs. Returns null when the
// source isn't a known image format or sits outside the variant pipeline
// (e.g. admin uploads under /uploads/), in which case the caller should
// fall back to a plain <img>.
type ImageSources = { jpg: string; webp: string; jpgSm: string; webpSm: string };
function deriveImageSources(rawSrc: string): ImageSources | null {
  if (rawSrc.includes('/uploads/')) return null;
  const match = rawSrc.match(/^(.*)\.(jpe?g|png)$/i);
  if (!match) return null;
  const base = match[1];
  return {
    jpg: rawSrc,
    webp: `${base}.webp`,
    jpgSm: `${base}-sm.jpg`,
    webpSm: `${base}-sm.webp`,
  };
}

type ResponsiveVariant = 'wide' | 'thumb';
type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string;
  variant: ResponsiveVariant;
  sizes?: string;
};

function ResponsiveImage({ src, variant, sizes, className, ...rest }: ResponsiveImageProps) {
  const resolved = imgUrl(src);
  const sources = deriveImageSources(resolved);

  if (!sources) {
    return <img {...rest} src={resolved} className={className} />;
  }

  if (variant === 'thumb') {
    return (
      <picture>
        <source type="image/webp" srcSet={sources.webpSm} />
        <img {...rest} src={sources.jpgSm} className={className} />
      </picture>
    );
  }

  const widthSrcset = (small: string, large: string) => `${small} 500w, ${large} 1280w`;
  return (
    <picture>
      <source type="image/webp" srcSet={widthSrcset(sources.webpSm, sources.webp)} sizes={sizes} />
      <img
        {...rest}
        src={sources.jpg}
        srcSet={widthSrcset(sources.jpgSm, sources.jpg)}
        sizes={sizes}
        className={className}
      />
    </picture>
  );
}
// Code-split: admin panel, legal pages, and the cookie banner aren't needed
// for the initial public render — defer them off the LCP critical path.
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const CookieConsent = lazy(() => import('./components/CookieConsent'));

const PRIVACY_HASH = '#polityka-prywatnosci';
const PRIVACY_PATH = '/polityka-prywatnosci';
const TERMS_HASH = '#regulamin';
const TERMS_PATH = '/regulamin';
type View = 'main' | 'privacy' | 'terms';

// Section anchors on the main view get clean URLs (e.g. /kempingowe) via
// History API instead of #-fragments. SECTION_IDS maps URL path → element id.
const SECTION_IDS: Record<string, string> = {
  '/kempingowe': 'kempingowe',
  '/transportowe': 'transportowe',
  '/kontakt': 'kontakt',
};
const SECTION_PATH_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_IDS).map(([path, id]) => [id, path])
);

const BUILT_TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY ?? '';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

const FORM_ERRORS: Record<string, string> = {
  rate_limited: 'Zbyt wiele prób. Spróbuj ponownie za kilkanaście minut.',
  consent_required: 'Zaznacz zgodę na przetwarzanie danych.',
  captcha_required: 'Potwierdź, że nie jesteś botem.',
  captcha_failed: 'Weryfikacja captcha nie powiodła się. Odśwież stronę.',
  invalid_input: 'Sprawdź poprawność pól formularza.',
  send_failed: 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwoń.',
};

function getViewFromLocation(): View {
  if (typeof window === 'undefined') return 'main';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === PRIVACY_PATH || window.location.hash === PRIVACY_HASH) return 'privacy';
  if (path === TERMS_PATH || window.location.hash === TERMS_HASH) return 'terms';
  return 'main';
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
  const cardRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setActiveImage(trailer.images[0]);
  }, [trailer.images]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-80px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <TrailerCard ref={cardRef} data-in-view={inView}>
      <TrailerGrid $reverse={!!reverse}>
        {/* GALLERY */}
        <TrailerGallery>
          <TrailerImageWrap>
            <TrailerMainImg
              src={activeImage || trailer.images[0] || 'trailers/T1.jpg'}
              variant="wide"
              sizes="(min-width: 768px) 50vw, 100vw"
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
                    src={img}
                    variant="thumb"
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
            <TrailerCta href="tel:+48692376595">Zadzwoń</TrailerCta>
          </TrailerFooter>
        </TrailerDetails>
      </TrailerGrid>
    </TrailerCard>
  );
}

export default function App() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<View>(() => getViewFromLocation());
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formConsent, setFormConsent] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formErrorCode, setFormErrorCode] = useState<string>('send_failed');
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileToken = useRef<string>('');

  useEffect(() => {
    if (import.meta.env.DEV) {
      setTurnstileSiteKey(BUILT_TURNSTILE_SITE_KEY);
      return;
    }
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { turnstileSiteKey?: unknown } | null) => {
        if (typeof data?.turnstileSiteKey === 'string') {
          setTurnstileSiteKey(data.turnstileSiteKey);
        }
      })
      .catch(() => {
        setTurnstileSiteKey('');
      });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/admin') return;

    let cancelled = false;
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('content_fetch_failed'))))
      .then((data: SiteContent) => {
        if (!cancelled) setContent(data);
      })
      .catch(() => {
        if (!cancelled) setContent(DEFAULT_SITE_CONTENT);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current || turnstileWidgetId.current) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        theme: 'dark',
        callback: (token) => { turnstileToken.current = token; },
        'expired-callback': () => { turnstileToken.current = ''; },
        'error-callback': () => { turnstileToken.current = ''; },
      });
    };
    if (window.turnstile) {
      renderWidget();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', renderWidget);
      return () => existing.removeEventListener('load', renderWidget);
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', renderWidget);
    document.head.appendChild(script);
    return () => script.removeEventListener('load', renderWidget);
  }, [turnstileSiteKey]);

  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formStatus === 'sending') return;
    const botcheck =
      (e.currentTarget.elements.namedItem('botcheck') as HTMLInputElement | null)?.value || '';
    if (botcheck) {
      setFormStatus('success');
      setFormName('');
      setFormPhone('');
      setFormMessage('');
      setFormConsent(false);
      return;
    }
    if (turnstileSiteKey && !turnstileToken.current) {
      setFormErrorCode('captcha_required');
      setFormStatus('error');
      return;
    }
    setFormStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          message: formMessage,
          website: '',
          consent: formConsent,
          turnstileToken: turnstileToken.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'send_failed');
      }
      setFormStatus('success');
      setFormName('');
      setFormPhone('');
      setFormMessage('');
      setFormConsent(false);
      turnstileToken.current = '';
      window.turnstile?.reset(turnstileWidgetId.current ?? undefined);
    } catch (err) {
      setFormErrorCode(err instanceof Error ? err.message : 'send_failed');
      setFormStatus('error');
      turnstileToken.current = '';
      window.turnstile?.reset(turnstileWidgetId.current ?? undefined);
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const next = getViewFromLocation();
      setView(next);

      if (next === 'privacy' || next === 'terms') {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      // On main view: scroll to section if URL is /kempingowe etc, else top.
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      const sectionId = SECTION_IDS[path];
      requestAnimationFrame(() => {
        if (sectionId) {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  const goToMain = () => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (window.location.hash || path !== '/') {
      window.history.pushState('', document.title, '/' + window.location.search);
    }
    setView('main');
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSection = (sectionId: string, event?: { preventDefault: () => void }) => {
    if (event) event.preventDefault();
    setIsMenuOpen(false);
    const targetPath = SECTION_PATH_BY_ID[sectionId];
    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath + window.location.search);
    }
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // On initial load with a section path (e.g. /kempingowe), scroll to that
  // section once the main view has rendered.
  useEffect(() => {
    if (view !== 'main') return;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const sectionId = SECTION_IDS[path];
    if (!sectionId) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, [view, content]);

  if (typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/admin') {
    return (
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    );
  }

  return (
    <PageWrapper>
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
              <LogoImage src="/logo.jpeg" variant="thumb" alt="EPRZYCZEPY.EU" />
            </Logo>

            <DesktopNav>
              <NavLink href="/kempingowe" onClick={(e) => navigateToSection('kempingowe', e)}>
                Kempingowe
              </NavLink>
              <NavLink href="/transportowe" onClick={(e) => navigateToSection('transportowe', e)}>
                Transportowe
              </NavLink>
              <NavContactLink href="/kontakt" onClick={(e) => navigateToSection('kontakt', e)}>
                Kontakt
              </NavContactLink>
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
        <MobileMenu data-open={isMenuOpen} aria-hidden={!isMenuOpen}>
          <MobileMenuInner>
            <MobileNavLink href="/kempingowe" onClick={(e) => navigateToSection('kempingowe', e)}>
              Przyczepy Kempingowe
            </MobileNavLink>
            <MobileNavLink href="/transportowe" onClick={(e) => navigateToSection('transportowe', e)}>
              Przyczepy Transportowe
            </MobileNavLink>
            <MobileContactLink href="/kontakt" onClick={(e) => navigateToSection('kontakt', e)}>
              Kontakt
            </MobileContactLink>
          </MobileMenuInner>
        </MobileMenu>
      </HeaderBar>

      <MainContent>
      {view === 'privacy' ? (
        <Suspense fallback={null}>
          <PrivacyPolicy document={content.legal.privacy} onBack={goToMain} />
        </Suspense>
      ) : view === 'terms' ? (
        <Suspense fallback={null}>
          <PrivacyPolicy document={content.legal.terms} onBack={goToMain} />
        </Suspense>
      ) : (
      <>
      {/* HERO SECTION */}
      <HeroSection2>
        <HeroBg>
          <HeroBgImg
            src={content.hero.image || DEFAULT_SITE_CONTENT.hero.image}
            variant="wide"
            sizes="100vw"
            alt={content.hero.titleAccent}
            fetchPriority="high"
            decoding="async"
          />
          <HeroDarkGradientR />
          <HeroDarkGradientT />
        </HeroBg>

        <HeroInner2>
          <HeroTextBlock>
            <HeroKickerV2>{content.hero.kicker}</HeroKickerV2>
            <HeroTitleV2>
              {content.hero.titlePrefix} <br />
              <HeroTitleV2Accent>{content.hero.titleAccent}</HeroTitleV2Accent>
            </HeroTitleV2>
            <HeroSubtitleV2>
              {content.hero.subtitle}
            </HeroSubtitleV2>
            <HeroButtons>
              <HeroPrimaryBtnDark
                href="/kempingowe"
                onClick={(e) => navigateToSection('kempingowe', e)}
              >
                {content.hero.primaryCta}
              </HeroPrimaryBtnDark>
              <HeroSecondaryBtnV2
                href="/kontakt"
                onClick={(e) => navigateToSection('kontakt', e)}
              >
                {content.hero.secondaryCta}
              </HeroSecondaryBtnV2>
            </HeroButtons>
          </HeroTextBlock>
        </HeroInner2>
      </HeroSection2>

      {/* QUICK HIGHLIGHT */}
      <QuickHighlight>
        <QuickHighlightInner>
          <QuickHighlightItem>
            <CheckCircle2 size={20} color="#0066FF" /> {content.highlights[0]}
          </QuickHighlightItem>
          <QuickHighlightItem>
            <CheckCircle2 size={20} color="#0066FF" /> {content.highlights[1]}
          </QuickHighlightItem>
        </QuickHighlightInner>
      </QuickHighlight>

      {/* SECTION: CAMPING */}
      <CampingSection id="kempingowe">
        <SectionHeader>
          <SectionHeaderText>
            <SectionKicker>{content.camping.kicker}</SectionKicker>
            <SectionTitle>{content.camping.title}</SectionTitle>
            <SectionLead>
              {content.camping.lead}
            </SectionLead>
          </SectionHeaderText>
        </SectionHeader>

        <TrailerList>
          {content.camping.trailers.map((camper, i) => (
            <TrailerRow
              key={camper.id}
              trailer={camper}
              badge={content.camping.badge}
              badgeColor={content.camping.badgeColor}
              reverse={i % 2 === 1}
            />
          ))}
        </TrailerList>
      </CampingSection>

      {/* SECTION: TRANSPORT */}
      <TransportSection id="transportowe">
        <Container>
          <TransportHeader>
            <SectionKicker>{content.transport.kicker}</SectionKicker>
            <TransportIconBox>
              <Truck size={32} />
            </TransportIconBox>
            <SectionTitle>{content.transport.title}</SectionTitle>
            <SectionLead>
              {content.transport.lead}
            </SectionLead>
          </TransportHeader>

          <TrailerList>
            {content.transport.trailers.map((trans, i) => (
              <TrailerRow
                key={trans.id}
                trailer={trans}
                badge={content.transport.badge}
                badgeColor={content.transport.badgeColor}
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
              <SectionKicker>{content.contact.kicker}</SectionKicker>
              <ContactTitle>
                {content.contact.title.split('\n').map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx < content.contact.title.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </ContactTitle>
              <ContactLead>
                {content.contact.lead}
              </ContactLead>

              <ContactList>
                <ContactLink href={`tel:${content.contact.phone.replace(/\s/g, '')}`}>
                  <ContactIconCircle>
                    <Phone size={20} />
                  </ContactIconCircle>
                  <div>
                    <ContactLabel>Bezpośredni telefon</ContactLabel>
                    <ContactValue>{content.contact.phone}</ContactValue>
                  </div>
                </ContactLink>

                <ContactLink href={`mailto:${content.contact.email}`}>
                  <ContactIconCircle>
                    <Mail size={20} />
                  </ContactIconCircle>
                  <div>
                    <ContactLabel>Wyślij zapytanie</ContactLabel>
                    <ContactValue>{content.contact.email}</ContactValue>
                  </div>
                </ContactLink>

                <ContactStatic>
                  <ContactIconCircleStatic>
                    <MapPin size={20} />
                  </ContactIconCircleStatic>
                  <div>
                    <ContactLabel>Punkt odbioru</ContactLabel>
                    <ContactValueSm>{content.contact.address}</ContactValueSm>
                  </div>
                </ContactStatic>
              </ContactList>
            </ContactLeft>

            <ContactRight>
              <ContactForm onSubmit={handleContactSubmit}>
                <Honeypot
                  type="text"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
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
                <ConsentRow>
                  <ConsentCheckbox
                    type="checkbox"
                    id="contact-consent"
                    checked={formConsent}
                    onChange={(e) => setFormConsent(e.target.checked)}
                    disabled={formStatus === 'sending'}
                    required
                  />
                  <ConsentLabel htmlFor="contact-consent">
                    Wyrażam zgodę na przetwarzanie moich danych osobowych w celu odpowiedzi na zapytanie.{' '}
                    <a href={PRIVACY_HASH}>Polityka prywatności</a>.
                  </ConsentLabel>
                </ConsentRow>
                {turnstileSiteKey && <TurnstileWrapper ref={turnstileRef} />}
                <FormSubmit type="submit" disabled={formStatus === 'sending'}>
                  {formStatus === 'sending' ? 'Wysyłanie...' : 'Wyślij Wiadomość'}
                </FormSubmit>
                {formStatus === 'success' && (
                  <FormStatus role="status" $variant="success">
                    Dziękujemy! Wiadomość została wysłana. Odezwiemy się wkrótce.
                  </FormStatus>
                )}
                {formStatus === 'error' && (
                  <FormStatus role="alert" $variant="error">
                    {FORM_ERRORS[formErrorCode] ?? FORM_ERRORS.send_failed}
                  </FormStatus>
                )}
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
              <FooterLogoText>EPRZYCZEPY.EU</FooterLogoText>
            </FooterLogo>
            <FooterLinks>
              <FooterLink href={PRIVACY_HASH}>Polityka Prywatności</FooterLink>
              <FooterLink href={TERMS_HASH}>Regulamin</FooterLink>
            </FooterLinks>
          </FooterTop>
          <FooterBottom>
            <FooterCopy>© 2026 EPRZYCZEPY.EU</FooterCopy>
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
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
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

/* --------- Header ---------- */
const HeaderBar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  z-index: 50;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 6.5rem;

  ${media.md} {
    height: 7.5rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  min-width: 0;
  flex: 0 1 auto;
`;

const LogoImage = styled(ResponsiveImage)`
  height: 5rem;
  width: auto;
  display: block;
  flex-shrink: 0;
  object-fit: contain;

  ${media.md} {
    height: 6rem;
  }

  ${media.lg} {
    height: 6.5rem;
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

const MobileMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border-bottom: 1px solid rgba(30, 41, 59, 0.1);
  opacity: 0;
  transform: translateY(-10px);
  visibility: hidden;
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease, visibility 0s linear 200ms;

  &[data-open='true'] {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
    pointer-events: auto;
    transition: opacity 200ms ease, transform 200ms ease, visibility 0s;
  }

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

const HeroBgImg = styled(ResponsiveImage)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroTextBlock = styled.div`
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  animation: heroFadeUp 800ms ease both;
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

  /* WCAG AA: brand blue #0066ff on this dark bg is 3.48:1 — fails. */
  ${SectionKicker} {
    color: #60a5fa;
  }

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
  color: #cbd5e1;
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

  &:hover:not(:disabled) {
    background: #0044bb;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Honeypot = styled.input`
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
`;

const ConsentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.25rem;
`;

const ConsentCheckbox = styled.input`
  margin-top: 0.25rem;
  width: 1rem;
  height: 1rem;
  accent-color: #0066ff;
  cursor: pointer;
  flex-shrink: 0;
`;

const ConsentLabel = styled.label`
  font-size: 0.78rem;
  color: #cbd5e1;
  line-height: 1.5;
  cursor: pointer;

  a {
    color: #60a5fa;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  a:hover {
    color: #93c5fd;
  }
`;

const TurnstileWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.25rem;
`;

const FormStatus = styled.p<{ $variant: 'success' | 'error' }>`
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  background: ${(p) => (p.$variant === 'success' ? '#ecfdf5' : '#fef2f2')};
  color: ${(p) => (p.$variant === 'success' ? '#065f46' : '#991b1b')};
  border: 1px solid ${(p) => (p.$variant === 'success' ? '#a7f3d0' : '#fecaca')};
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
const TrailerCard = styled.article`
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms ease, transform 500ms ease;

  &[data-in-view='true'] {
    opacity: 1;
    transform: translateY(0);
  }
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

const TrailerMainImg = styled(ResponsiveImage)`
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

const ThumbImg = styled(ResponsiveImage)`
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
