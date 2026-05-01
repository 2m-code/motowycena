# Testy formularza kontaktowego
> 1.05.2026, 22:30:25 · 59 PASS · 2 FAIL · 9 INFO

## Wyniki

| Status | Test | Szczegóły |
|--------|------|-----------|
| ✅ PASS | Pole "Imię i nazwisko" istnieje |  |
| ✅ PASS | Label powiązany z "Imię i nazwisko" | "Imię i nazwisko" |
| ✅ PASS | "Imię i nazwisko" required OK |  |
| ✅ PASS | autocomplete "Imię i nazwisko" | name |
| ✅ PASS | Pole "Telefon" istnieje |  |
| ✅ PASS | Label powiązany z "Telefon" | "Telefon" |
| ✅ PASS | "Telefon" required OK |  |
| ✅ PASS | type="tel" na polu telefon |  |
| ✅ PASS | autocomplete "Telefon" | tel |
| ✅ PASS | Pole "Wiadomość" istnieje |  |
| ✅ PASS | Label powiązany z "Wiadomość" | "O co pytasz?" |
| ✅ PASS | "Wiadomość" required OK |  |
| ℹ️ INFO | autocomplete na "Wiadomość" | brak |
| ✅ PASS | Pole "Checkbox RODO" istnieje |  |
| ✅ PASS | Label powiązany z "Checkbox RODO" | "Wyrażam zgodę na przetwarzanie moich danych osobowych w celu odpowiedzi na zapytanie. Polityka prywatności." |
| ✅ PASS | "Checkbox RODO" required OK |  |
| ✅ PASS | Honeypot istnieje |  |
| ✅ PASS | Honeypot tabIndex="-1" |  |
| ✅ PASS | Honeypot aria-hidden="true" |  |
| ✅ PASS | Submit button istnieje |  |
| ℹ️ INFO | Submit button tekst | Wyślij Wiadomość |
| ✅ PASS | HTML5 blokuje pusty submit na #contact-name | Please fill out this field. |
| ✅ PASS | HTML5 blokuje pusty submit na #contact-phone | Please fill out this field. |
| ✅ PASS | HTML5 blokuje pusty submit na #contact-message | Please fill out this field. |
| ✅ PASS | Request NIE wysłany przy pustym formularzu |  |
| ❌ FAIL | Blok klienta: "Same spacje w imieniu" | wysłano: name="   " |
| ℹ️ INFO | Brak maxlength na textarea | actual=5001 znaków |
| ℹ️ INFO | "Telefon jako email" — request wysłany | phone="test@mail.com" — serwer musi walidować |
| ℹ️ INFO | "Telefon: litery" — request wysłany | phone="abcdefgh" — serwer musi walidować |
| ✅ PASS | Blok: "Bez zgody RODO" | nie wysłano bez zgody |
| ℹ️ INFO | XSS w imieniu — wartość w polu | <b>Jan</b> |
| ✅ PASS | XSS: brak renderowania HTML w polu | value="<b>Jan</b>" |
| ✅ PASS | Komunikat sukcesu pojawia się | Dziękujemy! Wiadomość została wysłana. Odezwiemy się wkrótce |
| ✅ PASS | Tekst komunikatu sukcesu OK |  |
| ✅ PASS | Pole "Imię" wyczyszczone po sukcesie |  |
| ✅ PASS | Pole "Telefon" wyczyszczone po sukcesie |  |
| ✅ PASS | Pole "Wiadomość" wyczyszczone po sukcesie |  |
| ✅ PASS | Checkbox odznaczony po sukcesie |  |
| ✅ PASS | Submit button wraca do "Wyślij Wiadomość" | Wyślij Wiadomość |
| ✅ PASS | Komunikat "rate_limited" | "Zbyt wiele prób. Spróbuj ponownie za kilkanaście minut." |
| ✅ PASS | Submit re-enabled po błędzie "rate_limited" |  |
| ✅ PASS | Komunikat "consent_required" | "Zaznacz zgodę na przetwarzanie danych." |
| ✅ PASS | Submit re-enabled po błędzie "consent_required" |  |
| ✅ PASS | Komunikat "captcha_required" | "Potwierdź, że nie jesteś botem." |
| ✅ PASS | Submit re-enabled po błędzie "captcha_required" |  |
| ✅ PASS | Komunikat "captcha_failed" | "Weryfikacja captcha nie powiodła się. Odśwież stronę." |
| ✅ PASS | Submit re-enabled po błędzie "captcha_failed" |  |
| ✅ PASS | Komunikat "invalid_input" | "Sprawdź poprawność pól formularza." |
| ✅ PASS | Submit re-enabled po błędzie "invalid_input" |  |
| ✅ PASS | Komunikat "send_failed" | "Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwo" |
| ✅ PASS | Submit re-enabled po błędzie "send_failed" |  |
| ✅ PASS | Komunikat "UNKNOWN_ERROR" | "Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwo" |
| ✅ PASS | Submit re-enabled po błędzie "UNKNOWN_ERROR" |  |
| ✅ PASS | Tekst "Wysyłanie..." podczas wysyłania | Wysyłanie... |
| ✅ PASS | Submit disabled podczas wysyłania |  |
| ℹ️ INFO | Liczba requestów API przy 5 kliknięciach | 1 |
| ✅ PASS | Double submit protection: wysłano dokładnie 1 request |  |
| ✅ PASS | Brak overflow na mobile 375px |  |
| ❌ FAIL | Input za wąski na mobile | 211px |
| ✅ PASS | Sukces widoczny na mobile |  |
| ℹ️ INFO | Tab order formularza | contact-name → contact-phone → contact-message → contact-consent → A: → BUTTON:submit |
| ✅ PASS | Tab order: name → phone → message → consent |  |
| ✅ PASS | Tab order: consent PRZED submit |  |
| ✅ PASS | aria-required / required na #contact-name |  |
| ✅ PASS | aria-required / required na #contact-phone |  |
| ✅ PASS | aria-required / required na #contact-message |  |
| ℹ️ INFO | Komunikaty status/alert nie są widoczne (OK przy braku akcji) |  |
| ✅ PASS | Label nie jest zastąpiony przez placeholder (label istnieje) |  |
| ✅ PASS | Komunikat błędu przy network error | Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwo |
| ✅ PASS | Submit aktywny po network error |  |

## Screenshoty
`./form-test-screenshots/` (25 plików)
