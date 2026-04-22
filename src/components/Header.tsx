import { useState } from 'react';
import { motion } from 'motion/react';
import { Tent, Menu, X } from 'lucide-react';
import styled from 'styled-components';
import { media } from '../styles/theme';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HeaderBar>
      <Container>
        <HeaderRow>
          <Logo>
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

          <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </MobileMenuButton>
        </HeaderRow>
      </Container>

      {isMenuOpen && (
        <MobileMenu
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
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
    </HeaderBar>
  );
}

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

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;

  ${media.sm} {
    padding: 0 1.5rem;
  }

  ${media.lg} {
    padding: 0 2rem;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 5rem;
`;

const Logo = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const LogoIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: #1e293b;
  color: #ffffff;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.span`
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
  color: #0066ff;
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
