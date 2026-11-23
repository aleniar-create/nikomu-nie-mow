// TREŚĆ PREZENTACJI — jedyny plik, który zmieniasz przy nowej prezentacji.
// Ładują go obie strony: index.html (telefon uczestnika) i prowadzacy.html (slajdy na rzutniku).
// Plik jest publiczny (każdy z linkiem może go otworzyć), więc nie wpisuj tu niczego poufnego.
// Po każdej zmianie otwórz prowadzacy.html?mock=1 — pomyłki w tym pliku strona wypisze w lewym górnym rogu.
//
// To, co jest tu teraz, to POKAZ: działająca prezentacja z dwiema częściami.
//   1. HISTORIA Z DECYZJAMI — format podstawowy: sala gra jedną rolę i podejmuje kolejne decyzje.
//   2. WZORCE DODATKOWE — dziewięć innych sposobów użycia telefonów.
// Przy nowej prezentacji podmień dane historii, zostaw potrzebne wzorce, resztę usuń.

// ===================== HISTORIA Z DECYZJAMI: dane =====================
// Jedna decyzja to: scena, dwa fakty, cztery odpowiedzi, skutek na telefonie,
// a na slajdzie wynik sali i tabela ocen według dwóch kryteriów.
// „scena” to pełny tekst na telefon, „streszczenie” to jedno–dwa zdania na slajd. Źródło faktu dopisz w nawiasie na jego końcu.
// Historia jest wymyślona. W prawdziwej prezentacji fakty i oceny mają źródła (przepis, badanie, kodeks).
const HIST = {
  kryteria: ['Zmieścisz się w czasie?', 'Sala coś z tego wyniesie?'],
  znaki: { tak: '✓ tak', nie: '✗ nie', rozne: '? nie ma jednej odpowiedzi' },
  warianty: [['sam', 'Sam'], ['para', 'We dwoje']],   // wybór na starcie (klucz „tryb”); zmienia część skutków i ocen
  czas: 30,   // ile sekund odmierza pasek na telefonie przy każdej decyzji (0 = bez paska)
  decyzje: [
    { id: 'd1', kiedy: 'Wieczór, 20:00', nazwa: 'Za dużo slajdów',
      scena: '<p class="kw">Robisz próbę z zegarkiem. Wychodzi 31 minut.</p><p class="kw">Jutro masz na to 20.</p>',
      streszczenie: 'Próba z zegarkiem: 31 minut. Jutro masz 20.',
      fakty: ['Sala nie zna tematu, a połowa slajdów to definicje.', 'Najciekawsza część wypada dopiero w 28. minucie próby.'],
      pytanie: 'Co robisz?',
      opcje: [   // [wartość, pełna odpowiedź na telefonie, skrót na slajd]
        ['A', 'Mówię szybciej i niczego nie wycinam.', 'Mówię szybciej'],
        ['B', 'Wycinam ciekawostki i dwie definicje.', 'Wycinam ciekawostki'],
        ['C', 'Zostawiam jedną myśl i slajdy, które jej służą.', 'Zostawiam jedną myśl'],
        ['D', 'Wycinam końcówkę, bo jest najdłuższa.', 'Wycinam końcówkę']],
      skutek: {
        A: 'Jutro kończysz w 26. minucie. Ostatnie slajdy przewijasz bez słowa.',
        B: 'Wychodzą 23 minuty. Definicje nadal idą jedna po drugiej.',
        C: 'Wychodzi 17 minut. Zostaje czas na pytanie do sali.',
        D: 'Mieścisz się w 20 minutach. Najciekawszej części nikt nie usłyszy.' },
      oceny: { A: ['nie', 'nie'], B: ['nie', 'rozne'], C: ['tak', 'tak'], D: ['tak', 'nie'] },   // [kryterium 1, kryterium 2]
      dlaczego: {
        A: '26 minut zamiast 20, a końcówka bez komentarza.',
        B: 'Trzy minuty za długo. Treści jest mniej, układ ten sam.',
        C: '17 minut. Wszystko, co zostało, prowadzi do jednej myśli.',
        D: 'Czas się zgadza, ale wypadła część, dla której warto było przyjść.' } },

    { id: 'd2', kiedy: 'Rano, 8:55', nazwa: 'Rzutnik gaśnie',
      scena: '<p class="kw">Pięć minut przed zajęciami rzutnik gaśnie.</p><p class="sms">Technik: będę za 20 minut.</p>',
      streszczenie: 'Pięć minut przed zajęciami rzutnik gaśnie. Technik będzie za 20 minut.',
      fakty: ['Zaraz po twoich zajęciach sala jest zajęta.', 'Dwa najważniejsze wykresy masz wydrukowane na kartce.'],
      pytanie: 'Co robisz?',
      opcje: [
        ['A', 'Czekam na technika.', 'Czekam na technika'],
        ['B', 'Zaczynam bez slajdów.', 'Zaczynam bez slajdów'],
        ['C', 'Proszę o przełożenie zajęć.', 'Przekładam zajęcia'],
        ['D', 'Pokazuję slajdy z laptopa pierwszemu rzędowi.', 'Laptop dla pierwszego rzędu']],
      skutek: {   // skutek może zależeć od wcześniejszych odpowiedzi: funkcja dostaje odpowiedzi tego telefonu
        A: 'Technik przychodzi po 20 minutach. Twój czas właśnie się skończył.',
        B: a => a.tryb === 'para' ? 'Zaczynasz punktualnie. Gdy mówisz, druga osoba rysuje wykres na tablicy.'
                                  : 'Zaczynasz punktualnie. Wykresy opisujesz słowami i pokazujesz kartkę.',
        C: 'Grupa wychodzi. Nowego terminu jeszcze nie ma.',
        D: 'Zaczynasz punktualnie. Trzy osoby widzą slajdy, reszta patrzy na twoje plecy.' },
      oceny: { A: ['nie', 'nie'], B: { sam: ['tak', 'rozne'], para: ['tak', 'tak'] }, C: ['rozne', 'rozne'], D: ['tak', 'nie'] },   // ocena może zależeć od wariantu
      dlaczego: {
        A: 'Sala jest zajęta zaraz po tobie, więc zajęć nie będzie.',
        B: 'Czas się zgadza. We dwoje wykres trafia na tablicę, w pojedynkę zostaje opis i kartka.',
        C: 'Wszystko zależy od nowego terminu, a tego jeszcze nie ma.',
        D: 'Czas się zgadza, ale slajdy widzi tylko pierwszy rząd.' } },

    { id: 'd3', kiedy: 'Rano, 9:18', nazwa: 'Ręka w górze',
      scena: '<p class="kw">Zostały dwie minuty. Ktoś podnosi rękę.</p><p class="op">Zakończenia jeszcze nie było.</p>',
      streszczenie: 'Zostały dwie minuty. Ktoś podnosi rękę, a zakończenia jeszcze nie było.',
      fakty: ['Zaraz po tobie wchodzi następna grupa.', 'Zakończenie to jedno zdanie o tym, co z tego wynika dla sali.'],
      pytanie: 'Co robisz?',
      opcje: [
        ['A', 'Odpowiadam na pytanie do końca czasu.', 'Odpowiadam do końca'],
        ['B', 'Mówię zakończenie, a na pytanie odpowiadam po zajęciach.', 'Najpierw zakończenie'],
        ['C', 'Kończę słowami „to tyle, dziękuję”.', '„To tyle, dziękuję”'],
        ['D', 'Odpowiadam, potem mówię zakończenie i przekraczam czas.', 'Jedno i drugie']],
      skutek: {
        A: 'Pytający dostaje odpowiedź. Reszta sali wychodzi bez zakończenia.',
        B: 'Sala słyszy zakończenie. Z pytającym rozmawiasz na korytarzu.',
        C: 'Kończysz punktualnie. Ostatnie, co słyszy sala, to „dziękuję”.',
        D: 'Mówisz wszystko. Następna grupa stoi już w drzwiach.' },
      oceny: { A: ['tak', 'rozne'], B: ['tak', 'tak'], C: ['tak', 'nie'], D: ['nie', 'rozne'] },
      dlaczego: {
        A: 'Zyskuje jedna osoba. Pozostałe nie słyszą, co z tego wynika.',
        B: 'Zakończenie pada w czasie, a pytanie nie przepada.',
        C: 'Punktualnie, ale bez ostatniego zdania.',
        D: 'Sala słyszy wszystko kosztem następnej grupy.' } }
  ],
  zakonczenia: { cala: 'Sala wychodzi z jedną myślą.', czesc: 'Sala zapamięta część.', malo: 'Sala zapamięta niewiele.' }
};

// ===================== HISTORIA Z DECYZJAMI: funkcje (możesz je zostawić bez zmian) =====================
const hTekst = (x, a) => typeof x === 'function' ? x(a) : x;
const hZnak = z => '<span class="zn ' + z + '">' + HIST.znaki[z] + '</span>';
// ocena wybranej odpowiedzi: [kryterium 1, kryterium 2] albo null, gdy brakuje decyzji lub wariantu
const hOcena = (d, a) => { const o = d.oceny[a[d.id]]; return !o ? null : Array.isArray(o) ? o : (o[a.tryb] || null); };
// komórka tabeli na slajdzie: jedna ocena albo osobno dla każdego wariantu, jeśli się różnią
function hKomorka(o, j) {
  if (Array.isArray(o)) return hZnak(o[j]);
  const zn = HIST.warianty.map(w => o[w[0]][j]);
  return zn.every(z => z === zn[0]) ? hZnak(zn[0]) : HIST.warianty.map((w, i) => w[1] + ': ' + hZnak(zn[i])).join('<br>');
}
// ekran telefonu dla jednej decyzji
function hEkran(d, i) {
  return { znacznik: d.kiedy + ' · decyzja ' + (i + 1) + ' z ' + HIST.decyzje.length, tytul: d.nazwa, czas: HIST.czas,
    bloki: [
      { typ: 'tekst', html: d.scena + '<details class="fakty" open><summary>Zanim zdecydujesz: dwa fakty</summary><ul>' +
          d.fakty.map(f => '<li>' + f + '</li>').join('') + '</ul></details>' },
      { typ: 'wybor', klucz: d.id, pytanie: d.pytanie, raz: true, opcje: d.opcje.map(o => [o[0], o[1]]),
        pokaz: (v, a) => '<div class="ev">' + hTekst(d.skutek[v], a) + '</div><p class="muted">Teraz spójrz na duży ekran. Dalej idziemy razem.</p>' }],
    stopka: 'Liczy się pierwsza odpowiedź.' };
}
// slajd dla jednej decyzji: krok 0 scena, dwa fakty i licznik, krok 1 wybory sali, krok 2 tabela ocen
function hSlajd(d, i) {
  return { id: d.id, ekran: d.id, kroki: 2, html: (h, k) => {
    const glowa = '<div class="kicker">Historia · decyzja ' + (i + 1) + ' z ' + HIST.decyzje.length + ' · ' + d.kiedy + (k ? '' : ' · telefon') + '</div><h1 class="q">' + d.nazwa + '</h1>';
    if (k === 0) return glowa + '<div class="scena">' + d.streszczenie + '</div>' +
      '<div class="box"><div class="lbl">Zanim zdecydujesz: dwa fakty</div><ul>' + d.fakty.map(f => '<li>' + f + '</li>').join('') + '</ul></div>' + h.zebrane(d.id) +
      '<div class="foot">Na telefonie: scena, dwa fakty i cztery odpowiedzi.' + (HIST.czas ? ' Pasek na telefonie odmierza ' + HIST.czas + ' sekund.' : '') + '</div>';
    if (k === 1) {
      const c = h.zlicz(d.id), n = h.ile(d.id);
      return glowa + h.slupki({ max: Math.max(1, ...d.opcje.map(o => c[o[0]] || 0)), fmt: v => v + ' (' + (n ? Math.round(v / n * 100) : 0) + '%)',
        serie: [{ nazwa: 'Wybory sali', kolor: 'var(--s1)' }], grupy: d.opcje.map(o => ({ etykieta: o[2], wartosci: [c[o[0]] || 0] })) }) +
        '<div class="foot">Wybory sali (n = ' + n + '). Następne kliknięcie pokaże ocenę każdej odpowiedzi.</div>';
    }
    return glowa + '<table class="t maly"><tr><th>Odpowiedź</th><th>' + HIST.kryteria[0] + '</th><th>' + HIST.kryteria[1] + '</th><th>Dlaczego</th></tr>' +
      d.opcje.map(o => '<tr><td>' + o[2] + '</td><td>' + hKomorka(d.oceny[o[0]], 0) + '</td><td>' + hKomorka(d.oceny[o[0]], 1) + '</td><td>' + d.dlaczego[o[0]] + '</td></tr>').join('') +
      '</table><div class="foot">Historia i oceny są wymyślone. W prawdziwej prezentacji przy każdej ocenie stoi jej podstawa: przepis, badanie albo kodeks.</div>';
  } };
}
// zakończenie jednego telefonu: w ilu decyzjach sala coś wyniosła (kryterium 2)
function hWynik(a) {
  if (!HIST.decyzje.every(d => hOcena(d, a))) return undefined;
  const ile = HIST.decyzje.filter(d => hOcena(d, a)[1] === 'tak').length;
  return ile === HIST.decyzje.length ? 'cala' : ile >= 2 ? 'czesc' : 'malo';
}
// epilog na telefonie: własne zakończenie i ocena każdej decyzji
function hEpilog(a) {
  const w = hWynik(a);
  if (!w) return '<p class="lead">Brakuje którejś decyzji.</p><p class="muted">Wróć do niej przez link na dole ekranu.</p>';
  const czas = HIST.decyzje.every(d => hOcena(d, a)[0] !== 'nie');
  return '<p class="lead">' + HIST.zakonczenia[w] + '</p><p>' + (czas ? 'Czas się zgadzał.' : 'Czasu zabrakło.') + '</p>' +
    HIST.decyzje.map(d => {
      const o = d.opcje.find(x => x[0] === a[d.id]), oc = hOcena(d, a);
      return '<div class="ev"><b>' + d.kiedy + '.</b> ' + o[2] + '<br>' + HIST.kryteria[0] + ' ' + hZnak(oc[0]) + '<br>' + HIST.kryteria[1] + ' ' + hZnak(oc[1]) + '</div>';
    }).join('');
}
const HIST_EKRANY = {};
HIST.decyzje.forEach((d, i) => { HIST_EKRANY[d.id] = hEkran(d, i); });

window.TRESC = {
  prefiks: 'prez-demo',          // nazwa kanału: małe litery bez polskich znaków, cyfry, myślnik; inna dla każdej prezentacji
  tytul: 'Prezentacja z telefonami — pokaz',
  nazwaTelefon: 'Prezentacja',   // napis u góry ekranu telefonu

  // ===================== EKRANY TELEFONU =====================
  // Ekran: { znacznik, tytul, czas, bloki: [...], wyslij: 'napis na przycisku', stopka }
  //   czas — pasek na telefonie, który kurczy się przez podaną liczbę sekund (tylko informacja, niczego nie blokuje)
  // Bloki:
  //   { typ:'tekst', html }                                             zwykła treść; „html” może być funkcją a => '...'
  //   { typ:'wybor', klucz, pytanie, opcje:[[wartość, napis], ...],     jedna odpowiedź z kilku
  //     uklad:'rzad', pokaz:{ wartość: html }, raz:true }               „pokaz”: treść widoczna po wyborze (karta grupy, skutek decyzji);
  //                                                                     może też być funkcją (wartość, a) => '...'
  //   { typ:'suwak', klucz, pytanie, min, max, krok, jednostka }        liczba
  //   { typ:'skala', klucz, pytanie, min:1, max:5, lewo, prawo, raz }   ocena w skali
  //   { typ:'pole',  klucz, pytanie, podpowiedz, max:280 }              krótki tekst
  // „a” w funkcjach to odpowiedzi tego telefonu: { klucz: wartość, ... }. Dzięki temu skutek albo epilog może zależeć od wcześniejszych wyborów.
  // Każdy blok z „klucz” jest wymagany, chyba że ma opcjonalne:true.
  // raz:true — po wysłaniu wyboru nie da się go zmienić (quiz, decyzja: liczy się pierwsza odpowiedź).
  // Ekran bez „wyslij” wysyła odpowiedź od razu po stuknięciu. Ekran z polem tekstowym musi mieć „wyslij”.
  // Ten sam „klucz” na dwóch ekranach oznacza tę samą odpowiedź (telefon ją pamięta).
  // Wszystkie odpowiedzi jednego telefonu razem muszą się zmieścić w ok. 3900 bajtach,
  // więc w całej prezentacji planuj najwyżej 3–4 pola tekstowe po 280 znaków albo więcej krótszych (max: 120).
  // Pierwszy ekran na liście widzi telefon zaraz po zeskanowaniu kodu.
  // Klasy do treści na telefonie: kw (zdanie sceny), op (opis, didaskalia), sms (dymek wiadomości), ev (ramka skutku),
  // details.fakty (kartka z faktami), lead, muted, small, zn tak | nie | rozne (znak oceny).
  // Obrazek: plik wgrany obok czterech plików strony, wstawiony przez <img src="nazwa.jpg" alt="opis">. Na telefonie sam mieści się w szerokości ekranu.
  ekrany: Object.assign({
    start: { tytul: 'Jesteś z nami', bloki: [
      { typ: 'tekst', html: '<p class="lead">Odłóż telefon ekranem w dół.</p><p class="muted">Kiedy będzie potrzebny, ekran sam się zmieni.</p>' }] },

    pauza: { tytul: 'Spójrz na duży ekran', bloki: [
      { typ: 'tekst', html: '<p class="lead">Telefon możesz odłożyć.</p><p class="muted">Kiedy będzie potrzebny, ekran sam się zmieni.</p>' }] },

    przed: { znacznik: 'Pytanie na start', tytul: 'Czy pytania zadawane przez telefon pomagają w zajęciach?',
      bloki: [{ typ: 'wybor', klucz: 'przed', opcje: [['tak', 'Tak'], ['nie', 'Nie'], ['zalezy', 'To zależy']] }],
      stopka: 'Odpowiedź jest anonimowa. Wyniki zobaczymy na końcu.' },

    // HISTORIA: rola sali i wariant startowy
    rola: { znacznik: 'Twoja rola', tytul: 'Jutro prowadzisz zajęcia', bloki: [
      { typ: 'tekst', html: '<p class="kw">Masz 20 minut i 24 slajdy.</p><p class="op">Jest wieczór przed zajęciami. Przed tobą trzy decyzje.</p>' },
      { typ: 'wybor', klucz: 'tryb', pytanie: 'Jak prowadzisz?', uklad: 'rzad', raz: true, opcje: HIST.warianty, pokaz: {
        sam: '<p>Wszystko zależy od ciebie.</p>',
        para: '<p>Dzielicie się częściami. Gdy coś pójdzie źle, druga osoba może pomóc.</p>' } }],
      stopka: 'Od tego wyboru zależy część skutków.' }
  }, HIST_EKRANY, {   // HISTORIA: ekrany decyzji d1, d2, d3 powstają z danych na górze pliku
    epilog: { znacznik: 'Epilog', tytul: 'Dzień po zajęciach', bloki: [{ typ: 'tekst', html: a => hEpilog(a) }] },

    zgadnij: { znacznik: 'Zgadnij', tytul: 'Jaki procent doby to 6 godzin?', wyslij: 'Wyślij', bloki: [
      { typ: 'suwak', klucz: 'typ', pytanie: 'Przesuń suwak i wyślij swój typ.', min: 0, max: 100, jednostka: '%' }] },

    quiz: { znacznik: 'Pytanie', tytul: 'Ile dni ma rok przestępny?', bloki: [
      { typ: 'wybor', klucz: 'quiz', uklad: 'rzad', raz: true, opcje: [['365', '365'], ['366', '366'], ['367', '367']] }],
      stopka: 'Liczy się pierwsza odpowiedź.' },

    grupy: { znacznik: 'Praca w grupach', tytul: 'W której jesteś grupie?', bloki: [
      { typ: 'wybor', klucz: 'grupa', uklad: 'rzad', opcje: [['A', 'Grupa A'], ['B', 'Grupa B']], pokaz: {
        A: '<h2>Grupa A: zwykła rozmowa</h2><p>Rozmawiajcie tak jak zwykle: można dopytywać i doradzać.</p>',
        B: '<h2>Grupa B: runda</h2><p>Każdy mówi po kolei, reszta słucha i nie komentuje.</p>' } }] },

    ocena: { znacznik: 'Oceń pracę w grupie', tytul: 'Jak było w twojej grupie?', wyslij: 'Wyślij', bloki: [
      { typ: 'wybor', klucz: 'grupa', pytanie: 'Twoja grupa', uklad: 'rzad', opcje: [['A', 'Grupa A'], ['B', 'Grupa B']] },
      { typ: 'skala', klucz: 'o1', pytanie: 'Miałem/am poczucie, że ktoś mnie słucha.', lewo: 'zupełnie nie', prawo: 'całkowicie tak' },
      { typ: 'pole', klucz: 'wniosek', pytanie: 'Jedno zdanie: co z tego wynika?', podpowiedz: 'Twój wniosek', max: 200, opcjonalne: true }] },

    zadanie: { znacznik: 'Zadanie', tytul: 'Jedna zasada na zajęcia z telefonami', wyslij: 'Wyślij na ekran', bloki: [
      { typ: 'pole', klucz: 'zasada', pytanie: 'Napisz ją jednym zdaniem.', podpowiedz: 'Twoja zasada', max: 160 }],
      stopka: 'Tekst pojawi się na dużym ekranie bez podpisu.' },

    debata: { znacznik: 'Debata', tytul: 'Telefony na zajęciach: pomagają czy przeszkadzają?', bloki: [
      { typ: 'wybor', klucz: 'strona', pytanie: 'Po której stronie siedzisz?', uklad: 'rzad', opcje: [['A', 'Strona A'], ['B', 'Strona B']], pokaz: {
        A: '<h2>Strona A: pomagają</h2><p>Argumenty na start:</p><ul><li>każdy może odpowiedzieć, także osoby, które nie zabierają głosu</li><li>wynik całej sali widać od razu</li></ul>',
        B: '<h2>Strona B: przeszkadzają</h2><p>Argumenty na start:</p><ul><li>telefon w ręku odciąga uwagę od rozmowy</li><li>nie każdy ma internet i naładowaną baterię</li></ul>' } }] },

    glos: { znacznik: 'Głosowanie', tytul: 'Która strona była bardziej przekonująca?',
      bloki: [{ typ: 'wybor', klucz: 'glos', opcje: [['A', 'Strona A: pomagają'], ['B', 'Strona B: przeszkadzają']] }],
      stopka: 'Głosujesz na argumenty, nie na swoją stronę.' },

    po: { znacznik: 'Pytanie na koniec', tytul: 'Czy pytania zadawane przez telefon pomagają w zajęciach?',
      bloki: [{ typ: 'wybor', klucz: 'po', opcje: [['tak', 'Tak'], ['nie', 'Nie'], ['zalezy', 'To zależy']] }],
      stopka: 'To samo pytanie co na początku.' },

    karta: { znacznik: 'Na wynos', tytul: 'Dziękujemy', bloki: [
      { typ: 'tekst', html: '<p class="lead">Tu wpisz to, co uczestnik ma zabrać ze sobą: trzy zdania do zapamiętania, kontakty albo linki.</p><p class="muted">Jeśli chcesz zachować tę kartę, zrób zrzut ekranu.</p>' }] }
  }),

  // ===================== SLAJDY (strona prowadzącego) =====================
  // Slajd: { id, ekran, kroki, czas, html: (h, k) => '...' }
  //   ekran  — który ekran mają pokazać telefony, gdy ten slajd jest na rzutniku (brak = ten sam co na poprzednim slajdzie)
  //   kroki  — ile dodatkowych kliknięć ma slajd (k = 0, 1, ...); służy do odsłaniania wyniku
  //   czas   — minutnik w sekundach (wstaw h.minutnik() w treść slajdu; klawisz T = start/pauza)
  // Pomocnicy „h”:
  //   h.osoby()                  liczba telefonów, które dołączyły
  //   h.ile(klucz, filtr)        liczba odpowiedzi;  filtr: a => a.grupa === 'A'
  //   h.srednia(klucz, filtr)    średnia z odpowiedzi liczbowych (albo null)
  //   h.zlicz(klucz, filtr)      { wartość: liczba }
  //   h.policz(f)                { wynik: liczba telefonów } dla własnej funkcji f(a), np. zakończenie historii
  //   h.wartosci(klucz, filtr)   lista odpowiedzi;  h.zapisy(filtr)  lista odpowiedzi wszystkich telefonów;  h.opcje(klucz)  [wartość, napis]
  //   h.zebrane(klucz)           duży licznik odpowiedzi na żywo (bez pokazywania wyników)
  //   h.wykres(klucz, { z, nazwy, wyroznij })   rozkład odpowiedzi na pytanie wyboru albo skalę;
  //                              „z”: drugi klucz do porównania (np. przed i po), „wyroznij”: wartość pogrubiona (np. poprawna odpowiedź)
  //   h.slupki({ serie: [{ nazwa, kolor }], grupy: [{ etykieta, wartosci: [...], wyr }], max, fmt: (wartość, nrSerii) => napis,
  //              podzialka: [{ v, n }], legenda, szer, ciasno })   dowolny wykres słupkowy, także z liczbami z literatury
  //   h.teksty(klucz, ile, filtr)   ostatnie teksty wysłane z telefonów
  //   h.qr(piksele)  h.minutnik([sekundy, ...])  h.odm(n, 'głos', 'głosy', 'głosów')  h.esc(tekst)
  // Kolory serii: var(--s1) niebieski, var(--s2) pomarańczowy. Scena ma 1600 × 900 pikseli i sama dopasowuje się do okna.
  // Klasy do układu: kicker, h1 (h1.q = dłuższe pytanie), sub, body, big, foot, row/col, card, box (box sol), plain, rules, dim, cap,
  // scena (tekst sceny), t i t maly (tabela), zn tak | nie | rozne (znak oceny).
  // Obrazek na slajdzie: <img src="nazwa.jpg" alt="opis" style="max-height:420px">; bez podanej wysokości zajmie całą dostępną szerokość.
  // W napisach używaj odwróconych apostrofów `...` albo apostrofów '...'; polskie cudzysłowy „ ” wolno wpisywać w środku napisu.
  slajdy: [
    { id: 'tytul', ekran: 'start', html: h => `
      <div class="row" style="height:100%;align-items:center">
        <div class="col">
          <div class="kicker">Szablon · pokaz</div>
          <h1 style="font-size:84px">Prezentacja z telefonami</h1>
          <div class="sub">Historia z decyzjami i dziewięć wzorców dodatkowych. Zeskanuj kod i przejdź je razem z prowadzącym.</div>
          <div class="sub" style="margin-top:44px;color:var(--ink);font-weight:600">Imię Nazwisko</div>
        </div>
        <div style="flex:none;text-align:center">
          ${h.qr(420)}
          <div style="font-size:26px;margin-top:14px">Zeskanuj kod aparatem telefonu</div>
          <div style="font-size:24px;color:var(--ink2);margin-top:6px">Dołączyło: <b style="color:var(--ink)">${h.osoby()}</b></div>
        </div>
      </div>` },

    // Slajd bez pola „ekran”: telefony zostają na tym, co miały (tu: ekran „start”).
    { id: 'zasady', html: h => `
      <div class="kicker">Slajd bez telefonu</div>
      <h1>Zasady na dziś</h1>
      <ol class="rules">
        <li>Odpowiedzi z telefonów są anonimowe.</li>
        <li>Każde pytanie można pominąć.</li>
        <li>Wyniki pokazujemy dla całej sali, nigdy dla jednej osoby.</li>
      </ol>
      <div class="foot">Zwykły slajd z treścią. Telefony nic teraz nie robią.</div>` },

    // WZORZEC 1 (część pierwsza): pytanie przed i po. Zbieramy odpowiedzi, wyników nie pokazujemy.
    { id: 'przed', ekran: 'przed', html: h => `
      <div class="kicker">Wzorzec 1 · pytanie przed i po · telefon</div>
      <h1 class="q">Czy pytania zadawane przez telefon pomagają w zajęciach?</h1>
      ${h.zebrane('przed')}
      <div class="foot">Teraz tylko zbieramy odpowiedzi. To samo pytanie wróci na końcu i wtedy porównamy wyniki.</div>` },

    // HISTORIA: sala dostaje rolę i wybiera wariant startowy.
    { id: 'rola', ekran: 'rola', html: h => `
      <div class="kicker">Historia z decyzjami · rola · telefon</div>
      <h1>Jutro prowadzisz zajęcia</h1>
      <div class="scena">Masz 20 minut i 24 slajdy. Jest wieczór przed zajęciami.<div class="op">Na telefonie wybierz, jak prowadzisz: sam czy we dwoje.</div></div>
      ${h.zebrane('tryb')}
      <div class="foot">Wariant startowy: od tego wyboru zależy część skutków i ocen w dalszych decyzjach.</div>` }

    // HISTORIA: slajdy decyzji d1, d2, d3 powstają z danych na górze pliku (funkcja hSlajd).
  ].concat(HIST.decyzje.map(hSlajd), [

    // HISTORIA: epilog. Krok 0: każdy czyta własne zakończenie. Krok 1: zakończenia całej sali.
    { id: 'epilog', ekran: 'epilog', kroki: 1, html: (h, k) => {
      if (!k) return `
        <div class="kicker">Historia · epilog · telefon</div>
        <h1>Dzień po zajęciach</h1>
        <div class="scena">Każdy ma teraz na telefonie własne zakończenie: co wynikło z jego trzech decyzji.</div>
        <div class="foot">Następne kliknięcie pokaże zakończenia całej sali.</div>`;
      const c = h.policz(hWynik), n = Object.values(c).reduce((x, y) => x + y, 0);
      return `
        <div class="kicker">Historia · epilog</div>
        <h1>Jak skończyła sala</h1>
        ${h.slupki({ max: Math.max(1, ...Object.values(c)), fmt: v => v + ' (' + (n ? Math.round(v / n * 100) : 0) + '%)',
          serie: [{ nazwa: 'Zakończenia', kolor: 'var(--s1)' }],
          grupy: Object.keys(HIST.zakonczenia).map(z => ({ etykieta: HIST.zakonczenia[z], wartosci: [c[z] || 0] })) })}
        <div class="foot">Zakończenie zależy od trzech decyzji i od wariantu startowego (n = ${n}).</div>`; } },

    // WZORZEC 2: zgadnij, potem prawda. Krok 0: średnia typów z sali. Krok 1: obok pojawia się liczba ze źródła.
    { id: 'zgadnij', ekran: 'zgadnij', kroki: 1, html: (h, k) => `
      <div class="kicker">Wzorzec 2 · zgadnij, potem prawda · telefon</div>
      <h1>Jaki procent doby to 6 godzin?</h1>
      ${h.slupki({ max: 100, fmt: v => v == null ? 'brak typów' : Math.round(v) + '%',
        podzialka: [0, 25, 50, 75, 100].map(v => ({ v, n: v + '%' })),
        serie: [{ nazwa: 'Wasze typy (średnia z sali)', kolor: 'var(--s1)' }, { nazwa: 'Poprawny wynik', kolor: 'var(--s2)' }].slice(0, k ? 2 : 1),
        grupy: [{ etykieta: 'Część doby', wartosci: [h.srednia('typ'), k ? 25 : undefined] }] })}
      <div class="foot">${k ? 'W prawdziwej prezentacji drugi słupek to liczba z badania, a tutaj stoi źródło: Autor (rok).' : 'Typy z sali: n = ' + h.ile('typ') + '. Następne kliknięcie pokaże wynik.'}</div>` },

    // WZORZEC 3: głosowanie z odsłonięciem. Krok 0: licznik. Krok 1: rozkład odpowiedzi, poprawna pogrubiona.
    { id: 'quiz', ekran: 'quiz', kroki: 1, html: (h, k) => `
      <div class="kicker">Wzorzec 3 · głosowanie z odsłonięciem · telefon</div>
      <h1 class="q">Ile dni ma rok przestępny?</h1>
      ${k ? h.wykres('quiz', { wyroznij: '366' }) : h.zebrane('quiz')}
      <div class="foot">${k ? 'Pogrubiona odpowiedź jest poprawna. Po wysłaniu nie da się zmienić wyboru (raz: true).' : 'Wyniki pokaże następne kliknięcie, więc nikt nie sugeruje się innymi.'}</div>` },

    // WZORZEC 4: dane ze źródła na wykresie. Telefony dostają ekran „pauza”.
    { id: 'dane', ekran: 'pauza', html: h => `
      <div class="kicker">Wzorzec 4 · dane ze źródła · bez telefonu</div>
      <h1>Wykres z liczbami z literatury</h1>
      ${h.slupki({ max: 100, fmt: v => v + '%', podzialka: [0, 25, 50, 75, 100].map(v => ({ v, n: v + '%' })),
        serie: [{ nazwa: 'Grupa badana', kolor: 'var(--s1)' }, { nazwa: 'Grupa porównawcza', kolor: 'var(--s2)' }],
        grupy: [{ etykieta: 'Po 3 miesiącach', wartosci: [60, 45] }, { etykieta: 'Po 12 miesiącach', wartosci: [50, 30] }] })}
      <div class="foot">LICZBY PRZYKŁADOWE, nie z badania. W prawdziwej prezentacji: wartości ze źródła i podpis — Autor (rok), kogo badano, co mierzono.</div>` },

    // WZORZEC 5: praca w grupach. Każda grupa widzi na telefonie tylko swoją kartę. Minutnik: klawisz T.
    { id: 'grupy', ekran: 'grupy', czas: 300, html: h => `
      <div class="kicker">Wzorzec 5 · praca w grupach z kartami · telefon</div>
      <div class="row" style="flex:1;align-items:center">
        <div style="flex:none;width:620px">${h.minutnik()}</div>
        <div class="col">
          <div class="body" style="margin-top:0">Ten sam temat, dwa sposoby rozmowy.</div>
          <ul class="plain"><li>Grupa A: zwykła rozmowa</li><li>Grupa B: runda bez komentowania</li></ul>
        </div>
      </div>
      <div class="foot">Każda grupa widzi na telefonie tylko swoją kartę z instrukcją.</div>` },

    // WZORZEC 6: ocena w skali i porównanie grup. Filtr a => a.grupa === 'A' dzieli odpowiedzi według innego pytania.
    { id: 'ocena', ekran: 'ocena', kroki: 1, html: (h, k) => {
      const A = a => a.grupa === 'A', B = a => a.grupa === 'B';
      if (!k) return `
        <div class="kicker">Wzorzec 6 · ocena w skali, porównanie grup · telefon</div>
        <h1>Jak było w twojej grupie?</h1>
        ${h.zebrane('o1')}
        <div class="foot">Następne kliknięcie pokaże wyniki.</div>`;
      return `
        <div class="kicker">Wzorzec 6 · wyniki</div>
        <h1>Grupa A i grupa B</h1>
        ${h.slupki({ max: 5, fmt: v => v == null ? '—' : v.toFixed(1).replace('.', ','),
          podzialka: [1, 2, 3, 4, 5].map(v => ({ v, n: v })),
          serie: [{ nazwa: 'Grupa A (n = ' + h.ile('o1', A) + ')', kolor: 'var(--s1)' }, { nazwa: 'Grupa B (n = ' + h.ile('o1', B) + ')', kolor: 'var(--s2)' }],
          grupy: [{ etykieta: 'Ktoś mnie słuchał', wartosci: [h.srednia('o1', A), h.srednia('o1', B)] }] })}
        <div class="box"><div class="lbl">Wnioski z sali</div>${h.teksty('wniosek', 2)}</div>
        <div class="foot">Średnie w skali 1–5. To nie badanie, tylko obraz tej sali.</div>`; } },

    // WZORZEC 7: zadanie z odpowiedzią tekstową. Krok 0: licznik. Krok 1: teksty z sali. Krok 2: rozwiązanie prowadzących.
    { id: 'zadanie', ekran: 'zadanie', kroki: 2, html: (h, k) => `
      <div class="kicker">Wzorzec 7 · zadanie z odpowiedzią tekstową · telefon</div>
      <h1 class="q">Jedna zasada na zajęcia z telefonami</h1>
      ${k ? '<div class="box"><div class="lbl">Z sali</div>' + h.teksty('zasada', 2) + '</div>' : h.zebrane('zasada')}
      ${k > 1 ? '<div class="box sol"><div class="lbl">Propozycja prowadzących</div><div class="txt">Telefon leży ekranem w dół, dopóki prowadzący nie poprosi o odpowiedź.</div></div>' : ''}
      <div class="foot">${['Zbieramy. Teksty pokaże następne kliknięcie.', 'Dwa ostatnie teksty z sali, bez podpisów. Następne kliknięcie pokaże propozycję prowadzących.', 'Najpierw odpowiedzi sali, dopiero potem rozwiązanie prowadzących.'][k]}</div>` },

    // WZORZEC 8 (część pierwsza): debata. Strony mają na telefonach karty z argumentami. Przyciski pod minutnikiem ustawiają czas.
    { id: 'debata', ekran: 'debata', czas: 120, html: h => `
      <div class="kicker">Wzorzec 8 · debata z kartami argumentów · telefon</div>
      <h1 class="q">Telefony na zajęciach: pomagają czy przeszkadzają?</h1>
      <div class="row" style="flex:1;align-items:center">
        <div style="flex:none;width:620px">${h.minutnik([120, 60])}</div>
        <div class="col">
          <ul class="plain" style="margin-top:0"><li>Strona A: pomagają</li><li>Strona B: przeszkadzają</li></ul>
          <div class="cap">Kartę z argumentami każda strona ma na telefonie.</div>
        </div>
      </div>` },

    // WZORZEC 8 (część druga): głosowanie po debacie.
    { id: 'glos', ekran: 'glos', kroki: 1, html: (h, k) => `
      <div class="kicker">Wzorzec 8 · głosowanie po debacie · telefon</div>
      <h1 class="q">Która strona była bardziej przekonująca?</h1>
      ${k ? h.wykres('glos') : h.zebrane('glos')}
      <div class="foot">${k ? 'Liczba głosów i odsetek.' : 'Następne kliknięcie pokaże wynik.'}</div>` },

    // WZORZEC 1 (część druga): to samo pytanie co na początku i porównanie obu pomiarów.
    { id: 'po', ekran: 'po', kroki: 1, html: (h, k) => `
      <div class="kicker">${k ? 'Wzorzec 1 · przed i po' : 'Wzorzec 1 · pytanie na koniec · telefon'}</div>
      <h1 class="q">Czy pytania zadawane przez telefon pomagają w zajęciach?</h1>
      ${k ? h.wykres('przed', { z: 'po' }) : h.zebrane('po')}
      <div class="foot">${k ? 'Liczba osób i odsetek w danym pomiarze.' : 'Następne kliknięcie pokaże porównanie z początkiem.'}</div>` },

    // WZORZEC 9: karta na wynos. Na telefonach zostaje ekran „karta”.
    { id: 'koniec', ekran: 'karta', html: h => `
      <div class="kicker">Wzorzec 9 · karta na wynos · telefon</div>
      <h1 style="font-size:84px">Dziękujemy</h1>
      <div class="sub">Na telefonach została karta z tym, co uczestnik ma zabrać ze sobą.</div>
      <div class="foot">Źródła: Autor (rok). Tytuł. Wydawca. — tu wpisz pełną listę albo dodaj osobny slajd z bibliografią.</div>` }
  ])
};
