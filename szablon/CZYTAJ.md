# Szablon prezentacji z telefonami

Wersja 2.0 · 23.11.2026

Prezentacja działa jako strona w przeglądarce: slajdy na rzutniku, a uczestnicy po zeskanowaniu kodu QR odpowiadają anonimowo z telefonów i widzą wyniki na slajdach. Bez PowerPointa, bez kont i bez instalowania czegokolwiek.

Format podstawowy to historia z decyzjami: sala gra jedną rolę i w kilku scenach wybiera, co zrobić. Po każdym wyborze telefon pokazuje skutek, a na ekranie prowadzący omawiają odpowiedzi według dwóch kryteriów opartych na źródłach.

## Co jest w paczce

| Plik albo folder | Do czego służy |
|---|---|
| `strona/` | Cztery pliki, które trafiają na hosting: `index.html` (telefon), `prowadzacy.html` (slajdy), `qrcode.js` (kod QR), `tresc.js` (treść) |
| `Prezentacja_z_telefonami_PROMPT.md` | Instrukcja dla Claude. Załączasz ją albo wklejasz na początku rozmowy, w której ma powstać nowa prezentacja |
| `test/` | Testy automatyczne dla osób technicznych |
| `CZYTAJ.md` | Ten plik |

W `strona/tresc.js` jest teraz pokaz: krótka historia z trzema decyzjami i dziewięć wzorców dodatkowych (typowanie liczby, głosowanie, praca w grupach, debata i inne). Przy nowej prezentacji zmienia się tylko ten jeden plik.

## Jak obejrzeć pokaz

Potrzebne jest darmowe konto na github.com. Nazwy przycisków są podane według dokumentacji GitHuba z 23.11.2026 i mogą się z czasem zmienić.

1. Na github.com kliknij znak „+” w prawym górnym rogu, potem **New repository**. Wpisz nazwę, zostaw widoczność **Public**, włącz **Add README** i kliknij **Create repository**.
2. W nowym repozytorium kliknij **Add file**, potem **Upload files**. Przeciągnij cztery pliki z folderu `strona` (same pliki, bez folderu) i kliknij **Commit changes**.
3. Kliknij **Settings**, w menu po lewej **Pages**. W części „Build and deployment” ustaw Source na **Deploy from a branch**, Branch na **main** i folder **/ (root)**, potem **Save**.
4. Odczekaj kilka minut i otwórz adres `https://NAZWA-KONTA.github.io/NAZWA-REPOZYTORIUM/prowadzacy.html`.
5. Zeskanuj kod QR telefonem. Slajdy przełączasz strzałkami. Klawisz N otwiera panel prowadzącego, F pełny ekran.

Sama próba bez telefonów: dopisz do adresu `?mock=1`, a w panelu (N) kliknij „Otwórz widok uczestnika w nowej karcie”. Każda taka karta udaje jeden telefon.

## Jak zrobić własną prezentację

1. Otwórz nową rozmowę z Claude.
2. Załącz plik `Prezentacja_z_telefonami_PROMPT.md` (albo wklej jego treść) i tę paczkę. Jeśli paczki nie da się załączyć albo Claude napisze, że nie może jej otworzyć, załącz sam plik `tresc.js` z folderu `strona`.
3. Napisz, o czym ma być prezentacja.
4. Claude odpowie tekstem „Na start” i poprosi o podstawowe dane: temat, okazja, termin, czas, sala, prowadzący i to, co ciebie w temacie ciekawi.
5. Wybierasz, ile pytań chcesz dostać: kilka, kilkanaście albo kilkadziesiąt. Każde pytanie ma gotowe odpowiedzi wymyślone pod twój temat. Odpowiadasz literami, na przykład „1b 2a 3c”, albo własnymi słowami.
6. Z odpowiedzi powstaje pomysł na piśmie. Poprawiasz go albo akceptujesz.
7. Po akceptacji Claude przygotowuje nowy plik `tresc.js` i skrypt słowo w słowo dla prowadzących. Plik wgrywasz na GitHuba tak samo jak w kroku 2 poprzedniej listy; zastąpi stary.

Instrukcja pilnuje też samej treści: jednej myśli przewodniej, początku i końca, przykładów, udziału sali i stylu prowadzącego. Te zasady (sekcja 6, ze źródłami) przydają się przy każdej prezentacji, także bez telefonów.

## Najważniejsze ograniczenia

- Potrzebny jest internet na laptopie prowadzącego i w telefonach.
- W jednej sieci Wi-Fi bezpiecznie mieści się do ok. 25 telefonów (limity darmowego serwisu ntfy.sh, przez który idą wiadomości). To liczba wyliczona z dokumentacji, nie zmierzona w sali.
- Wszyscy uczestnicy przechodzą te same sceny w tej samej kolejności. Od wcześniejszych wyborów zależą teksty skutków, oceny i zakończenie.
- To narzędzie na zajęcia w znanej grupie. Nie chroni przed kimś, kto celowo chce zepsuć wyniki, więc nie nadaje się do głosowań, od których coś zależy.
- Wyniki nie są nigdzie zapisywane na stałe. Jeśli będą potrzebne, zrób zrzuty ekranu slajdów.

Szczegóły, listy kontrolne i postępowanie przy awariach są w pliku `Prezentacja_z_telefonami_PROMPT.md`.

## Testy (dla osób technicznych)

Wymagają Pythona z pakietem `playwright` i przeglądarką Chromium, a drugi tryb także Node.js. Uruchamiane z głównego folderu paczki:

```
python3 test/e2e.py strona mock zrzuty-mock
python3 test/e2e.py strona serwer zrzuty-serwer
```

Na niezmienionej paczce pierwsze polecenie kończy się linią „95 z 95 sprawdzeń poprawnych”, drugie „106 z 106 sprawdzeń poprawnych”, a oba linią „Błędy stron: brak”.

## Cudze składniki

- `qrcode.js` to biblioteka qrcode-generator 1.4.4, autor Kazuhiko Arase, licencja MIT. „QR Code” jest zastrzeżonym znakiem towarowym DENSO WAVE INCORPORATED.
- Wiadomości między telefonami a slajdami przenosi publiczny serwis ntfy.sh.
