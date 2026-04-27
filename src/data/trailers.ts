export type Trailer = {
  id: number;
  name: string;
  priceShort: string;
  description: string;
  images: string[];
};

export const imgUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const CAMPERS: Trailer[] = [
  {
    id: 1,
    name: "Tabbert Bellini",
    priceShort: "180-220 zł / doba",
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
      "trailers/T1.jpg",
      "trailers/T2.jpg",
      "trailers/T3.jpg",
      "trailers/T4.jpg",
      "trailers/T5.jpg",
      "trailers/T6.jpg",
    ],
  },
  {
    id: 2,
    name: "Lunar Clubman",
    priceShort: "160-180 zł / doba",
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
      "trailers/lunar1.jpg",
      "trailers/lunar2.jpg",
      "trailers/lunar3.jpg",
      "trailers/lunar4.jpg",
      "trailers/lunar5.jpg",
    ],
  },
];

export const TRANSPORTS: Trailer[] = [
  {
    id: 1,
    name: "Laweta samochodowa – dwuosiowa",
    priceShort: "80 zł / doba",
    description: `Do wynajęcia solidna, dwuosiowa laweta samochodowa, specjalnie przygotowana pod transport niskich samochodów (sportowych, tuningowanych, z dokładkami, splitterami itp.).

DMC 2000KG
Ładowność 1500kg.
Długość platformy 400cm, szerokość 195cm, posiada bardzo niskie korytka boczne co chroni felgi przed uszkodzeniem.

Dlaczego ta laweta?

Niski kąt najazdu – bez problemu wjedziesz obniżonym autem
stabilne najazdy
Dwie osie – bardzo dobra stabilność w trasie
Wciągarka ręczna – pomocna przy aucie niesprawnym
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
    images: ["trailers/L1.jpg", "trailers/L2.jpg"],
  },
  {
    id: 2,
    name: "Przyczepa motocyklowa (3 motocykle)",
    priceShort: "60 zł / doba",
    description: `Do wynajmu przyczepa przystosowana do 3 motocykli.
Wymiary powierzchni załadunku: 225x148,5x31cm
Przyczepa posiada korytko do załadunku, a także jest uchylna.
Wynajem doba 60zł , możliwość wystawienia faktury VAT.`,
    images: ["trailers/P1.jpg", "trailers/P2.jpg"],
  },
];
