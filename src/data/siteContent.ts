export type Trailer = {
  id: number;
  name: string;
  priceShort: string;
  description: string;
  images: string[];
};

export type OfferSectionContent = {
  kicker: string;
  title: string;
  lead: string;
  badge: string;
  badgeColor: string;
  trailers: Trailer[];
};

export type HeroContent = {
  kicker: string;
  titlePrefix: string;
  titleAccent: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  image: string;
};

export type ContactContent = {
  kicker: string;
  title: string;
  lead: string;
  phone: string;
  email: string;
  address: string;
};

export type LegalDocumentContent = {
  title: string;
  updatedAt: string;
  body: string;
};

export type SiteContent = {
  hero: HeroContent;
  highlights: string[];
  camping: OfferSectionContent;
  transport: OfferSectionContent;
  contact: ContactContent;
  legal: {
    privacy: LegalDocumentContent;
    terms: LegalDocumentContent;
  };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    kicker: 'Twój Partner w Podróży',
    titlePrefix: 'Kierunek -',
    titleAccent: 'wolność.',
    subtitle:
      'Wynajmujemy komfortowe przyczepy kempingowe znanych marek takich jak Tabbert, Lunar, Dethleffs.',
    primaryCta: 'Zobacz Przyczepy',
    secondaryCta: 'Skontaktuj Się',
    image: 'trailers/T1.jpg',
  },
  highlights: [
    'Przyczepy kempingowe klasy premium',
    'Laweta dwuosiowa i przyczepa motocyklowa',
  ],
  camping: {
    kicker: 'Oferta Kempingowa',
    title: 'Twój hotel z niezłym widokiem.',
    lead:
      'Zadbana, w pełni wyposażona flota na każdy rodzaj wakacji. Tabbert Bellini klasy premium i bogato wyposażony Lunar Clubman - pełna niezależność na kempingu.',
    badge: 'Kemping',
    badgeColor: '#0066FF',
    trailers: [
      {
        id: 1,
        name: 'Tabbert Bellini',
        priceShort: '180-220 zł / doba',
        description: `Do wynajęcia przestronna, zadbana przyczepa kempingowa Tabbert Bellini - idealna na wakacje z rodziną, wyjazd nad morze, jezioro lub w góry.

Przyczepa klasy premium - komfort jak w apartamencie, pełna niezależność na kempingu.
DMC: 2000 kg
Stabilizator jazdy AL-KO - bezpieczna i stabilna podróż
Wewnętrzny zbiornik wody: 90L
Panel solarny i akumulator - pełna niezależność od źródła prądu

Układ i miejsca do spania:

Oddzielna sypialnia z dużym łóżkiem małżeńskim
Przestronny salon w układzie „U” - rozkładany do spania
Łącznie do 4-5 osób

Kuchnia:

Lodówka
Zlewozmywak z pokrywą
Dużo szafek i miejsca do przechowywania

Łazienka:

Toaleta kasetowa
Prysznic
Umywalka

Wyposażenie dodatkowe:

Telewizor
Ogrzewanie
Rolety i moskitiery w oknach
Dwuosiowa - stabilna i bezpieczna w prowadzeniu
Klimatyzacja

Przyczepa czysta i w bardzo dobrym stanie
Gotowa do drogi
Idealna na rodzinne wakacje

Możliwość odbioru osobistego lub podstawienia na miejsce lub wybrane pole kempingowe (do ustalenia).

Cennik:
Październik- kwiecień: 180 zł / doba
Maj - wrzesień: 220 zł / doba
Kaucja zwrotna: 1500 zł
Obowiązuje opłata serwisowa 250zł (obejmuje chemię do toalety, pełną butlę gazową, oraz papier toaletowy), opłata nie jest pobierana za wynajem powyżej 5 dni.
Wystawiamy faktury VAT lub paragon.`,
        images: [
          'trailers/T1.jpg',
          'trailers/T2.jpg',
          'trailers/T3.jpg',
          'trailers/T4.jpg',
          'trailers/T5.jpg',
          'trailers/T6.jpg',
        ],
      },
      {
        id: 2,
        name: 'Lunar Clubman',
        priceShort: '160-180 zł / doba',
        description: `Marzysz o wakacjach bez ograniczeń, blisko natury, z pełnym komfortem?
Do wynajęcia wyjątkowa przestronna i bogato wyposażona przyczepa kempingowa Lunar Clubman - idealną dla 4-5 osób.

Lunar Clubman
Miejsca do spania: 4-5
DMC: 1450 kg
Stabilizator jazdy AL-KO - bezpieczna i stabilna podróż
Wewnętrzny zbiornik wody: 70L
Panel solarny i akumulator - pełna niezależność od źródła prądu

Wyposażenie:

Bardzo duża przestrzeń wewnątrz

Oddzielna sypialnia z przegrodą

Osobna łazienka z prysznicem i WC

Lodówka z dużym zamrażalnikiem (230V, 12V,)

Ogrzewanie TRUMA - TRUMATIC (gaz + grzałka elektryczna) z rozprowadzeniem ciepła

Mikrofalówka

Kuchenka 3-palnikowa, opiekacz i piekarnik

Szyberdach i elektryczny wentylator (nawiew / wyciąg)

Ciepła i zimna woda

Rozkładany stoliczek

Wszystkie okna otwierane, moskitiery, rolety

Radio, oświetlenie LED

Stopień wejściowy

Czujnik gazu i dymu

Toaleta z elektryczną spłuczką - opróżnianie i woda uzupełniane z zewnątrz

Cennik:
Październik- kwiecień: 160 zł / doba
Maj - wrzesień: 180 zł / doba
Kaucja zwrotna: 1500 zł
Dopłata do wersji z klimatyzacją +20zł/doba
Obowiązuje opłata serwisowa 250zł (obejmuje chemię do toalety, pełną butlę gazową, oraz papier toaletowy), opłata nie jest pobierana za wynajem powyżej 5 dni.
Możliwość pomocy w transporcie lub podstawieniu przyczepy w wybrane miejsce - do uzgodnienia.

Wystawiamy paragon lub fakturę VAT.
W ofercie posiadamy również inne przyczepy.`,
        images: [
          'trailers/lunar1.jpg',
          'trailers/lunar2.jpg',
          'trailers/lunar3.jpg',
          'trailers/lunar4.jpg',
          'trailers/lunar5.jpg',
        ],
      },
    ],
  },
  transport: {
    kicker: 'Oferta Transportowa',
    title: 'Mamy dwie mocne sztuki.',
    lead:
      'Oprócz rekreacji, zajmujemy się tym co praktyczne. Potrzebujesz przewieźć obniżone auto lub trzy motocykle? Polecamy nasze przyczepy transportowe.',
    badge: 'Transport',
    badgeColor: '#1E293B',
    trailers: [
      {
        id: 1,
        name: 'Laweta samochodowa - dwuosiowa',
        priceShort: '80 zł / doba',
        description: `Do wynajęcia solidna, dwuosiowa laweta samochodowa, specjalnie przygotowana pod transport niskich samochodów (sportowych, tuningowanych, z dokładkami, splitterami itp.).

DMC 2000KG
Ładowność 1500kg.
Długość platformy 400cm, szerokość 195cm, posiada bardzo niskie korytka boczne co chroni felgi przed uszkodzeniem.

Dlaczego ta laweta?

Niski kąt najazdu - bez problemu wjedziesz obniżonym autem
stabilne najazdy
Dwie osie - bardzo dobra stabilność w trasie
Wciągarka ręczna - pomocna przy aucie niesprawnym
Liczne punkty mocowania pasów
Koło zapasowe

Laweta zadbana, w pełni sprawna, gotowa do drogi.

Idealna do transportu:
aut sportowych
samochodów z obniżonym zawieszeniem
projektów tuningowych
aut uszkodzonych
klasyków
quadów i mniejszych maszyn

Wystawiamy faktury VAT lub paragon.`,
        images: ['trailers/L1.jpg', 'trailers/L2.jpg'],
      },
      {
        id: 2,
        name: 'Przyczepa motocyklowa (3 motocykle)',
        priceShort: '60 zł / doba',
        description: `Do wynajmu przyczepa przystosowana do 3 motocykli.
Wymiary powierzchni załadunku: 225x148,5x31cm
Przyczepa posiada korytko do załadunku, a także jest uchylna.
Wynajem doba 60zł , możliwość wystawienia faktury VAT.`,
        images: ['trailers/P1.jpg', 'trailers/P2.jpg'],
      },
    ],
  },
  contact: {
    kicker: 'Kontakt',
    title: 'Czas rezerwować\nTwój termin',
    lead:
      'Sprawdź dostępność przyczepy. Napisz lub zadzwoń, a przygotujemy dla Ciebie całą umowę pod wypożyczenie.',
    phone: '+48 692 376 595',
    email: 'biuro@eprzyczepy.eu',
    address: 'Ul. Spacerowa, 63-430 Garki',
  },
  legal: {
    privacy: {
      title: 'Polityka Prywatności i Polityka Cookies',
      updatedAt: '1 maja 2026',
      body: `§1
POSTANOWIENIA OGÓLNE

Niniejsza Polityka Prywatności i Polityka Cookies określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników oraz plików Cookies, a także innych technologii pojawiających się na stronie internetowej https://www.eprzyczepy.eu/

W razie jakichkolwiek wątpliwości w zakresie postanowień niniejszej Polityki Prywatności i Polityki Cookies proszę kontaktować się z Administratorem poprzez adres e-mail biuro@eprzyczepy.eu

Wszelkie dane osobowe i adresowe podane przez Użytkownika na stronie https://www.eprzyczepy.eu/ nie będą w jakikolwiek sposób udostępniane ani odsprzedawane osobom trzecim.

Administrator zastrzega sobie prawo do wprowadzania zmian w polityce prywatności, a każdego Użytkownika strony obowiązuje znajomość aktualnej polityki prywatności.

§2
DEFINICJE

„Administrator" - MOTOWYCENA RAFAŁ PELCZAR ul.Spacerowa 10, 63-430 Garki

„Użytkownik" - każdy podmiot przebywający na stronie i korzystający z niej.

„Strona" - strona internetowa znajdująca się pod adresem https://www.eprzyczepy.eu/

§3
DANE OSOBOWE

Administratorem danych osobowych Użytkownika jest Administrator. Użytkownik dobrowolnie podaje dane osobowe za pomocą formularzy znajdujących się na Stronie.

Użytkownikowi przysługuje prawo dostępu do treści jego danych oraz możliwość ich poprawiania, sprostowania lub żądania ograniczenia ich przetwarzania. Użytkownik ma prawo do przenoszenia jego danych osobowych i wniesienia skargi do Prezesa UODO.

Dane Użytkownika nie będą przekazywane żadnemu innemu podmiotowi, ani poza obszar Unii Europejskiej.

§4
KONTAKT E-MAIL

Kontaktując się za pośrednictwem poczty elektronicznej lub formularza kontaktowego, przekazujesz dane niezbędne do udzielenia odpowiedzi. Dane są przetwarzane w celu kontaktu oraz archiwizacji korespondencji.

§5
TECHNOLOGIE

W celu korzystania ze strony internetowej niezbędne jest posiadanie urządzenia z dostępem do sieci Internet, aktywnej skrzynki elektronicznej oraz przeglądarki internetowej.

§6
WYŁĄCZENIE ODPOWIEDZIALNOŚCI

Administrator nie ponosi odpowiedzialności za wykorzystanie treści zawartych na Stronie lub działania podejmowane na ich podstawie.

§7
POLITYKA PLIKÓW COOKIES

Strona internetowa może zapisywać w przeglądarce pliki cookie. Dzięki plikom cookie możliwe jest utrzymanie prawidłowego działania strony oraz analiza sposobu korzystania ze strony. Użytkownik może w każdej chwili wyłączyć obsługę plików cookie w ustawieniach przeglądarki.

Informacje o usługach przedstawione na stronie https://www.eprzyczepy.eu/ obowiązują od 01.05.2026 r.`,
    },
    terms: {
      title: 'Regulamin',
      updatedAt: '1 maja 2026',
      body: `§1
POSTANOWIENIA OGÓLNE

Niniejszy regulamin określa podstawowe zasady korzystania ze strony internetowej EPRZYCZEPY.EU oraz kontaktu w sprawie wynajmu przyczep.

§2
OFERTA

Informacje przedstawione na stronie mają charakter informacyjny i nie stanowią oferty w rozumieniu Kodeksu cywilnego. Szczegółowe warunki wynajmu, terminy, ceny oraz dostępność są potwierdzane indywidualnie.

§3
REZERWACJE I KONTAKT

Zapytanie wysłane przez formularz kontaktowy nie oznacza automatycznej rezerwacji. Rezerwacja wymaga potwierdzenia przez właściciela wypożyczalni oraz ustalenia szczegółów wynajmu.

§4
ODPOWIEDZIALNOŚĆ

Użytkownik korzysta ze strony zgodnie z jej przeznaczeniem. Administrator dokłada starań, aby prezentowane informacje były aktualne, jednak zastrzega możliwość wystąpienia zmian w ofercie.

§5
ZMIANY REGULAMINU

Administrator może zmienić regulamin, publikując jego aktualną wersję na stronie internetowej.`,
    },
  },
};

export const imgUrl = (source: string) => {
  if (/^(https?:)?\/\//.test(source) || source.startsWith('/')) return source;
  return `${import.meta.env.BASE_URL}${source}`;
};
