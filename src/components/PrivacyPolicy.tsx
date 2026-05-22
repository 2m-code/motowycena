import styled from 'styled-components';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { media } from '../styles/theme';
import { DEFAULT_SITE_CONTENT, type LegalDocumentContent } from '../data/siteContent';

type PrivacyPolicyProps = {
  document?: LegalDocumentContent;
  onBack?: () => void;
};

function renderLegalBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (/^§\d+/u.test(block) || block === block.toUpperCase()) {
        return <H2 key={index}>{block}</H2>;
      }

      return <P key={index}>{block}</P>;
    });
}

export default function PrivacyPolicy({
  document = DEFAULT_SITE_CONTENT.legal.privacy,
  onBack,
}: PrivacyPolicyProps) {
  return (
    <Wrapper>
      <Container>
        <TopRow>
          <BackBtn
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
          >
            <ArrowLeft size={18} />
            Wróć na stronę główną
          </BackBtn>
          <UpdatedBadge>Ostatnia aktualizacja: {document.updatedAt}</UpdatedBadge>
        </TopRow>

        <Hero
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HeroIcon>
            <ShieldCheck size={32} />
          </HeroIcon>
          <Kicker>Dokumenty</Kicker>
          <Title>{document.title}</Title>
        </Hero>

        <Content
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Section>{renderLegalBody(document.body)}</Section>

        </Content>

        <BottomBackRow>
          <BackBtn
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
          >
            <ArrowLeft size={18} />
            Wróć na stronę główną
          </BackBtn>
        </BottomBackRow>
      </Container>
    </Wrapper>
  );
}

/* --------- Styles ---------- */

const Wrapper = styled.div`
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  padding: 7rem 0 5rem;

  ${media.md} {
    padding: 9rem 0 6rem;
  }
`;

const Container = styled.div`
  max-width: 56rem;
  margin: 0 auto;
  padding: 0 1rem;

  ${media.sm} {
    padding: 0 1.5rem;
  }

  ${media.lg} {
    padding: 0 2rem;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;

  &:hover {
    background: #0066ff;
    border-color: #0066ff;
    color: #ffffff;
  }
`;

const UpdatedBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 0.35rem 0.75rem;
  background: #e2e8f0;
  border-radius: 9999px;
  letter-spacing: 0.02em;
`;

const Hero = styled(motion.div)`
  margin-bottom: 3rem;
  padding-bottom: 2.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const HeroIcon = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 16px;
  background: rgba(0, 102, 255, 0.1);
  color: #0066ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
`;

const Kicker = styled.span`
  display: inline-block;
  color: #0066ff;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 1rem;

  ${media.md} {
    font-size: 2.75rem;
  }
`;

const Content = styled(motion.article)`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);

  ${media.md} {
    padding: 3rem 3rem;
  }
`;

const Section = styled.section`
  & + & {
    margin-top: 2.5rem;
    padding-top: 2.5rem;
    border-top: 1px solid #e2e8f0;
  }
`;

const H2 = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;

  ${media.md} {
    font-size: 1.5rem;
  }
`;

const P = styled.p`
  color: #475569;
  font-size: 15px;
  line-height: 1.75;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  ${media.md} {
    font-size: 16px;
  }
`;

const Strong = styled.strong`
  color: #1e293b;
  font-weight: 700;
`;

const Ul = styled.ul`
  color: #475569;
  font-size: 15px;
  line-height: 1.75;
  padding-left: 1.25rem;
  margin: 0 0 1rem;
  list-style: disc;

  li {
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  ${media.md} {
    font-size: 16px;
    padding-left: 1.5rem;
  }
`;

const BottomBackRow = styled.div`
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
`;
