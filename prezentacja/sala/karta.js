// KARTA PREZENTACJI — prezentacja zapisana zwykłym tekstem z etykietami, bez kodu.
// Ten plik czyta kartę, sprawdza ją, buduje z niej slajdy i ekrany telefonu oraz pilnuje,
// żeby telefony przyjmowały ekrany tylko od strony prowadzącego (podpis).
// Ładują go: strona dla autorów (kreator), strona prowadzącego i telefon uczestnika.
(function (root) {
'use strict';
var K = { WERSJA: '1.0', PREFIKS: 'pzt' };

// ---------- narzędzia ----------
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
// etykiety porównujemy bez wielkości liter, polskich znaków i ozdobników
function norm(s) {
  return String(s).toUpperCase().replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function bajty(s) { return new TextEncoder().encode(s).length; }
function skroc(s, n) { s = String(s); return s.length <= n ? s : s.slice(0, n - 1).replace(/[\s,;:.]+$/, '') + '…'; }
K.esc = esc; K.norm = norm;

// ---------- czytanie karty ----------
var E_GLOWNE = { 'TYTUL': 'tytul', 'TYTUL PREZENTACJI': 'tytul', 'AUTORZY': 'autorzy', 'AUTOR': 'autorzy', 'AUTORKA': 'autorzy', 'PROWADZACY': 'autorzy',
  'MYSL PRZEWODNIA': 'mysl', 'MYSL': 'mysl', 'ROLA': 'rola', 'ROLA SALI': 'rola', 'KRYTERIUM 1': 'k1', 'KRYTERIUM 2': 'k2',
  'PYTANIE PRZED I PO': 'przedpo', 'ODPOWIEDZI PRZED I PO': 'przedpoOdp', 'POCZATEK': 'poczatek', 'KONIEC': 'koniec' };
var E_DEC = { 'KIEDY': 'kiedy', 'NAZWA': 'nazwa', 'TYTUL': 'nazwa', 'SCENA': 'scena', 'NA SLAJD': 'slajd', 'STRESZCZENIE': 'slajd',
  'PYTANIE': 'pytanie', 'OMOWIENIE': 'omowienie' };
var E_OPC = { 'SKROT': 'skrot', 'SKUTEK': 'skutek', 'OCENA': 'ocena', 'OCENY': 'ocena', 'DLACZEGO': 'dlaczego', 'UZASADNIENIE': 'dlaczego' };
var E_EPI = { 'ZAKONCZENIE DOBRE': 'dobre', 'DOBRE ZAKONCZENIE': 'dobre', 'ZAKONCZENIE MIESZANE': 'mieszane', 'ZAKONCZENIE SREDNIE': 'mieszane',
  'ZAKONCZENIE SLABE': 'slabe', 'ZAKONCZENIE ZLE': 'slabe', 'PYTANIE NA KONIEC': 'pytanie', 'KONIEC': 'koniec' };
var E_ZWROT = { 'PO DECYZJI': 'po', 'TYTUL': 'tytul', 'NAZWA': 'tytul', 'TEKST': 'tekst', 'NA SLAJD': 'tekst' };
var SEKCJE = [[/^(DECYZJA|SCENA) (\d+|[IVX]{1,4}|PIERWSZA|DRUGA|TRZECIA|CZWARTA|PIATA|SZOSTA|SIODMA|OSMA)\b ?(.*)$/, 'd'], [/^ZWROT AKCJI\b ?(.*)$/, 'z'], [/^EPILOG$/, 'e'], [/^(ZRODLA|ZRODLO|BIBLIOGRAFIA|LITERATURA)$/, 'zr'],
  [/^DO SPRAWDZENIA$/, 'sp'], [/^(KARTA )?NA WYNOS$/, 'wy']];

K.parsuj = function (tekst) {
  var d = { decyzje: [], zwroty: [], epilog: {}, zrodla: [], sprawdzic: [], wynos: [], pominiete: [] };
  var sek = 'g', dec = null, zwr = null, opc = null, cel = null;   // cel: [obiekt, pole, czyZachowacLinie] — dokąd dopisać linię bez etykiety
  function ustaw(obiekt, pole, wartosc, linie) { obiekt[pole] = wartosc; cel = [obiekt, pole, linie]; }
  function opcja(lit) {
    for (var i = 0; i < dec.opcje.length; i++) if (dec.opcje[i].lit === lit) return dec.opcje[i];
    var o = { lit: lit }; dec.opcje.push(o); return o;
  }
  // Gdy czat oddał kartę zwykłym akapitem, etykiety zlewają się w jedną linię. Linia z trzema lub więcej etykietami jest tu rozcinana.
  var ETY_W_LINII = /\s+(?=(?:TYTUŁ|AUTORZY|MYŚL PRZEWODNIA|ROLA|KRYTERIUM [12]|PYTANIE PRZED I PO|KIEDY|NAZWA|SCENA|NA SLAJD|FAKT \d|PYTANIE NA KONIEC|PYTANIE|[A-F] (?:SKRÓT|SKUTEK|OCENA|DLACZEGO)|[A-F]|ZAKOŃCZENIE (?:DOBRE|MIESZANE|SŁABE)):\s)/g;
  var linie = [];
  String(tekst || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (l) {
    l = l.replace(/\s*(={2,}\s*(?:DECYZJA\s+\d+|ZWROT AKCJI|EPILOG|ŹRÓDŁA|DO SPRAWDZENIA|NA WYNOS)\s*={2,})\s*/g, '\n$1\n');   // nagłówek sekcji w środku linii
    l.split('\n').forEach(function (x) { linie.push((x.match(ETY_W_LINII) || []).length >= 3 ? x.replace(ETY_W_LINII, '\n') : x); });
  });
  linie.join('\n').split('\n').forEach(function (surowa) {
    if (/^\s*(```|~~~)/.test(surowa)) return;                                    // ramka bloku kodu z czatu
    var l = surowa.replace(/\*+/g, '').replace(/__/g, '').replace(/`/g, '').trim();   // pogrubienia i inne ozdobniki
    if (!l) return;
    var znaczniki = /^\s*(#+|=+)/.test(l) || /=+\s*$/.test(l);
    var b = l.replace(/^[#>\s]+/, '').replace(/^[-•–—]\s+/, '');
    if (/^KONTYNUACJA\b/.test(norm(b)) && b.length < 40) return;                 // znak podziału, gdy czat oddawał kartę w częściach
    if (/^\[[^\]]*\]$/.test(b)) return;                                          // niewypełniona linia wzoru, np. „[tak samo B, C i D]”
    // nagłówek sekcji: „=== DECYZJA 1 ===”, „## Decyzja 1: Nazwa”, „EPILOG”
    var n = norm(b.replace(/=/g, ' ').replace(/:\s*$/, '')), i, m;
    for (i = 0; i < SEKCJE.length; i++) {
      m = SEKCJE[i][0].exec(n);
      if (!m) continue;
      var reszta = SEKCJE[i][1] === 'd' ? m[3] : SEKCJE[i][1] === 'z' ? m[1] : '';
      if (!znaczniki && (reszta ? (b.length > 60 || /[.!?]$/.test(b) || !/[:–—-]/.test(b)) : false)) continue;   // zwykłe zdanie zaczynające się od słowa „Decyzja…”
      if (!znaczniki && SEKCJE[i][1] === 'd' && m[1] === 'SCENA') continue;
      sek = SEKCJE[i][1]; opc = null; cel = null;
      if (sek === 'd') {
        dec = { nr: Number(m[2]), fakty: [], opcje: [] }; d.decyzje.push(dec);
        var po = b.replace(/=/g, ' ').trim().replace(/^\S+\s+[^\s:–—-]+\s*[:–—-]?\s*/, '').trim();   // „Decyzja 1: Prośba” → nazwa
        if (po) dec.nazwa = po;
      }
      if (sek === 'z') { zwr = {}; d.zwroty.push(zwr); }
      return;
    }
    if (sek === 'zr' || sek === 'sp' || sek === 'wy') {
      m = /^([^:]{1,48}):\s*(.*)$/.exec(b);
      if (m && E_GLOWNE[norm(m[1])]) { sek = 'g'; ustaw(d, E_GLOWNE[norm(m[1])], m[2].trim()); return; }   // etykieta z góry karty wpisana po listach
      var poz = b.replace(/^\d+[.)]\s+/, '').trim();
      if (poz && !/^\[.*\]$/.test(poz) && !/^(BRAK|NIE DOTYCZY)$/.test(norm(poz))) d[sek === 'zr' ? 'zrodla' : sek === 'sp' ? 'sprawdzic' : 'wynos'].push(poz);
      return;
    }
    // odpowiedź zapisana jako „A) tekst” albo „A. tekst”
    if (sek === 'd' && (m = /^([A-F])[.)]\s+(\S.*)$/.exec(b) || /^([a-f])\)\s+(\S.*)$/.exec(b))) { opc = opcja(m[1].toUpperCase()); ustaw(opc, 'tekst', m[2]); return; }
    m = /^([^:]{1,48}):\s*(.*)$/.exec(b);
    if (m) {
      var e = norm(m[1].replace(/[(\[][^)\]]*[)\]]/g, ' ')), w = m[2].trim(), x;   // „A SKRÓT (do 30 znaków):” → A SKROT
      if (!w && /^(ODPOWIEDZI|MOZLIWE ODPOWIEDZI|OPCJE|WARIANTY|DECYZJE|KARTA PREZENTACJI|KARTA)$/.test(e)) return;   // nagłówek dla ozdoby
      if (e === 'KRYTERIA' && (x = w.split(/\s*[|;/]\s*|\s+(?:oraz|i)\s+(?=[A-ZŁŚŻŹĆ])/)).length === 2) { d.k1 = x[0].trim(); d.k2 = x[1].trim(); cel = null; return; }
      if (e === 'FAKTY POMOCNICZE') e = 'FAKTY';
      if (sek === 'd') {
        if ((x = /^(?:ODPOWIEDZ |OPCJA )?([A-F])$/.exec(e))) { opc = opcja(x[1]); ustaw(opc, 'tekst', w); return; }
        if ((x = /^([A-F]) (\w+)$/.exec(e)) && E_OPC[x[2]]) { opc = opcja(x[1]); ustaw(opc, E_OPC[x[2]], w); return; }
        if ((x = /^(\w+) ([A-F])$/.exec(e)) && E_OPC[x[1]]) { opc = opcja(x[2]); ustaw(opc, E_OPC[x[1]], w); return; }
        if (E_OPC[e] && opc) { ustaw(opc, E_OPC[e], w); return; }
        if (/^FAKT( \d+)?$/.test(e)) { dec.fakty.push(w); cel = [dec.fakty, dec.fakty.length - 1]; return; }
        if (e === 'FAKTY') { cel = [dec.fakty, -1]; if (w) { dec.fakty.push(w); cel = [dec.fakty, dec.fakty.length - 1]; } return; }
        if (E_DEC[e]) { opc = null; ustaw(dec, E_DEC[e], w, E_DEC[e] === 'scena'); return; }
      }
      if (sek === 'e' && E_EPI[e]) { ustaw(d.epilog, E_EPI[e], w); return; }
      if (sek === 'z' && E_ZWROT[e]) { ustaw(zwr, E_ZWROT[e], w, E_ZWROT[e] === 'tekst'); return; }
      if (E_GLOWNE[e] && (sek === 'g' || !(sek === 'd' && E_DEC[e]))) { ustaw(d, E_GLOWNE[e], w, E_GLOWNE[e] === 'rola'); return; }
    }
    // linia bez etykiety: ciąg dalszy poprzedniego pola
    if (cel && cel[1] === -1) { cel[0].push(b); return; }                         // lista faktów po etykiecie „FAKTY:”
    if (cel) { cel[0][cel[1]] = (cel[0][cel[1]] ? cel[0][cel[1]] + (cel[2] ? '\n' : ' ') : '') + (cel[2] ? l : b); return; }
    d.pominiete.push(l);
  });
  return d;
};

// „tak, nie” → ['t', 'n']; przyjmuje też: różnie, to zależy, nie ma jednej odpowiedzi, ✓, ✗, ? oraz dopiski w rodzaju „tak (art. 4), nie (bo…)”
function oceny(s) {
  function slowa(c) {
    if (/^\s*\?\s*$/.test(c)) return ['r'];
    var w = [], re = /\b(NIE MA JEDNEJ ODPOWIEDZI|TO ZALEZY|ZALEZY|ROZNIE|ROZNE|CZESCIOWO|TAK|NIE)\b|([✓✔✗✘])/g, m;
    var t = c.toUpperCase().replace(/Ł/g, 'L').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    while ((m = re.exec(t))) w.push(m[2] ? (/[✓✔]/.test(m[2]) ? 't' : 'n') : m[1] === 'TAK' ? 't' : m[1] === 'NIE' ? 'n' : 'r');
    return w;
  }
  var czesci = String(s || '').split(/[,;/|]/).map(slowa).filter(function (w) { return w.length; });
  if (czesci.length >= 2) return [czesci[0][0], czesci[1][0]];   // dwie części: z każdej liczy się pierwsze słowo, reszta to dopisek
  return czesci.length ? czesci[0].slice(0, 2) : [];
}
K.oceny = oceny;

// ---------- sprawdzanie i uzupełnianie: zwraca listę uwag po polsku; „blad” blokuje uruchomienie ----------
K.sprawdz = function (d) {
  var u = [], N = d.decyzje.length;
  function blad(t) { u.push({ p: 'blad', t: t }); } function uwaga(t) { u.push({ p: 'uwaga', t: t }); }
  function puste(x) { return !x || !String(x).trim() || /^\[[^\]]*\]$/.test(String(x).trim()) || /^(…|\.\.\.)$/.test(String(x).trim()); }
  if (!N) { blad('Nie widzę żadnej decyzji. Każda zaczyna się od linii „=== DECYZJA 1 ===”.'); return { uwagi: u, gotowe: false, minuty: 0 }; }
  if (puste(d.tytul)) { uwaga('Brakuje linii „TYTUŁ:”. Na pierwszym slajdzie będzie napis „Prezentacja”.'); d.tytul = 'Prezentacja'; }
  if (puste(d.k1)) blad('Brakuje linii „KRYTERIUM 1:”. To krótkie pytanie, według którego oceniasz każdą odpowiedź, np. „Zgodne z prawem?”.');
  if (puste(d.k2)) blad('Brakuje linii „KRYTERIUM 2:”. To drugie krótkie pytanie do oceny odpowiedzi.');
  if (puste(d.rola)) { uwaga('Brakuje linii „ROLA:” (kim jest sala, np. „Jesteś psychologiem w szkole”). Slajd z rolą zostanie pominięty.'); d.rola = ''; }
  if (puste(d.mysl)) { uwaga('Brakuje linii „MYŚL PRZEWODNIA:”. To jedno zdanie, z którym sala ma wyjść; trafia na ostatni slajd.'); d.mysl = ''; }
  if (puste(d.autorzy)) d.autorzy = '';
  if (puste(d.przedpo)) d.przedpo = '';
  var odp = puste(d.przedpoOdp) ? [] : String(d.przedpoOdp).split(/\s*[|/;]\s*|\s*,\s*/).filter(Boolean);
  d.przedpoLista = odp.length >= 2 && odp.length <= 5 ? odp : ['Tak', 'Nie', 'To zależy'];
  var najlepsze = [];
  d.decyzje.forEach(function (dec, i) {
    var g = 'Decyzja ' + (i + 1) + ': ', lit = {};
    dec.id = 'd' + (i + 1);
    if (puste(dec.nazwa)) { uwaga(g + 'brakuje linii „NAZWA:” (2–4 słowa na slajd).'); dec.nazwa = 'Decyzja ' + (i + 1); }
    if (puste(dec.kiedy)) dec.kiedy = '';
    if (puste(dec.scena)) { blad(g + 'brakuje linii „SCENA:”.'); dec.scena = ''; }
    if (puste(dec.slajd)) dec.slajd = skroc(dec.scena.replace(/\s+/g, ' '), 170);
    if (puste(dec.pytanie)) dec.pytanie = 'Co robisz?';
    if (puste(dec.omowienie)) dec.omowienie = '';
    dec.fakty = dec.fakty.filter(function (f) { return !puste(f); });
    if (dec.fakty.length < 2) uwaga(g + 'podaj dwa fakty pomocnicze („FAKT 1:” i „FAKT 2:”). ' + (dec.fakty.length ? 'Jest jeden.' : 'Nie ma żadnego.'));
    if (dec.opcje.length < 2) { blad(g + 'potrzebne są co najmniej dwie odpowiedzi („A:”, „B:”…), a najlepiej cztery.'); }
    else if (dec.opcje.length !== 4) uwaga(g + 'liczba odpowiedzi: ' + dec.opcje.length + '. Format zakłada cztery.');
    var dobre = [];
    dec.opcje.forEach(function (o) {
      var go = 'Decyzja ' + (i + 1) + ', odpowiedź ' + o.lit + ': ';
      if (lit[o.lit]) blad(go + 'ta litera występuje dwa razy.'); lit[o.lit] = 1;
      if (puste(o.tekst)) { blad(go + 'brakuje treści odpowiedzi (linia „' + o.lit + ':”).'); o.tekst = ''; }
      if (puste(o.skutek)) { blad(go + 'brakuje linii „' + o.lit + ' SKUTEK:” (co się dzieje po tej odpowiedzi).'); o.skutek = ''; }
      o.oc = oceny(o.ocena);
      if (o.oc.length !== 2) { blad(go + 'w linii „' + o.lit + ' OCENA:” podaj dwa słowa: tak, nie albo różnie. Pierwsze dotyczy kryterium 1, drugie kryterium 2.'); o.oc = ['r', 'r']; }
      if (puste(o.dlaczego)) { uwaga(go + 'brakuje linii „' + o.lit + ' DLACZEGO:” (jedno zdanie z podstawą oceny).'); o.dlaczego = ''; }
      if (puste(o.skrot)) o.skrot = skroc(o.tekst.replace(/[.!?]+$/, ''), 30);
      else if (o.skrot.length > 34) uwaga(go + 'skrót ma ' + o.skrot.length + ' znaków. Na wykresie mieści się ok. 30.');
      if (o.oc[0] === 't' && o.oc[1] === 't') dobre.push(o.lit);
    });
    if (dec.opcje.length >= 2) {
      if (!dobre.length) uwaga(g + 'żadna odpowiedź nie ma oceny „tak, tak”. Jeśli tak ma być, zostaw.');
      else if (dobre.length === dec.opcje.length) uwaga(g + 'wszystkie odpowiedzi mają ocenę „tak, tak”, więc sala nie ma czego rozstrzygać.');
    }
    najlepsze.push(dobre.length === 1 ? dobre[0] : null);
    var roz = bajty(JSON.stringify(K._ekranDecyzji(dec, i, N)));
    if (roz > 3600) blad(g + 'jest za długa na jeden ekran telefonu (o ok. ' + Math.ceil((roz - 3600) / 100) * 100 + ' znaków). Skróć scenę albo skutki.');
  });
  if (N >= 3 && najlepsze[0] && najlepsze.every(function (x) { return x === najlepsze[0]; }))
    uwaga('Najlepsza odpowiedź stoi w każdej decyzji pod literą ' + najlepsze[0] + '. Przestaw odpowiedzi, żeby nie dało się zgadywać.');
  var e = d.epilog;
  if (puste(e.dobre) || puste(e.mieszane) || puste(e.slabe)) uwaga('W części „=== EPILOG ===” brakuje któregoś z trzech zakończeń (DOBRE, MIESZANE, SŁABE). W puste miejsce wstawię zdanie domyślne.');
  if (puste(e.dobre)) e.dobre = 'Twoje decyzje spełniały oba kryteria.';
  if (puste(e.mieszane)) e.mieszane = 'Część twoich decyzji spełniała oba kryteria.';
  if (puste(e.slabe)) e.slabe = 'Większość twoich decyzji nie spełniała obu kryteriów.';
  if (puste(e.pytanie)) e.pytanie = '';
  d.zwroty = d.zwroty.filter(function (z, i) {
    var po = parseInt(z.po, 10);
    if (puste(z.tekst)) { uwaga('Zwrot akcji ' + (i + 1) + ': brakuje linii „TEKST:”. Pomijam go.'); return false; }
    if (!(po >= 1 && po <= N)) { uwaga('Zwrot akcji ' + (i + 1) + ': w linii „PO DECYZJI:” podaj numer od 1 do ' + N + '. Wstawiam go po decyzji 1.'); po = 1; }
    z.po = po; if (puste(z.tytul)) z.tytul = 'Zwrot akcji';
    return true;
  });
  if (!d.zrodla.length) uwaga('Część „=== ŹRÓDŁA ===” jest pusta. Na ostatnim slajdzie nie będzie bibliografii.');
  if (d.pominiete.length) uwaga('Pominąłem ' + d.pominiete.length + ' ' + (d.pominiete.length === 1 ? 'linię' : 'linii') + ' bez etykiety na początku karty, np. „' + skroc(d.pominiete[0], 50) + '”.');
  var minuty = 4 + N * 3 + d.zwroty.length + 3 + (d.przedpo ? 2 : 0);
  if (N > 6) uwaga('Decyzji jest ' + N + '. Jedna zajmuje ok. 3 minut, więc sama historia potrwa ok. ' + N * 3 + ' minut.');
  return { uwagi: u, gotowe: !u.some(function (x) { return x.p === 'blad'; }), minuty: minuty };
};

// ---------- ekrany telefonu jako dane (to one jadą do telefonów razem ze zmianą slajdu) ----------
// Ekran: { z: znacznik, t: tytuł, c: czas paska, s: stopka, b: [bloki] }
// Bloki: ['T', [[styl, tekst], …], [nagłówek, [fakty]]]   tekst; styl: kw | op | sms | lead | muted
//        ['W', klucz, pytanie, [[wartość, napis], …], flagi (1 = w rzędzie, 2 = tylko raz), { wartość: skutek }, dopisek]
//        ['E', dane epilogu]                               własne zakończenie liczone na telefonie
function akapity(tekst) {
  return String(tekst || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
    if (/^\(.*\)$/.test(l)) return ['op', l.slice(1, -1)];
    if (/^(sms|wiadomość|wiadomosc|e-?mail|czat)\b/i.test(l)) return ['sms', l];
    return ['kw', l];
  });
}
K.CZAS = 30;   // ile sekund odmierza pasek na telefonie przy decyzji
K._ekranDecyzji = function (dec, i, n) {
  var skutki = {}; dec.opcje.forEach(function (o) { skutki[o.lit] = o.skutek || ''; });
  return { z: (dec.kiedy ? dec.kiedy + ' · ' : '') + 'decyzja ' + (i + 1) + ' z ' + n, t: dec.nazwa || '', c: K.CZAS, s: 'Liczy się pierwsza odpowiedź.',
    b: [['T', akapity(dec.scena), dec.fakty && dec.fakty.length ? ['Zanim zdecydujesz: ' + (dec.fakty.length === 2 ? 'dwa fakty' : 'fakty'), dec.fakty] : null],
        ['W', dec.id || 'd' + (i + 1), dec.pytanie || 'Co robisz?', dec.opcje.map(function (o) { return [o.lit, o.tekst || '']; }), 2, skutki, 'Teraz spójrz na duży ekran. Dalej idziemy razem.']] };
};
function daneEpilogu(d) {
  return { k: [d.k1, d.k2], z: [d.epilog.dobre, d.epilog.mieszane, d.epilog.slabe],
    d: d.decyzje.map(function (dec) { var o = {}; dec.opcje.forEach(function (x) { o[x.lit] = [x.skrot, x.oc[0], x.oc[1]]; }); return { id: dec.id, k: dec.kiedy || dec.nazwa, o: o }; }) };
}
// zakończenie jednego telefonu: 0 dobre, 1 mieszane, 2 słabe; undefined, gdy brakuje którejś decyzji
K.wynik = function (e, a) {
  var dobre = 0, i, o;
  for (i = 0; i < e.d.length; i++) { o = e.d[i].o[a[e.d[i].id]]; if (!o) return undefined; if (o[1] === 't' && o[2] === 't') dobre++; }
  return dobre === e.d.length ? 0 : dobre * 2 >= e.d.length ? 1 : 2;
};
function znak(z) { return '<span class="zn ' + (z === 't' ? 'tak' : z === 'n' ? 'nie' : 'rozne') + '">' + (z === 't' ? '✓ tak' : z === 'n' ? '✗ nie' : '? to zależy') + '</span>'; }
K.znak = znak;
function epilogHtml(e, a) {
  var w = K.wynik(e, a || {});
  if (w === undefined) return '<p class="lead">Brakuje którejś decyzji.</p><p class="muted">Wróć do niej przez link na dole ekranu.</p>';
  return '<p class="lead">' + esc(e.z[w]) + '</p>' + e.d.map(function (x) {
    var o = x.o[a[x.id]];
    return '<div class="ev"><b>' + esc(x.k) + '.</b> ' + esc(o[0]) + '<br>' + esc(e.k[0]) + ' ' + znak(o[1]) + '<br>' + esc(e.k[1]) + ' ' + znak(o[2]) + '</div>';
  }).join('');
}
var STYLE = { kw: 1, op: 1, sms: 1, lead: 1, muted: 1, small: 1 };
// dane ekranu → ekran w postaci, którą rysuje strona telefonu; cały tekst z karty jest tu zamieniany na zwykły tekst (bez znaczników HTML)
K.ekran = function (w) {
  var E = { znacznik: String(w.z || ''), tytul: String(w.t || ''), bloki: [] };
  if (w.c) E.czas = Number(w.c) || 0; if (w.s) E.stopka = String(w.s); if (w.w) E.wyslij = String(w.w);
  (w.b || []).forEach(function (b) {
    if (!b) return;
    if (b[0] === 'T') E.bloki.push({ typ: 'tekst', html: (b[1] || []).map(function (p) { return '<p class="' + (STYLE[p[0]] ? p[0] : 'kw') + '">' + esc(p[1]) + '</p>'; }).join('') +
      (b[2] ? '<details class="fakty" open><summary>' + esc(b[2][0]) + '</summary><ul>' + (b[2][1] || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></details>' : '') });
    else if (b[0] === 'W') E.bloki.push({ typ: 'wybor', klucz: String(b[1]), pytanie: String(b[2] || ''), opcje: (b[3] || []).map(function (o) { return [String(o[0]), String(o[1])]; }),
      uklad: b[4] & 1 ? 'rzad' : '', raz: !!(b[4] & 2),
      pokaz: b[5] ? function (v) { var t = b[5][v]; return t ? '<div class="ev">' + esc(t) + '</div>' + (b[6] ? '<p class="muted">' + esc(b[6]) + '</p>' : '') : ''; } : null });
    else if (b[0] === 'E') E.bloki.push({ typ: 'tekst', html: function (a) { return epilogHtml(b[1], a); } });
  });
  return E;
};
var START = { t: 'Jesteś z nami', b: [['T', [['lead', 'Odłóż telefon ekranem w dół.'], ['muted', 'Kiedy będzie potrzebny, ekran sam się zmieni.']]]] };
// treść dla telefonu w trybie karty: na początku tylko ekran powitalny, resztę przysyła strona prowadzącego
K.telefon = function () { return { prefiks: K.PREFIKS, tytul: 'Prezentacja', nazwaTelefon: 'Prezentacja', karta: true, ekrany: { start: K.ekran(START) } }; };

// ---------- slajdy i ekrany z karty (strona prowadzącego) ----------
K.zbuduj = function (d) {
  var N = d.decyzje.length, P = { start: START }, SL = [], epi = daneEpilogu(d);
  function proc(v, n) { return v + ' (' + (n ? Math.round(v / n * 100) : 0) + '%)'; }
  SL.push({ id: 'tytul', ekran: 'start', html: function (h) {
    return '<div class="row" style="height:100%;align-items:center"><div class="col"><h1 style="font-size:' + (d.tytul.length > 34 ? 64 : 84) + 'px">' + esc(d.tytul) + '</h1>' +
      (d.autorzy ? '<div class="sub" style="margin-top:44px;color:var(--ink);font-weight:600">' + esc(d.autorzy) + '</div>' : '') + '</div>' +
      '<div style="flex:none;text-align:center">' + h.qr(420) + '<div style="font-size:26px;margin-top:14px">Zeskanuj kod aparatem telefonu</div>' +
      '<div style="font-size:24px;color:var(--ink2);margin-top:6px">Dołączyło: <b style="color:var(--ink)">' + h.osoby() + '</b></div></div></div>'; } });
  SL.push({ id: 'zasady', html: function () {
    return '<div class="kicker">Zanim zaczniemy</div><h1>Zasady na dziś</h1><ol class="rules"><li>Odpowiedzi z telefonów są anonimowe.</li><li>Każde pytanie można pominąć.</li>' +
      '<li>Wyniki pokazujemy dla całej sali, nigdy dla jednej osoby.</li></ol><div class="foot">Historia, którą zaraz poznacie, jest wymyślona. Fakty i oceny odpowiedzi mają źródła podane na końcu.</div>'; } });
  if (d.przedpo) {
    P.przed = { z: 'Pytanie na start', t: d.przedpo, s: 'Odpowiedź jest anonimowa. Wyniki zobaczymy na końcu.', b: [['W', 'przed', '', d.przedpoLista.map(function (o, i) { return ['o' + (i + 1), o]; }), 0]] };
    SL.push({ id: 'przed', ekran: 'przed', html: function (h) {
      return '<div class="kicker">Pytanie na start · telefon</div><h1 class="q">' + esc(d.przedpo) + '</h1>' + h.zebrane('przed') +
        '<div class="foot">Teraz tylko zbieramy odpowiedzi. To samo pytanie wróci na końcu.</div>'; } });
  }
  if (d.rola) {
    P.rola = { z: 'Twoja rola', t: d.tytul, b: [['T', akapity(d.rola).concat([['op', 'Przed tobą ' + N + ' ' + (N === 1 ? 'decyzja' : N < 5 ? 'decyzje' : 'decyzji') + '. Kiedy przyjdzie pora, ekran sam się zmieni.']])]] };
    SL.push({ id: 'rola', ekran: 'rola', html: function () {
      return '<div class="kicker">Historia · twoja rola</div><h1>' + esc(d.tytul) + '</h1><div class="scena">' + akapity(d.rola).map(function (p) { return esc(p[1]); }).join('<br>') + '</div>' +
        '<div class="foot">Przed wami ' + N + ' ' + (N === 1 ? 'decyzja' : N < 5 ? 'decyzje' : 'decyzji') + '. Każdą podejmujecie na telefonie, a potem omawiamy ją na ekranie.</div>'; } });
  }
  d.decyzje.forEach(function (dec, i) {
    P[dec.id] = K._ekranDecyzji(dec, i, N);
    SL.push({ id: dec.id, ekran: dec.id, kroki: 2, html: function (h, k) {
      var glowa = '<div class="kicker">Historia · decyzja ' + (i + 1) + ' z ' + N + (dec.kiedy ? ' · ' + esc(dec.kiedy) : '') + (k ? '' : ' · telefon') + '</div><h1 class="q">' + esc(dec.nazwa) + '</h1>';
      if (k === 0) return glowa + '<div class="scena">' + esc(dec.slajd) + '</div>' +
        (dec.fakty.length ? '<div class="box"><div class="lbl">Zanim zdecydujesz</div><ul>' + dec.fakty.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' : '') +
        h.zebrane(dec.id) + '<div class="foot">Na telefonie: scena, fakty i odpowiedzi. Pasek na telefonie odmierza ' + K.CZAS + ' sekund.</div>';
      if (k === 1) {
        var c = h.zlicz(dec.id), n = h.ile(dec.id);
        return glowa + h.slupki({ max: Math.max.apply(null, [1].concat(dec.opcje.map(function (o) { return c[o.lit] || 0; }))), fmt: function (v) { return proc(v, n); },
          serie: [{ nazwa: 'Wybory sali', kolor: 'var(--s1)' }], grupy: dec.opcje.map(function (o) { return { etykieta: esc(o.skrot), wartosci: [c[o.lit] || 0] }; }) }) +
          '<div class="foot">Wybory tej sali (n = ' + n + '). Następne kliknięcie pokaże ocenę każdej odpowiedzi.</div>';
      }
      return glowa + '<table class="t maly"><tr><th>Odpowiedź</th><th>' + esc(d.k1) + '</th><th>' + esc(d.k2) + '</th><th>Dlaczego</th></tr>' +
        dec.opcje.map(function (o) { return '<tr><td>' + esc(o.skrot) + '</td><td>' + znak(o.oc[0]) + '</td><td>' + znak(o.oc[1]) + '</td><td>' + esc(o.dlaczego) + '</td></tr>'; }).join('') + '</table>'; } });
    d.zwroty.forEach(function (z, j) {
      if (z.po !== i + 1) return;
      var id = 'zwrot' + (j + 1);
      P[id] = { z: 'Zwrot akcji', t: z.tytul, b: [['T', akapity(z.tekst).concat([['muted', 'Spójrz na duży ekran.']])]] };
      SL.push({ id: id, ekran: id, html: function () {
        return '<div class="kicker">Historia · zwrot akcji</div><h1>' + esc(z.tytul) + '</h1><div class="scena">' + akapity(z.tekst).map(function (p) { return esc(p[1]); }).join('<br>') + '</div>'; } });
    });
  });
  P.epilog = { z: 'Epilog', t: 'Twoje zakończenie', b: [['E', epi]] };
  SL.push({ id: 'epilog', ekran: 'epilog', kroki: d.epilog.pytanie ? 2 : 1, html: function (h, k) {
    if (!k) return '<div class="kicker">Historia · epilog · telefon</div><h1>Epilog</h1><div class="scena">Każdy ma teraz na telefonie własne zakończenie: co wynikło z jego decyzji.</div>' +
      '<div class="foot">Następne kliknięcie pokaże zakończenia całej sali.</div>';
    if (k === 2) return '<div class="kicker">Historia · pytanie na koniec</div><h1 class="q" style="margin-top:120px;font-size:60px">' + esc(d.epilog.pytanie) + '</h1>';
    var c = h.policz(function (a) { return K.wynik(epi, a); }), n = (c[0] || 0) + (c[1] || 0) + (c[2] || 0);
    return '<div class="kicker">Historia · epilog</div><h1>Jak skończyła sala</h1>' + h.slupki({ max: Math.max(1, c[0] || 0, c[1] || 0, c[2] || 0), fmt: function (v) { return proc(v, n); },
      serie: [{ nazwa: 'Zakończenia', kolor: 'var(--s1)' }], grupy: [0, 1, 2].map(function (z) { return { etykieta: esc(skroc(epi.z[z], 70)), wartosci: [c[z] || 0] }; }) }) +
      '<div class="foot">Zakończenie zależy od tego, ile decyzji spełniło oba kryteria (n = ' + n + '). To obraz tej sali, nie badanie.</div>'; } });
  if (d.przedpo) {
    P.po = { z: 'Pytanie na koniec', t: d.przedpo, s: 'To samo pytanie co na początku.', b: [['W', 'po', '', d.przedpoLista.map(function (o, i) { return ['o' + (i + 1), o]; }), 0]] };
    SL.push({ id: 'po', ekran: 'po', kroki: 1, html: function (h, k) {
      return '<div class="kicker">' + (k ? 'Przed i po' : 'Pytanie na koniec · telefon') + '</div><h1 class="q">' + esc(d.przedpo) + '</h1>' + (k ? h.wykres('przed', { z: 'po' }) : h.zebrane('po')) +
        '<div class="foot">' + (k ? 'Liczba osób i odsetek w danym pomiarze. To obraz tej sali, nie badanie.' : 'Następne kliknięcie porówna odpowiedzi z początku i z końca.') + '</div>'; } });
  }
  P.karta = { z: 'Na wynos', t: d.tytul, b: [['T', (d.mysl ? [['lead', d.mysl]] : []).concat(d.wynos.map(function (l) { return ['kw', l]; })).concat([['muted', 'Jeśli chcesz zachować tę kartę, zrób zrzut ekranu.']])]] };
  SL.push({ id: 'koniec', ekran: 'karta', html: function () {
    return '<div class="kicker">Na koniec</div><h1>' + (d.mysl ? esc(d.mysl) : 'Dziękujemy') + '</h1>' +
      (d.zrodla.length ? '<div class="foot" style="font-size:19px"><b>Źródła:</b> ' + d.zrodla.map(esc).join(' · ') + '</div>' : ''); } });
  var ekrany = {}; Object.keys(P).forEach(function (id) { ekrany[id] = K.ekran(P[id]); });
  return { prefiks: K.PREFIKS, tytul: d.tytul, nazwaTelefon: 'Prezentacja', karta: true, przesyl: P, ekrany: ekrany, slajdy: SL };
};
// karta jako tekst → gotowa treść dla strony prowadzącego albo null, gdy są błędy
K.zTekstu = function (tekst) {
  var d = K.parsuj(tekst), s = K.sprawdz(d), tresc = s.gotowe ? K.zbuduj(d) : null;
  if (tresc) Object.keys(tresc.przesyl).forEach(function (id) {   // każdy ekran musi się zmieścić w jednej wiadomości do telefonów
    if (bajty(JSON.stringify(tresc.przesyl[id])) > 3600) { s.uwagi.push({ p: 'blad', t: 'Ekran „' + id + '” jest za długi dla telefonu. Skróć tekst w tej części karty.' }); s.gotowe = false; }
  });
  return { dane: d, uwagi: s.uwagi, gotowe: s.gotowe, minuty: s.minuty, tresc: s.gotowe ? tresc : null };
};

// ---------- podpis: telefony przyjmują ekrany tylko od strony prowadzącego ----------
// Strona prowadzącego losuje parę kluczy dla sesji. Do kodu QR trafia krótki odcisk klucza publicznego (22 znaki),
// a każdy wysłany ekran niesie klucz publiczny i podpis: „K1.klucz.podpis.treść”. Telefon sprawdza, czy klucz pasuje do odcisku
// z adresu i czy podpis pasuje do treści. Kto nie ma klucza prywatnego (zostaje w przeglądarce prowadzącego), nie podmieni ekranu.
var ALG = { name: 'ECDSA', namedCurve: 'P-256' }, PODPIS = { name: 'ECDSA', hash: 'SHA-256' };
function b64(bajt) { var s = '', i; for (i = 0; i < bajt.length; i++) s += String.fromCharCode(bajt[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function zb64(t) { t = String(t).replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; var s = atob(t), b = new Uint8Array(s.length), i; for (i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
function odcisk(pub) { return root.crypto.subtle.digest('SHA-256', zb64(pub)).then(function (h) { return b64(new Uint8Array(h).subarray(0, 16)); }); }
K.dostepnyPodpis = function () { return !!(root.crypto && root.crypto.subtle && root.TextEncoder); };
// strona prowadzącego: { odcisk, podpisz(tekst) → Promise<'K1.klucz.podpis.tekst'> }; klucz zostaje w pamięci przeglądarki, żeby przetrwał odświeżenie strony
K.nadawca = function (kod, mag) {
  var miejsce = 'pzt-klucz:' + kod, zap = null, cs = root.crypto.subtle;
  try { zap = JSON.parse(mag.getItem(miejsce) || 'null'); } catch (e) {}
  var p = zap && zap.d && zap.p ? cs.importKey('jwk', zap.d, ALG, false, ['sign']).then(function (k) { return [k, zap.p]; })
    : cs.generateKey(ALG, true, ['sign', 'verify']).then(function (para) {
        return Promise.all([cs.exportKey('jwk', para.privateKey), cs.exportKey('raw', para.publicKey)]).then(function (w) {
          var pub = b64(new Uint8Array(w[1]).subarray(1));
          try { mag.setItem(miejsce, JSON.stringify({ d: w[0], p: pub })); } catch (e) {}
          return [para.privateKey, pub];
        });
      });
  return p.then(function (w) {
    return odcisk(w[1]).then(function (o) {
      return { odcisk: o, podpisz: function (tekst) {
        return cs.sign(PODPIS, w[0], new TextEncoder().encode(tekst)).then(function (s) { return 'K1.' + w[1] + '.' + b64(new Uint8Array(s)) + '.' + tekst; });
      } };
    });
  });
};
// telefon: funkcja, która z surowej wiadomości zwraca jej treść albo null, gdy klucz nie pasuje do odcisku z adresu lub podpis do treści
K.odbiorca = function (odciskZAdresu) {
  var znane = {};   // klucz publiczny → Promise<zaimportowany klucz albo null>
  function klucz(pub) {
    if (!znane[pub]) znane[pub] = odcisk(pub).then(function (o) {
      if (o !== odciskZAdresu) return null;
      var b = zb64(pub), pelny = new Uint8Array(65); if (b.length !== 64) return null; pelny[0] = 4; pelny.set(b, 1);
      return root.crypto.subtle.importKey('raw', pelny, ALG, false, ['verify']);
    }).catch(function () { return null; });
    return znane[pub];
  }
  return function (surowa) {
    if (typeof surowa !== 'string' || surowa.slice(0, 3) !== 'K1.') return Promise.resolve(null);
    var i = surowa.indexOf('.', 3), j = i < 0 ? -1 : surowa.indexOf('.', i + 1), sig, tekst;
    if (j < 0) return Promise.resolve(null);
    tekst = surowa.slice(j + 1);
    try { sig = zb64(surowa.slice(i + 1, j)); } catch (e) { return Promise.resolve(null); }
    return klucz(surowa.slice(3, i)).then(function (k) { return k ? root.crypto.subtle.verify(PODPIS, k, sig, new TextEncoder().encode(tekst)) : false; })
      .then(function (ok) { if (!ok) return null; try { return JSON.parse(tekst); } catch (e) { return null; } })
      .catch(function () { return null; });
  };
};

// ---------- przykładowa karta (ta sama historia co w pokazie) ----------
K.PRZYKLAD = [
'TYTUŁ: Jutro prowadzisz zajęcia',
'AUTORZY: Imię Nazwisko',
'MYŚL PRZEWODNIA: Z zajęć zostaje jedna myśl, więc wszystko inne ma jej służyć.',
'ROLA: Jutro prowadzisz zajęcia. Masz 20 minut i 24 slajdy.',
'Jest wieczór przed zajęciami.',
'KRYTERIUM 1: Zmieścisz się w czasie?',
'KRYTERIUM 2: Sala coś z tego wyniesie?',
'PYTANIE PRZED I PO: Czy dobre zajęcia to przede wszystkim dużo materiału?',
'',
'=== DECYZJA 1 ===',
'KIEDY: Wieczór, 20:00',
'NAZWA: Za dużo slajdów',
'SCENA: Robisz próbę z zegarkiem. Wychodzi 31 minut.',
'Jutro masz na to 20.',
'NA SLAJD: Próba z zegarkiem: 31 minut. Jutro masz 20.',
'FAKT 1: Sala nie zna tematu, a połowa slajdów to definicje.',
'FAKT 2: Najciekawsza część wypada dopiero w 28. minucie próby.',
'PYTANIE: Co robisz?',
'A: Mówię szybciej i niczego nie wycinam.',
'A SKRÓT: Mówię szybciej',
'A SKUTEK: Jutro kończysz w 26. minucie. Ostatnie slajdy przewijasz bez słowa.',
'A OCENA: nie, nie',
'A DLACZEGO: 26 minut zamiast 20, a końcówka bez komentarza.',
'B: Wycinam ciekawostki i dwie definicje.',
'B SKRÓT: Wycinam ciekawostki',
'B SKUTEK: Wychodzą 23 minuty. Definicje nadal idą jedna po drugiej.',
'B OCENA: nie, różnie',
'B DLACZEGO: Trzy minuty za długo. Treści jest mniej, układ ten sam.',
'C: Zostawiam jedną myśl i slajdy, które jej służą.',
'C SKRÓT: Zostawiam jedną myśl',
'C SKUTEK: Wychodzi 17 minut. Zostaje czas na pytanie do sali.',
'C OCENA: tak, tak',
'C DLACZEGO: 17 minut. Wszystko, co zostało, prowadzi do jednej myśli.',
'D: Wycinam końcówkę, bo jest najdłuższa.',
'D SKRÓT: Wycinam końcówkę',
'D SKUTEK: Mieścisz się w 20 minutach. Najciekawszej części nikt nie usłyszy.',
'D OCENA: tak, nie',
'D DLACZEGO: Czas się zgadza, ale wypadła część, dla której warto było przyjść.',
'',
'=== DECYZJA 2 ===',
'KIEDY: Rano, 8:55',
'NAZWA: Rzutnik gaśnie',
'SCENA: Pięć minut przed zajęciami rzutnik gaśnie.',
'SMS od technika: będę za 20 minut.',
'NA SLAJD: Pięć minut przed zajęciami rzutnik gaśnie. Technik będzie za 20 minut.',
'FAKT 1: Zaraz po twoich zajęciach sala jest zajęta.',
'FAKT 2: Dwa najważniejsze wykresy masz wydrukowane na kartce.',
'PYTANIE: Co robisz?',
'A: Czekam na technika.',
'A SKRÓT: Czekam na technika',
'A SKUTEK: Technik przychodzi po 20 minutach. Twój czas właśnie się skończył.',
'A OCENA: nie, nie',
'A DLACZEGO: Sala jest zajęta zaraz po tobie, więc zajęć nie będzie.',
'B: Zaczynam bez slajdów.',
'B SKRÓT: Zaczynam bez slajdów',
'B SKUTEK: Zaczynasz punktualnie. Wykresy rysujesz na tablicy i pokazujesz kartkę.',
'B OCENA: tak, tak',
'B DLACZEGO: Czas się zgadza, a najważniejsze wykresy sala i tak widzi.',
'C: Proszę o przełożenie zajęć.',
'C SKRÓT: Przekładam zajęcia',
'C SKUTEK: Grupa wychodzi. Nowego terminu jeszcze nie ma.',
'C OCENA: różnie, różnie',
'C DLACZEGO: Wszystko zależy od nowego terminu, a tego jeszcze nie ma.',
'D: Pokazuję slajdy z laptopa pierwszemu rzędowi.',
'D SKRÓT: Laptop dla pierwszego rzędu',
'D SKUTEK: Zaczynasz punktualnie. Trzy osoby widzą slajdy, reszta patrzy na twoje plecy.',
'D OCENA: tak, nie',
'D DLACZEGO: Czas się zgadza, ale slajdy widzi tylko pierwszy rząd.',
'',
'=== DECYZJA 3 ===',
'KIEDY: Rano, 9:18',
'NAZWA: Ręka w górze',
'SCENA: Zostały dwie minuty. Ktoś podnosi rękę.',
'(Zakończenia jeszcze nie było.)',
'NA SLAJD: Zostały dwie minuty. Ktoś podnosi rękę, a zakończenia jeszcze nie było.',
'FAKT 1: Zaraz po tobie wchodzi następna grupa.',
'FAKT 2: Zakończenie to jedno zdanie o tym, co z tego wynika dla sali.',
'PYTANIE: Co robisz?',
'A: Mówię zakończenie, a na pytanie odpowiadam po zajęciach.',
'A SKRÓT: Najpierw zakończenie',
'A SKUTEK: Sala słyszy zakończenie. Z pytającym rozmawiasz na korytarzu.',
'A OCENA: tak, tak',
'A DLACZEGO: Zakończenie pada w czasie, a pytanie nie przepada.',
'B: Odpowiadam na pytanie do końca czasu.',
'B SKRÓT: Odpowiadam do końca',
'B SKUTEK: Pytający dostaje odpowiedź. Reszta sali wychodzi bez zakończenia.',
'B OCENA: tak, różnie',
'B DLACZEGO: Zyskuje jedna osoba. Pozostałe nie słyszą, co z tego wynika.',
'C: Kończę słowami „to tyle, dziękuję”.',
'C SKRÓT: „To tyle, dziękuję”',
'C SKUTEK: Kończysz punktualnie. Ostatnie, co słyszy sala, to „dziękuję”.',
'C OCENA: tak, nie',
'C DLACZEGO: Punktualnie, ale bez ostatniego zdania.',
'D: Odpowiadam, potem mówię zakończenie i przekraczam czas.',
'D SKRÓT: Jedno i drugie',
'D SKUTEK: Mówisz wszystko. Następna grupa stoi już w drzwiach.',
'D OCENA: nie, różnie',
'D DLACZEGO: Sala słyszy wszystko kosztem następnej grupy.',
'',
'=== EPILOG ===',
'ZAKOŃCZENIE DOBRE: Sala wychodzi z jedną myślą i umie ją powtórzyć.',
'ZAKOŃCZENIE MIESZANE: Sala zapamięta część, ale nie to, co najważniejsze.',
'ZAKOŃCZENIE SŁABE: Sala zapamięta niewiele.',
'PYTANIE NA KONIEC: Jakie jedno zdanie ma zostać po twoich następnych zajęciach?',
'',
'=== ŹRÓDŁA ===',
'- To przykład formatu. Historia i oceny są wymyślone.',
'',
'=== DO SPRAWDZENIA ===',
''
].join('\n');

root.Karta = K;
if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
