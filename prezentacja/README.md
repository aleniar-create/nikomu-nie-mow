# Prezentacja z telefonami

Strona: **https://aleniar-create.github.io/nikomu-nie-mow/prezentacja/**

Wersja 1.0 · 23.11.2026

## Co to jest

Prezentacja, w której sala decyduje. Uczestnicy skanują kod QR, wcielają się w jedną rolę i w kilku scenach wybierają telefonem, co zrobić w sprawie wymyślonego bohatera. Każdy widzi skutek swojej decyzji. Na dużym ekranie widać, jak wybrała sala, i ocenę każdej odpowiedzi według dwóch kryteriów ustalonych przez autora. Na końcu każdy dostaje na telefonie własne zakończenie.

Autor nie zakłada konta, niczego nie instaluje i nie potrzebuje własnej strony. Treść powstaje w rozmowie z dowolnym czatem AI (ChatGPT, Gemini, Copilot, Claude albo innym, także darmowym) albo ręcznie.

## Jak zrobić prezentację

1. **Podstawy.** Na stronie wpisujesz temat, czas, salę i to, co cię w temacie ciekawi.
2. **Rozmowa z czatem.** Kopiujesz instrukcję ze strony do swojego czatu. Czat zadaje pytania z gotowymi odpowiedziami i opisuje pomysł.
3. **Karta.** Drugie polecenie każe czatowi zapisać prezentację jako kartę, czyli zwykły tekst z etykietami. Wklejasz ją na stronie, a strona sprawdza kartę i pisze, co poprawić.
4. **Start.** Oglądasz podgląd, drukujesz skrypt dla prowadzących i klikasz „Uruchom prezentację”.

W dniu zajęć otwierasz stronę na laptopie podłączonym do rzutnika, klikasz „Uruchom prezentację”, a sala skanuje kod QR.

## Co warto wiedzieć

- Czat może podać zmyślony przepis albo liczbę. Fakty sprawdza autor.
- Potrzebny jest internet na laptopie i w telefonach.
- W jednej sieci Wi-Fi mieści się do ok. 25 telefonów. To rachunek z limitów serwisu ntfy.sh, a nie pomiar w sali.
- To narzędzie na zajęcia w znanej grupie. Nie nadaje się do głosowań, od których coś zależy.
- Wyniki nie są nigdzie zapisywane.

## Jak to działa

- Wszystko jest zbiorem zwykłych plików na GitHub Pages. Nie ma serwera ani bazy danych.
- Karta prezentacji zostaje w przeglądarce autora (i w pliku, który autor pobierze).
- W trakcie zajęć strona prowadzącego wysyła na telefony kolejne ekrany, a telefony odsyłają odpowiedzi. Wiadomości przenosi publiczny serwis [ntfy.sh](https://ntfy.sh).
- Każdy ekran wysyłany na telefony jest podpisany kluczem, który zostaje w przeglądarce prowadzącego. Telefony przyjmują tylko ekrany z poprawnym podpisem, więc nikt z sali nie podmieni treści. Odpowiedzi z telefonów nie są podpisywane.
- Tekst z karty jest wyświetlany jako zwykły tekst, bez wykonywania kodu.

## Co jest w tym folderze

| Plik albo folder | Do czego służy |
|---|---|
| `index.html` | Strona dla autorów: kroki, instrukcje dla czatu, sprawdzanie karty |
| `instrukcje.js` | Teksty instrukcji dla czatu i dzielenie ich na części |
| `podglad.html` | Podgląd: duży ekran i telefon obok siebie, bez internetu |
| `skrypt.html` | Skrypt dla prowadzących do druku, tworzony z karty |
| `sala/index.html` | Strona na telefonie uczestnika (adres z kodu QR) |
| `sala/prowadzacy.html` | Slajdy, minutnik i panel prowadzącego |
| `sala/karta.js` | Czytanie i sprawdzanie karty, budowa slajdów, podpis ekranów |
| `sala/qrcode.js` | Rysowanie kodu QR (biblioteka qrcode-generator 1.4.4, Kazuhiko Arase, licencja MIT) |
| `sala/tresc.js` | Pokaz pełnej wersji: historia z decyzjami i dziewięć wzorców dodatkowych |
| `pliki/` | Pełna wersja dla Claude: instrukcja i paczka z plikami do własnego hostingu |
| `testy/` | Testy automatyczne |

## Format karty

Karta to zwykły tekst. Każda linia zaczyna się od etykiety i dwukropka, a części karty oddzielają nagłówki w rodzaju `=== DECYZJA 1 ===`. Pełny wzór jest w pliku `instrukcje.js`, a działający przykład wczytuje przycisk „Wczytaj przykład” na stronie.

Czytanie karty jest tolerancyjne: nie przeszkadzają pogrubienia, nagłówki i listy z czatu, brak polskich znaków w etykietach, odpowiedzi zapisane jako „A)” ani karta oddana w kilku częściach.

## Testy

Wymagają Node.js oraz Pythona z pakietem `playwright` i przeglądarką Chromium. Z głównego folderu repozytorium:

```
sh prezentacja/testy/wszystko.sh prezentacja /tmp/zrzuty
```

Na niezmienionych plikach wynik to: karta 49 z 49, pokaz 95 z 95 i 106 z 106, tryb karty 39 z 39 i 42 z 42, strona dla autorów 34 z 34.

Testy używają serwera podstawionego na komputerze testującego. Nie sprawdzają prawdziwego serwisu ntfy.sh ani prawdziwych telefonów.

## Cudze składniki

- `qrcode.js`: qrcode-generator 1.4.4, Kazuhiko Arase, licencja MIT. „QR Code” jest zastrzeżonym znakiem towarowym DENSO WAVE INCORPORATED.
- Wiadomości przenosi publiczny serwis ntfy.sh.
