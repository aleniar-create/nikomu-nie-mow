// Testy czytania i sprawdzania karty: node prezentacja/testy/test_karta.js <ścieżka do karta.js>
const K = require(require('path').resolve(process.argv[2] || 'prezentacja/sala/karta.js'));
let ok = 0, zle = 0;
function spr(w, opis) { if (w) ok++; else { zle++; console.log('  BŁĄD:', opis); } }
const bledy = r => r.uwagi.filter(u => u.p === 'blad').map(u => u.t), uwagi = r => r.uwagi.filter(u => u.p === 'uwaga').map(u => u.t);
const ma = (lista, fragment) => lista.some(t => t.includes(fragment));

// 1. przykład z pliku: czysta karta
let r = K.zTekstu(K.PRZYKLAD);
spr(r.gotowe && r.uwagi.length === 0, 'przykład: bez uwag (' + JSON.stringify(r.uwagi) + ')');
spr(r.dane.decyzje.length === 3 && r.dane.decyzje.every(d => d.opcje.length === 4 && d.fakty.length === 2), 'przykład: 3 decyzje po 4 odpowiedzi i 2 fakty');
spr(r.dane.tytul === 'Jutro prowadzisz zajęcia' && r.dane.k1 === 'Zmieścisz się w czasie?' && r.dane.rola.split('\n').length === 2, 'przykład: pola główne, rola w dwóch liniach');
spr(r.dane.decyzje[1].scena.includes('SMS od technika: będę za 20 minut.'), 'dwukropek w treści sceny nie jest etykietą');
spr(JSON.stringify(r.tresc.przesyl.d2.b[0][1]) === JSON.stringify([['kw', 'Pięć minut przed zajęciami rzutnik gaśnie.'], ['sms', 'SMS od technika: będę za 20 minut.']]), 'scena: akapit i dymek wiadomości');
spr(r.tresc.przesyl.d3.b[0][1][1][0] === 'op' && r.tresc.przesyl.d3.b[0][1][1][1] === 'Zakończenia jeszcze nie było.', 'scena: linia w nawiasie jako opis');
spr(r.tresc.slajdy.map(s => s.id).join(',') === 'tytul,zasady,przed,rola,d1,d2,d3,epilog,po,koniec', 'slajdy w kolejności');
spr(r.minuty === 18, 'szacunek czasu: 18 minut (jest ' + r.minuty + ')');
spr(Object.keys(r.tresc.przesyl).every(id => Buffer.byteLength(JSON.stringify(r.tresc.przesyl[id])) < 3700), 'każdy ekran mieści się w wiadomości');

// 2. ta sama karta tak, jak oddają ją czaty: pogrubienia, nagłówki, CRLF, bloki kodu, brak polskich znaków, odpowiedzi „A)”
const brudna = ['Oto karta prezentacji:', '```text', '**TYTUL:** Jutro prowadzisz zajecia', '**Autor:** Jan Kowalski', '**Mysl przewodnia:** Jedna mysl.', '**ROLA:** Jutro prowadzisz zajecia.',
  '**Kryterium 1:** Zmiescisz sie w czasie?', '**KRYTERIUM 2:** Sala cos wyniesie?', '', '## Decyzja 1: Za duzo slajdow', '- **Kiedy:** Wieczor, 20:00', '- **Scena:** Robisz probe. Wychodzi 31 minut.',
  'Jutro masz na to 20.', '- **Fakty:**', '  - Sala nie zna tematu.', '  - Najciekawsza czesc jest na koncu.', '**Pytanie:** Co robisz?', 'A) Mowie szybciej.', 'Skrot: Mowie szybciej', 'Skutek: Konczysz w 26. minucie.',
  'Ocena: ✗ / ✗', 'Dlaczego: Za dlugo.', 'B) Zostawiam jedna mysl.', 'Skrot: Jedna mysl', 'Skutek: Wychodzi 17 minut.', 'Ocena: tak; tak', 'Uzasadnienie: Miesci sie.', '```', 'KONTYNUACJA', '```', '### DECYZJA 2 – Rzutnik gasnie',
  'KIEDY: Rano', 'SCENA: Rzutnik gasnie.', 'FAKT 1: Sala jest zajeta.', 'FAKT 2: Masz kartke.', 'ODPOWIEDZ A: Czekam.', 'SKROT A: Czekam', 'SKUTEK A: Czas mija.', 'OCENA A: nie, nie ma jednej odpowiedzi', 'DLACZEGO A: Brak czasu.',
  'Odpowiedź B: Zaczynam bez slajdow.', 'B – SKRÓT: Bez slajdow', 'B - SKUTEK: Zaczynasz punktualnie.', 'B OCENY: K1: tak (plan), K2: to zależy', 'B DLACZEGO: Czas sie zgadza.', '', '=== EPILOG ===',
  'ZAKONCZENIE DOBRE: Dobrze.', 'Zakonczenie mieszane: Srednio.', 'ZAKOŃCZENIE ZŁE: Slabo.', 'Pytanie na koniec: Co dalej?', '', 'ŹRÓDŁA:', '1. Autor (2020). Tytul: podtytul.', '2) Drugi (2021).', '', 'Do sprawdzenia', '- przepis X',
  '- [każdy fakt, którego nie jesteś pewien]', '```'].join('\r\n');
r = K.zTekstu(brudna);
spr(r.gotowe, 'karta z ozdobnikami: gotowa (' + JSON.stringify(bledy(r)) + ')');
spr(r.dane.tytul === 'Jutro prowadzisz zajecia' && r.dane.autorzy === 'Jan Kowalski' && r.dane.mysl === 'Jedna mysl.', 'ozdobniki: pola główne bez gwiazdek');
spr(r.dane.decyzje.length === 2 && r.dane.decyzje[0].nazwa === 'Za duzo slajdow' && r.dane.decyzje[1].nazwa === 'Rzutnik gasnie', 'ozdobniki: nazwa decyzji z nagłówka');
spr(r.dane.decyzje[0].scena === 'Robisz probe. Wychodzi 31 minut.\nJutro masz na to 20.', 'ozdobniki: scena w dwóch liniach');
spr(r.dane.decyzje[0].fakty.length === 2 && r.dane.decyzje[0].fakty[1] === 'Najciekawsza czesc jest na koncu.', 'ozdobniki: fakty z listy po „Fakty:”');
let o = r.dane.decyzje[0].opcje;
spr(o.length === 2 && o[0].lit === 'A' && o[0].tekst === 'Mowie szybciej.' && o[0].skrot === 'Mowie szybciej' && o[0].skutek === 'Konczysz w 26. minucie.' && o[0].dlaczego === 'Za dlugo.', 'ozdobniki: odpowiedź „A)” i pola bez litery');
spr(o[0].oc.join('') === 'nn' && o[1].oc.join('') === 'tt' && o[1].dlaczego === 'Miesci sie.', 'ozdobniki: oceny ze znaków i „Uzasadnienie”');
o = r.dane.decyzje[1].opcje;
spr(o.length === 2 && o[0].skrot === 'Czekam' && o[0].oc.join('') === 'nr' && o[1].skrot === 'Bez slajdow' && o[1].oc.join('') === 'tr' && o[1].skutek === 'Zaczynasz punktualnie.', 'ozdobniki: „SKROT A”, „B – SKRÓT”, oceny opisowe');
spr(r.dane.epilog.dobre === 'Dobrze.' && r.dane.epilog.mieszane === 'Srednio.' && r.dane.epilog.slabe === 'Slabo.' && r.dane.epilog.pytanie === 'Co dalej?', 'ozdobniki: epilog');
spr(r.dane.zrodla.length === 2 && r.dane.zrodla[0] === 'Autor (2020). Tytul: podtytul.' && r.dane.sprawdzic.length === 1 && r.dane.sprawdzic[0] === 'przepis X', 'ozdobniki: źródła i lista do sprawdzenia bez numerów i wzorca');
spr(ma(uwagi(r), 'Pominąłem 1 linię') && ma(uwagi(r), 'liczba odpowiedzi: 2'), 'ozdobniki: uwaga o pominiętej linii i o liczbie odpowiedzi');

// 3. braki: każdy ma dostać zrozumiały komunikat
const braki = ['TYTUŁ: Test', 'KRYTERIUM 1: K1?', '=== DECYZJA 1 ===', 'NAZWA: Pierwsza', 'SCENA: Coś się dzieje.', 'A: Jedna odpowiedź', 'A OCENA: tak', '=== DECYZJA 2 ===', 'SCENA: [3–5 zdań]', 'A: Tak', 'A SKUTEK: Skutek.',
  'A OCENA: tak, nie', 'A: Drugi raz A', 'B: [pełna odpowiedź]', 'B SKUTEK: Coś.', 'B OCENA: może'].join('\n');
r = K.zTekstu(braki);
const b = bledy(r);
spr(!r.gotowe && r.tresc === null, 'braki: karta nie jest gotowa');
spr(ma(b, 'Brakuje linii „KRYTERIUM 2:”'), 'braki: kryterium 2');
spr(ma(b, 'Decyzja 1: potrzebne są co najmniej dwie odpowiedzi'), 'braki: jedna odpowiedź');
spr(ma(b, 'Decyzja 1, odpowiedź A: brakuje linii „A SKUTEK:”'), 'braki: skutek');
spr(ma(b, 'Decyzja 1, odpowiedź A: w linii „A OCENA:” podaj dwa słowa'), 'braki: ocena z jednym słowem');
spr(ma(b, 'Decyzja 2: brakuje linii „SCENA:”'), 'braki: niewypełnione pole wzoru liczy się jako brak');
spr(ma(b, 'Decyzja 2, odpowiedź B: brakuje treści odpowiedzi') && ma(b, 'Decyzja 2, odpowiedź B: w linii „B OCENA:”'), 'braki: odpowiedź B');
spr(ma(uwagi(r), 'Decyzja 2: brakuje linii „NAZWA:”') && ma(uwagi(r), 'Decyzja 1: podaj dwa fakty pomocnicze'), 'braki: uwagi o nazwie i faktach');
r = K.zTekstu('Dzień dobry, oto pomysł bez karty.');
spr(!r.gotowe && ma(bledy(r), 'Nie widzę żadnej decyzji'), 'pusta karta: komunikat o braku decyzji');
r = K.zTekstu('');
spr(!r.gotowe && bledy(r).length === 1, 'brak tekstu: jeden błąd');

// 4. najlepsza odpowiedź zawsze pod tą samą literą; decyzja bez dobrej odpowiedzi
function dec(n, najlepsza) {
  return ['=== DECYZJA ' + n + ' ===', 'NAZWA: N' + n, 'SCENA: S.', 'FAKT 1: f', 'FAKT 2: g'].concat(['A', 'B', 'C', 'D'].flatMap(l => [l + ': Odp ' + l, l + ' SKUTEK: Sk.', l + ' OCENA: ' + (l === najlepsza ? 'tak, tak' : 'nie, tak'), l + ' DLACZEGO: Bo.'])).join('\n');
}
const glowa = 'TYTUŁ: T\nMYŚL PRZEWODNIA: M\nROLA: R\nKRYTERIUM 1: K1?\nKRYTERIUM 2: K2?\n', stopka = '\n=== EPILOG ===\nZAKOŃCZENIE DOBRE: a\nZAKOŃCZENIE MIESZANE: b\nZAKOŃCZENIE SŁABE: c\n=== ŹRÓDŁA ===\n- x';
r = K.zTekstu(glowa + [dec(1, 'A'), dec(2, 'A'), dec(3, 'A')].join('\n') + stopka);
spr(r.gotowe && ma(uwagi(r), 'Najlepsza odpowiedź stoi w każdej decyzji pod literą A'), 'ta sama litera: uwaga');
r = K.zTekstu(glowa + [dec(1, 'A'), dec(2, 'C'), dec(3, 'B')].join('\n') + stopka);
spr(r.gotowe && r.uwagi.length === 0, 'różne litery: bez uwag (' + JSON.stringify(r.uwagi) + ')');
r = K.zTekstu(glowa + [dec(1, 'A'), dec(2, 'X')].join('\n') + stopka);
spr(r.gotowe && ma(uwagi(r), 'Decyzja 2: żadna odpowiedź nie ma oceny „tak, tak”'), 'brak dobrej odpowiedzi: uwaga');

// 5. za długa decyzja i zwrot akcji
r = K.zTekstu(glowa + dec(1, 'A').replace('SCENA: S.', 'SCENA: ' + 'Bardzo długie zdanie sceny. '.repeat(150)) + '\n' + dec(2, 'B') + stopka);
spr(!r.gotowe && ma(bledy(r), 'Decyzja 1: jest za długa na jeden ekran telefonu'), 'za długa scena: błąd');
r = K.zTekstu(glowa + dec(1, 'A') + '\n=== ZWROT AKCJI ===\nPO DECYZJI: 1\nTYTUŁ: Nowy przepis\nTEKST: Od środy to nielegalne.\nDruga linia.\n' + dec(2, 'B') + '\n=== ZWROT AKCJI ===\nPO DECYZJI: 9\nTEKST: Za daleko.' + stopka);
spr(r.gotowe && r.dane.zwroty.length === 2 && r.dane.zwroty[0].tytul === 'Nowy przepis' && r.dane.zwroty[0].tekst.split('\n').length === 2 && r.dane.zwroty[1].po === 1, 'zwrot akcji: tytuł, tekst w liniach, zły numer poprawiony');
spr(r.tresc.slajdy.map(s => s.id).join(',') === 'tytul,zasady,rola,d1,zwrot1,zwrot2,d2,epilog,koniec', 'zwrot akcji: slajdy po decyzji 1 (' + r.tresc.slajdy.map(s => s.id).join(',') + ')');
spr(ma(uwagi(r), 'Zwrot akcji 2: w linii „PO DECYZJI:” podaj numer od 1 do 2'), 'zwrot akcji: uwaga o numerze');

// 6. oceny
const oc = s => K.oceny(s).join('');
spr(oc('tak, nie') === 'tn' && oc('TAK / RÓŻNIE') === 'tr' && oc('nie ma jednej odpowiedzi; nie') === 'rn' && oc('✓ ✗') === 'tn' && oc('? | tak') === 'rt' && oc('to zależy, zależy') === 'rr', 'oceny: różne zapisy');
spr(oc('taktyka niema') === '' && oc('tak') === 't' && oc('') === '', 'oceny: całe słowa i braki');
spr(oc('tak (zgodne z art. 4), nie (bo nie chroni ucznia)') === 'tn' && oc('Zgodne z prawem? tak; Dobre dla ucznia? nie') === 'tn' && oc('tak nie') === 'tn' && oc('K1 – nie, K2 – nie ma jednej odpowiedzi (tak bywa)') === 'nr', 'oceny: dopiski i nazwy kryteriów');
r = K.zTekstu(glowa + dec(1, 'A').replace('A: Odp A', 'A (pełna odpowiedź): Odp A').replace('A SKUTEK: Sk.', 'A SKRÓT [do 30 znaków]: Krótko\nA SKUTEK (co się dzieje): Sk.') + '\n' + dec(2, 'B') + stopka);
spr(r.gotowe && r.dane.decyzje[0].opcje[0].tekst === 'Odp A' && r.dane.decyzje[0].opcje[0].skrot === 'Krótko' && r.dane.decyzje[0].opcje[0].skutek === 'Sk.', 'etykiety z dopiskami w nawiasach');

// 7. zakończenie liczone z odpowiedzi telefonu
r = K.zTekstu(K.PRZYKLAD);
const epi = r.tresc.przesyl.epilog.b[0][1];
spr(K.wynik(epi, { d1: 'C', d2: 'B', d3: 'A' }) === 0 && K.wynik(epi, { d1: 'C', d2: 'B', d3: 'C' }) === 1 && K.wynik(epi, { d1: 'A', d2: 'A', d3: 'A' }) === 2 && K.wynik(epi, { d1: 'A' }) === undefined, 'zakończenia: dobre, mieszane, słabe, brak decyzji');
const E = K.ekran(r.tresc.przesyl.epilog);
spr(E.bloki[0].html({ d1: 'C', d2: 'B', d3: 'A' }).includes('Sala wychodzi z jedną myślą') && E.bloki[0].html({}).includes('Brakuje którejś decyzji'), 'epilog na telefonie: zakończenie i brak decyzji');
// 8. tekst z karty nie może stać się kodem strony
const zlosliwa = K.zTekstu(glowa.replace('ROLA: R', 'ROLA: <img src=x onerror=alert(1)>') + dec(1, 'A').replace('A SKUTEK: Sk.', 'A SKUTEK: <script>alert(1)</script>') + '\n' + dec(2, 'B') + stopka);
const e1 = K.ekran(zlosliwa.tresc.przesyl.d1), er = K.ekran(zlosliwa.tresc.przesyl.rola);
spr(!er.bloki[0].html.includes('<img') && er.bloki[0].html.includes('&lt;img') && !e1.bloki[1].pokaz('A').includes('<script') && e1.bloki[1].pokaz('A').includes('&lt;script'), 'znaczniki z karty są zamieniane na zwykły tekst');

// 9. karta oddana jednym akapitem (etykiety zlane w linie), nagłówki słowne, „KRYTERIA:” w jednej linii, ozdobne nagłówki
const zlana = K.PRZYKLAD.split('\n\n').map(akapit => akapit.replace(/\n/g, ' ')).join('\n\n');
r = K.zTekstu(zlana);
spr(r.gotowe && r.dane.decyzje.length === 3 && r.dane.decyzje[2].opcje.length === 4 && r.dane.decyzje[0].opcje[3].dlaczego === 'Czas się zgadza, ale wypadła część, dla której warto było przyjść.' && r.dane.k2 === 'Sala coś z tego wyniesie?' && r.dane.epilog.pytanie.startsWith('Jakie jedno zdanie'), 'karta zlana w akapity: etykiety rozdzielone (' + JSON.stringify(bledy(r)).slice(0, 200) + ')');
spr(r.dane.decyzje[1].scena.replace(/\s+/g, ' ') === 'Pięć minut przed zajęciami rzutnik gaśnie. SMS od technika: będę za 20 minut.' && r.dane.decyzje[0].nazwa === 'Za dużo slajdów', 'karta zlana: treść pól bez zmian');
const jednaLinia = K.PRZYKLAD.replace(/\n+/g, ' ');
r = K.zTekstu(jednaLinia);
spr(r.gotowe && r.dane.decyzje.length === 3 && r.dane.decyzje.every(d => d.opcje.length === 4 && d.fakty.length === 2) && r.dane.tytul === 'Jutro prowadzisz zajęcia', 'karta w jednej linii: nadal czytelna (' + JSON.stringify(bledy(r)).slice(0, 200) + ')');
r = K.zTekstu(glowa.replace('KRYTERIUM 1: K1?\nKRYTERIUM 2: K2?', 'KRYTERIA: Zgodne z prawem? / Dobre dla ucznia?') + dec(1, 'A').replace('=== DECYZJA 1 ===', '## Decyzja pierwsza: Prośba').replace('NAZWA: N1\n', '').replace('A: Odp A', 'ODPOWIEDZI:\nA: Odp A').replace('FAKT 1: f\nFAKT 2: g', 'Fakty pomocnicze:\n- f\n- g') + '\n' + dec(2, 'B').replace('=== DECYZJA 2 ===', '=== DECYZJA II ===') + stopka);
spr(r.gotowe && r.dane.k1 === 'Zgodne z prawem?' && r.dane.k2 === 'Dobre dla ucznia?' && r.dane.decyzje.length === 2 && r.dane.decyzje[0].nazwa === 'Prośba' && r.dane.decyzje[0].pytanie === 'Co robisz?' && r.dane.decyzje[0].fakty.length === 2 && r.dane.decyzje[0].opcje.length === 4, 'nagłówki słowne i rzymskie, „KRYTERIA:”, „ODPOWIEDZI:”, „Fakty pomocnicze:” (' + JSON.stringify(bledy(r)) + ')');
r = K.zTekstu(K.PRZYKLAD.replace('SCENA: Robisz próbę z zegarkiem. Wychodzi 31 minut.', 'SCENA: Decyzja i jej skutki są przed tobą.\nKlasa 2 B: uczniowie czekają. Nauczyciel pyta: PYTANIE: czy to już?'));
spr(r.gotowe && r.dane.decyzje.length === 3 && r.dane.decyzje[0].scena.includes('Klasa 2 B: uczniowie czekają.') && r.dane.decyzje[0].scena.includes('Decyzja i jej skutki'), 'zwykłe zdania ze słowem „decyzja” i dwukropkami zostają w scenie');

console.log('KARTA: ' + ok + ' z ' + (ok + zle) + ' sprawdzeń poprawnych');
process.exit(zle ? 1 : 0);
