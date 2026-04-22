import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';
import styled from 'styled-components';
import { media } from '../styles/theme';

const STORAGE_KEY = 'cookieConsent';

type ConsentValue = 'accepted' | 'rejected';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        // Small delay so banner feels less intrusive on first paint
        const t = window.setTimeout(() => setVisible(true), 400);
        return () => window.clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <Banner
          role="dialog"
          aria-live="polite"
          aria-label="Informacja o plikach cookies"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Inner>
            <IconWrap aria-hidden="true">
              <Cookie size={24} />
            </IconWrap>

            <Content>
              <Title>Szanujemy Twoją prywatność</Title>
              <Text>
                Ta strona używa plików cookies, aby zapewnić poprawne działanie i analizować ruch.
                Możesz zaakceptować wszystkie lub odrzucić opcjonalne. Szczegóły znajdziesz w naszej{' '}
                <PolicyLink href="#">Polityce Prywatności</PolicyLink>.
              </Text>
            </Content>

            <Actions>
              <RejectBtn type="button" onClick={() => save('rejected')}>
                Odrzuć
              </RejectBtn>
              <AcceptBtn type="button" onClick={() => save('accepted')}>
                Akceptuj wszystkie
              </AcceptBtn>
            </Actions>

            <CloseBtn
              type="button"
              aria-label="Zamknij i odrzuć"
              onClick={() => save('rejected')}
            >
              <X size={18} />
            </CloseBtn>
          </Inner>
        </Banner>
      )}
    </AnimatePresence>
  );
}

/* ---------- Styles ---------- */

const Banner = styled(motion.div)`
  position: fixed;
  z-index: 10000;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.75rem;
  pointer-events: none;

  ${media.sm} {
    padding: 1rem;
  }

  ${media.md} {
    padding: 1.5rem;
  }
`;

const Inner = styled.div`
  pointer-events: auto;
  position: relative;
  max-width: 64rem;
  margin: 0 auto;
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.25);
  padding: 1.25rem 1.25rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;

  ${media.sm} {
    padding: 1.5rem 3rem 1.5rem 1.5rem;
  }

  ${media.md} {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 3.5rem 1.5rem 1.75rem;
  }
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  background: rgba(0, 102, 255, 0.1);
  color: #0066ff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 0.35rem 0;
  color: #1e293b;
`;

const Text = styled.p`
  font-size: 13px;
  line-height: 1.55;
  color: #475569;
  margin: 0;

  ${media.sm} {
    font-size: 14px;
  }
`;

const PolicyLink = styled.a`
  color: #0066ff;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 150ms ease;

  &:hover {
    color: #0044bb;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;

  ${media.sm} {
    flex-wrap: nowrap;
    width: auto;
  }
`;

const baseBtn = `
  flex: 1;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
  white-space: nowrap;

  &:active {
    transform: translateY(1px);
  }
`;

const RejectBtn = styled.button`
  ${baseBtn}
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #cbd5e1;

  &:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }
`;

const AcceptBtn = styled.button`
  ${baseBtn}
  background: #0066ff;
  color: #ffffff;
  border: 1px solid #0066ff;
  box-shadow: 0 6px 14px -4px rgba(0, 102, 255, 0.45);

  &:hover {
    background: #0044bb;
    border-color: #0044bb;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;
