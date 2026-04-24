import styled from 'styled-components';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { media } from '../styles/theme';

type PrivacyPolicyProps = {
  onBack?: () => void;
};

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <UpdatedBadge>Ostatnia aktualizacja: 22 kwietnia 2026</UpdatedBadge>
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
          <Title>Polityka Prywatności i Polityka Cookies</Title>
        </Hero>

        <Content
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Section>
            <H2>§1</H2>
            <H2>POSTANOWIENIA OGÓLNE</H2>
            <P>
              Niniejsza Polityka Prywatności i Polityka Cookies określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników oraz plików Cookies, a także innych technologii pojawiających się na stronie internetowej https://www.motowycena.pl/
W razie jakichkolwiek wątpliwości w zakresie postanowień niniejszej Polityki Prywatności i Polityki Cookies proszę kontaktować się z Administratorem poprzez adres e-mail biuro@motowycena.pl
Wszelkie dane osobowe i adresowe podane przez Użytkownika na stronie https://www.motowycena.pl/ nie będą w jakikolwiek sposób udostępniane ani odsprzedawane osobom trzecim.
Administrator zastrzega sobie prawo do wprowadzania zmian w polityce prywatności, a każdego Użytkownika strony obowiązuje znajomość aktualnej polityki prywatności.
Przyczyną zmian mogą być rozwój technologii internetowej, zmiany w powszechnie obowiązującym prawie czy tez rozwój Strony.
            </P>
          </Section>

          <Section>
            <H2>§2</H2>
            <H2>DEFINICJE</H2>
            <P>
              „Administrator" - MOTOWYCENA RAFAŁ PELCZAR ul.Spacerowa 10, 63-430 Garki
            </P>
            <P>
              „Użytkownik" - każdy podmiot przebywający na stronie i korzystający z niej.
            </P>
            <P>
              „Strona" - strona internetowa i blog znajdujące się pod adresem https://www.motowycena.pl/
            </P>
          </Section>

          <Section>
            <H2>§3</H2>
            <H2>DANE OSOBOWE</H2>
            <P>1.Administratorem danych osobowych Użytkownika jest Administrator.</P>
            <P>2. Użytkownik dobrowolnie podaje dane osobowe za pomocą formularzy znajdujących się na Stronie, o których mowa poniżej, w celach na jakie wskazują dane formularze.</P>
            <P>3. Użytkownik wyraża zgodę na przetwarzanie podanych danych osobowych oraz na otrzymywanie informacji marketingowych środkami komunikacji elektronicznej od Administratora w celu wysyłania newslettera, kontaktu z Użytkownikiem lub wysyłania innych informacji marketingowych, np. o wydarzeniach lub produktach oferowanych przez Administratora.</P>
            <P>4. Użytkownikowi przysługuje, w każdej chwili, prawo dostępu do treści jego danych oraz możliwość ich poprawiania, sprostowania lub żądania ograniczenia ich przetwarzania. Zgoda Użytkownika może być w każdym czasie odwołana, co skutkować będzie usunięciem adresu e-mail z listy mailingowej Administratora. Użytkownik ma prawo do przenoszenia jego danych osobowych i wniesienia skargi do Prezesa UODO.</P>
            <P>5. Dane Użytkownika nie będą przekazywane żadnemu innemu podmiotowi, ani poza obszar Unii Europejskiej.</P>
            <P>6. Dane Użytkownika będą przechowywane przez Administratora przez czas nieokreślony.</P>
            <P>7. Jeśli Użytkownik nie poda swoich danych osobowych to nie będzie mógł skorzystać z materiałów lub usług oferowanych przez Administratora w ramach formularzy znajdujących się na Stronie.</P>
            <P>8. Użytkownik podając swoje dane osobowe zgadza się na ich przetwarzanie w celach marketingu produktów i usług Administratora, w tym na poddanie ich profilowaniu dla potrzeb przygotowania zindywidualizowanej oferty. Użytkownik może wnieść sprzeciw wobec przetwarzania jego danych osobowych w celach marketingowych oraz sprzeciw wobec profilowania w tym celu.</P>
            <P>9. Na Stronie mogą pojawiać się linki odsyłające do innych stron internetowych. Będą one otwierać się w nowym oknie przeglądarki lub w tym samym oknie. Administrator nie odpowiada za treści przekazywane przez te strony. Użytkownik zobowiązany jest do zapoznania się z polityką prywatności lub regulaminem tych stron.</P>
            <P>10. Użytkownik podaje dane dobrowolnie jednakże jest to konieczne do osiągnięcia celu lub podjęcia działań związanych z ich podaniem.</P>
            <P>11. Dane osobowe Użytkownika są przechowywane i chronione z należytą starannością, zgodnie z wdrożonymi procedurami wewnętrznymi Administratora.</P>
            <P>12. Administrator Danych Osobowych niniejszym informuje, że nie powołał Inspektora Ochrony Danych Osobowych (ABI) i wykonuje samodzielnie obowiązki wynikające z ustawy z dnia 29 sierpnia 1997 roku o ochronie danych osobowych (Dz. U. z 2016, poz. 922, dalej jako „UODO”).</P>
            <P>13. Podane przez Użytkownika dane osobowe będą wykorzystywane w celu i w zakresie wynikającym z udzielonych zgód.</P>
            <P>14. Podstawą prawną przetwarzania danych osobowych podanych przez Użytkownika stanowią:
- udzielona przez Użytkownika zgoda
- wypełnienie prawnie usprawiedliwionych celów realizowanych przez Administratora albo odbiorców danych, którymi są w szczególności marketing bezpośredni własnych produktów i usług.</P>
          </Section>
          
          <Section>
            <H2>§4</H2>
            <H2>KONTAKT E-MAIL</H2>
            <P>
              Kontaktując się ze mną za pośrednictwem poczty elektronicznej, w tym również przesyłając zapytanie poprzez formularz kontaktowy, w sposób naturalny przekazujesz mi swój adres e-mail jako adres nadawcy wiadomości. Ponadto, w treści wiadomości możesz zawrzeć również inne dane osobowe. Podanie danych jest dobrowolne, ale niezbędne, by nawiązać kontakt.
            </P>
            <P>
              Twoje dane są w tym przypadku przetwarzane w celu kontaktu z Tobą, a podstawą przetwarzania jest art. 6 ust. 1 lit. a RODO, czyli Twoja zgoda wynikające z zainicjowania ze mną kontaktu. Podstawą prawną przetwarzania po zakończeniu kontaktu jest usprawiedliwiony cel w postaci archiwizacji korespondencji na potrzeby wewnętrzne (art. 6 ust. 1 lit. c RODO).
            </P>
            <P>
              Treść korespondencji może podlegać archiwizacji i nie jestem w stanie jednoznacznie określić, kiedy zostanie usunięta. Masz prawo do domagania się przedstawienia historii korespondencji, jaką ze mną prowadziłeś/ prowadziłaś, jeżeli podlegała archiwizacji), jak również domagać się jej usunięcia, chyba że jej archiwizacja jest uzasadniona z uwagi na moje nadrzędne interesy, np. obrona przed potencjalnymi roszczeniami z Twojej strony.
            </P>
          </Section>

          <Section>
            <H2>§5</H2>
            <H2>TECHNOLOGIE</H2>
            <P>1. Administrator stosuje następujące technologie obserwujące działania podejmowane przez Użytkownika w ramach Strony:</P>
            <Ul>
              <li>
                1.1. Wbudowany kod Google Analytics - w celu analizy statystyk Strony. Google Analytics korzysta z własnych plików cookies do analizowania działań i zachowań Użytkowników Strony. Pliki te służą do przechowywania informacji, np. z jakiej strony Użytkownik trafił na bieżącą stronę internetową. Pomagają udoskonalić Stronę.
              </li>
            </Ul>
            <P>
              2. W celu korzystania ze strony internetowej https://www.motowycena.pl/ niezbędne jest posiadanie:
            </P>
            <Ul>
              <li>2.1. Urządzenia z dostępem do sieci Internet</li>
              <li>2.2. Aktywnej skrzynki elektronicznej odbierającej wiadomości e-mail</li>
              <li>2.3. Przeglądarki internetowej umożliwiającej wyświetlanie stron www.</li>
            </Ul>
          </Section>

          <Section>
            <H2>§6</H2>
            <H2>WYŁĄCZENIE ODPOWIEDZIALNOŚCI</H2>
            <P>1. Administrator nie ponosi odpowiedzialności za wykorzystanie treści zawartych na Stronie lub działania czy zaniechania podejmowane na ich podstawie.</P>
            <P>2. Wszystkie treści umieszczone na Stronie stanowią przedmiot praw autorskich Administratora. Administrator nie wyraża zgody na kopiowanie treści zamieszczonych na blogu w całości lub części bez jego wyraźnej, uprzedniej zgody.</P>
          </Section>

          <Section>
            <H2>§7</H2>
            <H2>POLITYKA PLIKÓW COOKIES</H2>
            <P>Drogi Użytkowniku Internetu,</P>
            <P>Ta strona internetowa zapisuje na Twoim komputerze, a dokładniej w schowku Twojej przeglądarki internetowej (np. Firefox, Internet Explorer, Chrome) na Twoim koncie użytkownika komputera (lub telefonu), na którym łączysz się z Internetem, tzw. pliki cookie. Dzięki plikom cookie wykorzystywanym na tej stronie internetowej w systemach statystyk internetowych autor tej strony, wie jak wielu użytkowników na niego zagląda co konkretnie czytają, oraz co pomijają. Pozwala to stale ulepszać jego stronę.</P>
            <P>Jeżeli uważasz, że obecność plików cookie narusza Twoją prywatność, możesz w każdej chwili je wyłączyć - zarówno dla konkretnej witryny albo w ogóle dla wszystkich połączeń z Twojej przeglądarki (Pamiętaj, że może to skutkować brakiem możliwości działania wybranych funkcjonalności stron internetowych).</P>
            <P><Strong>Jak wyłączyć pliki Cookie w Twojej przeglądarce?</Strong></P>
            <P>Poniżej znajdują się instrukcje wyłączenia plików Cookie w popularnych przeglądarkach internetowych. Jeżeli Twoja przeglądarka nie pasuje do żadnego z podanych poniżej opisów, poszukaj pomocy na stronie twórcy przeglądarki lub w jej pliku pomocy.</P>
            <P><Strong>Google Chrome</Strong></P>
            <P>Przeglądarka ta oprócz możliwości wyczyszczenia plików cookie pozwala przejrzeć szczegółowy opis funkcji prywatności przeglądarki. Aby wyczyścić pliki cookies i inne dane przeglądania, kliknij na przycisk z trzema poziomymi kreskami, który znajduje się po prawej stronie paska adresu - z pojawiającego się menu wybierz „Narzędzia” a następnie „Wyczyść dane przeglądania”. Szczegółowy opis funkcji prywatności przeglądarki znajduje się pod linkiem „Więcej informacji”.</P>
            <P><Strong>Mozilla Firefox</Strong></P>
            <P>Ta przeglądarka udostępnia Ci możliwość określenia czy nie chcesz być śledzony poprzez pliki cookie w ogóle czy też chcesz usunąć określone pliki cookie konkretnych witryn internetowych. Aby określić te ustawienia w menu „Narzędzia” wybierz „Opcje” a w nich zakładkę „Prywatność”.</P>
            <P><Strong>Microsoft Internet Explorer</Strong></P>
            <P>Dzięki specjalnemu suwakowi możesz określić ogólny poziom swoje prywatności. Dodatkowo korzystając z przycisku „Witryny”, możesz decydować o ustawieniach dla konkretnych serwisów internetowych. Aby określić te ustawienia w menu „Narzędzia” wybierz „Opcje internetowe” a w nich zakładkę „Prywatność”.</P>
            <P><Strong>Opera</Strong></P>
            <P>Korzystając z przycisku „Opera” umieszczonego w lewym górnym rogu należy otworzyć menu oraz wybrać w nim „Ustawienia” a dalej opcję „Wyczyść historię przeglądania”. Dodatkowo znajduje się tam przycisk „Zarządzaj ciasteczkami…”, który pozwala na bardziej zaawansowane zarządzanie opcjami dla poszczególnych stron internetowych.</P>
            <P><Strong>Apple Safari</Strong></P>
            <P>Korzystając z menu „Safari” wybierz „Preferencje” a w nim zakładkę „Prywatność”. Zakładka ta zawiera rozbudowane opcje dotyczące plików cookie.</P>
            <P><Strong>Telefony komórkowe, tablety oraz inne urządzenia mobilne</Strong></P>
            <P>Każdy rodzaj urządzenia mobilnego, może obsługiwać taką funkcjonalność w inny sposób zależnie od rodzaju urządzenia i wykorzystywanej platformy. Dlatego należy zapoznać się z ustawieniami prywatności w pliku pomocy, dokumentacji lub instrukcji obsługi danego urządzenia lub systemu operacyjnego.</P>
            <P>Informacje o usługach przedstawione na stronie https://www.motowycena.pl/ obowiązują od 01.01.2022r</P>
          </Section>

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

const Wrapper = styled.main`
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
