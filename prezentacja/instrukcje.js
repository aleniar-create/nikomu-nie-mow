// Instrukcje do wklejenia w dowolny czat AI. Są krótkie, żeby zmieściły się także w darmowych czatach,
// a strona umie podzielić je na części dla czatów, które nie przyjmują długich wiadomości.
(function (root) {
'use strict';
var I = {};
var TRYBY = {
  kilka: { ile: 'ok. 6–9', o: 'rolę sali i bohatera; listę scen (zaproponuj 6–8 możliwych, wybiorę); dwa kryteria oceny; myśl przewodnią; tytuł' },
  kilkanascie: { ile: 'ok. 15–20', o: 'rolę sali i bohatera; listę scen (zaproponuj 6–8 możliwych, wybiorę); dwa kryteria oceny; myśl przewodnią; każdą scenę z osobna (dylemat i cztery odpowiedzi); początek i koniec zajęć; epilog; język i ton; tytuł' },
  kilkadziesiat: { ile: 'ok. 30–50', o: 'rolę sali i bohatera; listę scen (zaproponuj 6–8 możliwych, wybiorę); dwa kryteria oceny; myśl przewodnią; każdą scenę z osobna (dylemat i cztery odpowiedzi); fakty pomocnicze do każdej sceny; skutek każdej odpowiedzi; dokładne brzmienie odpowiedzi; początek i koniec zajęć; epilog; język i ton; podział ról między prowadzących; tytuł' }
};
function t(x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); }
// ile decyzji mieści się w czasie zajęć: ok. 7 minut na początek, epilog i koniec, ok. 3 minuty na decyzję
I.liczbaDecyzji = function (minuty) { var m = Number(minuty) || 20; return Math.max(2, Math.min(6, Math.round((m - 7) / 3.2))); };

I.rozmowa = function (f) {
  var tr = TRYBY[f.tryb] || TRYBY.kilka, dane = ['Temat: ' + (t(f.temat) || '(wpiszę w pierwszej odpowiedzi)')];
  if (t(f.okazja)) dane.push('Okazja: ' + t(f.okazja));
  dane.push('Czas: ' + (Number(f.minuty) || 20) + ' minut');
  if (t(f.sala)) dane.push('Sala: ' + t(f.sala));
  dane.push('Prowadzący: ' + (Number(f.prowadzacy) > 1 ? Number(f.prowadzacy) + ' osoby' : '1 osoba'));
  if (t(f.ciekawi)) dane.push('Co mnie w temacie ciekawi: ' + t(f.ciekawi));
  if (t(f.wymagania)) dane.push('Wymagania osoby oceniającej: ' + t(f.wymagania));
  return 'Pomóż mi przygotować zajęcia w formacie „historia z decyzjami”. Pisz po polsku, prostym językiem.\n\n' +
    'MOJE DANE\n' + dane.join('\n') + '\n\n' +
    'FORMAT\nSala gra jedną rolę („jesteś…”) i w kilku scenach decyduje, co zrobić w sprawie wymyślonego bohatera. Każda scena ma: krótki opis sytuacji, dwa fakty pomocnicze, pytanie i cztery odpowiedzi, z których jedna kusi, ale jest błędna. ' +
    'Po wyborze uczestnik widzi na telefonie skutek swojej odpowiedzi, a na ekranie omawiamy wszystkie odpowiedzi według dwóch stałych kryteriów (ocena: tak, nie albo różnie, z uzasadnieniem). ' +
    'Jedna scena to ok. 3 minuty, więc przy moim czasie zmieści się ich ok. ' + I.liczbaDecyzji(f.minuty) + '.\n\n' +
    'JAK MASZ PRACOWAĆ\n' +
    '1. Zadawaj mi pytania z gotowymi odpowiedziami a), b), c), d). Każda odpowiedź ma być konkretnym pomysłem wymyślonym dla mojego tematu, a nie ogólną kategorią. Przy jednej dopisz „polecam” i jedno zdanie dlaczego. Mogę też odpowiedzieć po swojemu.\n' +
    '2. Pierwsza wiadomość: tylko jedno pytanie, czyli trzy albo cztery różne pomysły na całość. W każdym: kim jest sala, kim bohater, o co toczy się gra i z jaką myślą sala ma wyjść.\n' +
    '3. Potem zadawaj po trzy pytania w wiadomości. Odpowiem kodem, np. „1b 2a 3c”. Kolejne pytania mają wynikać z moich odpowiedzi.\n' +
    '4. Zapytaj łącznie o: ' + tr.o + '. To ma być ' + tr.ile + ' pytań. O resztę nie pytaj, tylko zdecyduj i wypisz swoje decyzje w pomyśle.\n' +
    '5. Nie wymyślaj przepisów, badań ani liczb. Jeśli nie masz pewności, dopisz „(do sprawdzenia)”.\n' +
    '6. Po pytaniach napisz POMYSŁ: tytuł; myśl przewodnia w jednym zdaniu; rola sali; dwa kryteria oceny; dla każdej sceny: kiedy się dzieje, co się dzieje, pytanie, cztery odpowiedzi i która jest najlepsza; lista „Do sprawdzenia”.\n' +
    '7. Zapytaj, czy akceptuję pomysł. Poprawiaj go, aż napiszę „akceptuję”. Potem czekaj na moje następne polecenie.\n\n' +
    'Zacznij teraz od pierwszego pytania.';
};

I.WZOR = [
'TYTUŁ: [tytuł prezentacji]',
'AUTORZY: {AUTORZY}',
'MYŚL PRZEWODNIA: [jedno zdanie, najwyżej 15 słów]',
'ROLA: [kim jest sala, 1–3 zdania zaczynające się od „Jesteś…”]',
'KRYTERIUM 1: [krótkie pytanie, np. Zgodne z prawem?]',
'KRYTERIUM 2: [krótkie pytanie]',
'PYTANIE PRZED I PO: [jedno pytanie do sali z odpowiedziami tak / nie / to zależy, zadawane na początku i na końcu]',
'',
'=== DECYZJA 1 ===',
'KIEDY: [dzień i godzina, np. Wtorek, 16:40]',
'NAZWA: [2–4 słowa]',
'SCENA: [3–5 krótkich zdań]',
'NA SLAJD: [ta sama scena w 1–2 zdaniach]',
'FAKT 1: [fakt potrzebny do decyzji]',
'FAKT 2: [drugi fakt]',
'PYTANIE: Co robisz?',
'A: [pełna odpowiedź w jednym zdaniu]',
'A SKRÓT: [najwyżej 30 znaków]',
'A SKUTEK: [1–2 zdania]',
'A OCENA: [tak / nie / różnie], [tak / nie / różnie]',
'A DLACZEGO: [jedno zdanie z podstawą oceny]',
'[tak samo B, C i D, a potem następne decyzje]',
'',
'=== EPILOG ===',
'ZAKOŃCZENIE DOBRE: [1–2 zdania dla osób, których decyzje spełniły oba kryteria]',
'ZAKOŃCZENIE MIESZANE: [gdy spełniła je mniej więcej połowa decyzji]',
'ZAKOŃCZENIE SŁABE: [gdy większość decyzji ich nie spełniła]',
'PYTANIE NA KONIEC: [pytanie, z którym sala wychodzi]',
'',
'=== ŹRÓDŁA ===',
'- [autor, rok, tytuł]',
'',
'=== DO SPRAWDZENIA ===',
'- [fakt, przepis albo liczba do sprawdzenia]'
].join('\n');

// pomysl: tekst zaakceptowanego pomysłu wklejony na stronie; wtedy polecenie działa także w nowej rozmowie albo w innym czacie
I.karta = function (f, pomysl) {
  var p = String(pomysl || '').trim();
  return (p ? 'Oto pomysł na zajęcia w formacie „historia z decyzjami” (sala gra jedną rolę i w kilku scenach decyduje, co zrobić w sprawie wymyślonego bohatera):\n\n' + p + '\n\n' : '') +
    'Zapisz ' + (p ? 'ten' : 'zaakceptowany') + ' pomysł jako KARTĘ PREZENTACJI według wzoru poniżej.\n\n' +
    'ZASADY\n' +
    '- Zachowaj etykiety i kolejność ze wzoru. W miejsce nawiasów kwadratowych wpisz treść. Nie dodawaj komentarzy.\n' +
    '- Oddaj kartę w jednym bloku kodu, zwykłym tekstem: bez tabel i pogrubień.\n' +
    '- Sceny pisz w drugiej osobie i w czasie teraźniejszym („wchodzisz”, „słyszysz”), bez form zależnych od płci.\n' +
    '- SKUTEK mówi, co się stało, i niczego nie ocenia. OCENA to dwa słowa: pierwsze dla kryterium 1, drugie dla kryterium 2; do wyboru: tak, nie, różnie.\n' +
    '- W każdej decyzji jest jedna odpowiedź z oceną „tak, tak” i za każdym razem stoi pod inną literą.\n' +
    '- Nie wymyślaj przepisów, badań ani liczb. Wszystko, czego nie jesteś pewien, wpisz do części DO SPRAWDZENIA.\n' +
    '- Jeśli karta nie mieści się w jednej wiadomości, przerwij po pełnej decyzji i napisz KONTYNUACJA. Gdy napiszę „dalej”, pisz od następnej decyzji.\n\n' +
    'WZÓR\n' + I.WZOR.replace('{AUTORZY}', t(f && f.autorzy) || '[imiona i nazwiska prowadzących]');
};

I.skrypt = function (f, karta) {
  var n = Number(f && f.prowadzacy) || 1, k = String(karta || '').trim();
  return (k ? 'Oto karta prezentacji w formacie „historia z decyzjami”:\n\n' + k + '\n\n' : '') +
    'Na podstawie ' + (k ? 'tej karty' : 'karty prezentacji') + ' napisz SKRYPT DLA PROWADZĄCYCH: słowo w słowo to, co mam powiedzieć.' + (n > 1 ? ' Prowadzących jest ' + n + ': podziel kwestie i podpisz, kto mówi.' : '') + '\n\n' +
    'UKŁAD\n' +
    '1. POCZĄTEK (ok. 1 minuty): zacznij od sceny, pytania albo zaskakującego faktu. Bez planu zajęć i bez przedstawiania się na wstępie.\n' +
    '2. Dla każdej decyzji:\n' +
    '   - WEJŚCIE: jedno zdanie o czasie i miejscu.\n' +
    '   - SCENA: przepisz ją z karty; czytam ją na głos bez komentarza.\n' +
    '   - FAKTY: jedno zdanie wprowadzenia i dwa fakty.\n' +
    '   - WYBORY SALI: jedno zdanie, którym skomentuję wynik bez oceniania, i jedno pytanie do osoby z sali.\n' +
    '   - OMÓWIENIE: dla każdej odpowiedzi 1–2 zdania: co mówi kryterium 1, co kryterium 2 i dlaczego. Najwięcej o odpowiedzi kuszącej, ale błędnej.\n' +
    '   - PRZEJŚCIE: jedno zdanie do następnej sceny.\n' +
    '3. EPILOG: dwa zdania o tym, co widać na ekranie, i pytanie na koniec.\n' +
    '4. KONIEC (ok. 1 minuty): co z tego wynika dla sali; wróć do sceny z początku i zamknij ją jednym zdaniem. Nie streszczaj zajęć.\n\n' +
    'JĘZYK\nJak w rozmowie: krótkie zdania, jedna informacja w zdaniu. Bez zapowiadania budowy („najpierw…, potem…”) i bez haseł w rodzaju „Wyobraźcie sobie”. ' +
    'Całość ma się zmieścić w ' + (Number(f && f.minuty) || 20) + ' minutach przy tempie 125 słów na minutę. Policz słowa i podaj wynik na końcu.';
};

I.poprawki = function (uwagi, karta) {
  var k = String(karta || '').trim();
  return (k ? 'Oto karta prezentacji:\n\n' + k + '\n\n' : '') +
    'W karcie prezentacji trzeba poprawić kilka rzeczy. Popraw tylko wskazane miejsca i oddaj całą kartę jeszcze raz, w tym samym formacie, w jednym bloku kodu.\n\n' +
    uwagi.map(function (u, i) { return (i + 1) + '. ' + u; }).join('\n');
};

// dzieli długą instrukcję na części nie dłuższe niż limit znaków; każda część mówi czatowi, czy ma jeszcze czekać
I.podziel = function (tekst, limit) {
  limit = limit || 1800;
  if (tekst.length <= limit) return [tekst];
  var miejsce = limit - 140, kawalki = [], bież = '';
  function doloz(fragment, lacznik) {
    if (bież && (bież + lacznik + fragment).length > miejsce) { kawalki.push(bież); bież = fragment; } else bież = bież ? bież + lacznik + fragment : fragment;
  }
  tekst.split('\n').forEach(function (linia) {
    if (linia.length <= miejsce) { doloz(linia, '\n'); return; }
    (linia.match(/[^.;:!?]+[.;:!?]*\s*/g) || [linia]).map(function (z) { return z.trim(); }).filter(Boolean).forEach(function (zdanie, i) {   // bardzo długa linia: tnij na zdania
      while (zdanie.length > miejsce) { doloz(zdanie.slice(0, miejsce), i ? ' ' : '\n'); zdanie = zdanie.slice(miejsce); }
      doloz(zdanie, i ? ' ' : '\n');
    });
  });
  if (bież) kawalki.push(bież);
  var n = kawalki.length;
  return kawalki.map(function (k, i) {
    return i < n - 1 ? 'CZĘŚĆ ' + (i + 1) + ' z ' + n + '. To fragment dłuższej instrukcji. Niczego jeszcze nie rób, odpowiedz tylko: OK.\n\n' + k
      : 'CZĘŚĆ ' + n + ' z ' + n + ' (ostatnia). Masz już całą instrukcję. Zacznij ją wykonywać.\n\n' + k;
  });
};

root.Instrukcje = I;
if (typeof module !== 'undefined' && module.exports) module.exports = I;
})(typeof window !== 'undefined' ? window : globalThis);
