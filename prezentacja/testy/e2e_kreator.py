# Test strony dla autorów: formularz, instrukcje, karta, podgląd, skrypt, uruchomienie.
# Użycie: python3 -I prezentacja/testy/e2e_kreator.py <katalog strony> <katalog na zrzuty>
import sys, os, time, json, subprocess, tempfile, urllib.parse
from playwright.sync_api import sync_playwright

SITE, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
WWW, NTFY = 8773, 8797
BASE = 'http://127.0.0.1:%d/' % WWW
TU = os.path.dirname(os.path.abspath(__file__))
procs = [subprocess.Popen([sys.executable, '-m', 'http.server', str(WWW), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL),
         subprocess.Popen(['node', os.path.join(TU, 'serwer.js'), str(NTFY)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)]
time.sleep(1.5)
wyniki, bledy = [], []
def spr(w, opis):
    wyniki.append((bool(w), opis))
    if not w: print('  BŁĄD:', opis)
def obserwuj(pg, nazwa):
    pg.on('pageerror', lambda e: bledy.append('[%s] pageerror: %s' % (nazwa, e)))
    pg.on('console', lambda m: bledy.append('[%s] console: %s' % (nazwa, m.text)) if m.type == 'error' else None)
    pg.on('requestfailed', lambda r: bledy.append('[%s] nie wczytano: %s' % (nazwa, r.url)) if 'favicon' not in r.url else None)
    pg.on('response', lambda r: bledy.append('[%s] HTTP %d: %s' % (nazwa, r.status, r.url)) if r.status >= 400 and 'favicon' not in r.url else None)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(accept_downloads=True); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE.rstrip('/'))
        pg = ctx.new_page(); pg.set_viewport_size({'width': 1440, 'height': 900}); obserwuj(pg, 'kreator')
        schowek = lambda: pg.evaluate('navigator.clipboard.readText()')

        # 1. pusta strona
        pg.goto(BASE); time.sleep(0.8)
        spr('Zrób prezentację, w której sala decyduje' in pg.inner_text('h1') and pg.evaluate("[...document.images].every(i => i.complete && i.naturalWidth > 0)"), 'strona główna: nagłówek i obrazki')
        spr(all(pg.is_disabled('#' + i) for i in ['b-podglad', 'b-pobierz', 'b-skrypt', 'b-uruchom', 'b-uwagi']), 'bez karty przyciski są wyłączone')
        zr = lambda n, s=None: (s or pg).screenshot(path=os.path.join(OUT, n + '.png'), full_page=True)
        zr('a01_pusta')

        # 2. formularz i instrukcja do rozmowy
        pg.fill('#f-temat', 'Tajemnica zawodowa psychologa'); pg.fill('#f-okazja', 'Elementy prawa w psychologii'); pg.fill('#f-minuty', '15')
        pg.select_option('#f-prowadzacy', '2'); pg.fill('#f-sala', '15 studentów psychologii'); pg.fill('#f-autorzy', 'Jan Kowalski, Anna Nowak')
        pg.fill('#f-ciekawi', 'Kiedy psycholog musi złamać tajemnicę'); time.sleep(0.2)
        pg.click('#b-instrukcja'); time.sleep(0.4)
        t = schowek()
        spr(t.startswith('Pomóż mi przygotować zajęcia') and 'Temat: Tajemnica zawodowa psychologa' in t and 'Czas: 15 minut' in t and 'Prowadzący: 2 osoby' in t and 'zmieści się ich ok. 3.' in t and 'ok. 6–9 pytań' in t, 'instrukcja do rozmowy zawiera dane z formularza')
        spr(len(t) < 3000 and 'Skopiowano: całość' in pg.inner_text('#info-2'), 'instrukcja ma %d znaków i jest potwierdzenie skopiowania' % len(t))
        pg.click("input[name=tryb][value=kilkanascie] + span"); time.sleep(0.2); pg.click('#b-instrukcja'); time.sleep(0.3)
        spr('ok. 15–20 pytań' in schowek() and 'każdą scenę z osobna' in schowek(), 'tryb „kilkanaście” zmienia instrukcję')
        # 3. dzielenie na części
        pg.check('#c-podziel'); time.sleep(0.2)
        spr('część 1 z 2' in pg.inner_text('#b-instrukcja') and pg.locator('#czesci-rozmowa button').count() == 1, 'dzielenie: dwie części instrukcji')
        pg.click('#b-instrukcja'); time.sleep(0.3); c1 = schowek()
        pg.click('#czesci-rozmowa button'); time.sleep(0.3); c2 = schowek()
        spr(c1.startswith('CZĘŚĆ 1 z 2.') and 'odpowiedz tylko: OK' in c1 and c2.startswith('CZĘŚĆ 2 z 2 (ostatnia)') and len(c1) <= 1800 and len(c2) <= 1800, 'dzielenie: części mają nagłówki i do 1800 znaków (%d, %d)' % (len(c1), len(c2)))
        pg.uncheck('#c-podziel'); time.sleep(0.2)
        # 4. polecenie „zapisz kartę”, także z pomysłem do nowej rozmowy
        pg.click('#b-karta'); time.sleep(0.3); t = schowek()
        spr(t.startswith('Zapisz zaakceptowany pomysł jako KARTĘ PREZENTACJI') and 'AUTORZY: Jan Kowalski, Anna Nowak' in t and '=== DECYZJA 1 ===' in t and 'Skopiowano' in pg.inner_text('#info-3') and pg.inner_text('#info-2') == '', 'polecenie „zapisz kartę” z autorami')
        pg.click('summary:has-text("Rozmowa się urwała")'); pg.fill('#pomysl', 'Tytuł: Nikomu nie mów. Sala jest psychologiem szkolnym.'); time.sleep(0.2)
        pg.click('#b-karta'); time.sleep(0.3)
        spr(schowek().startswith('Oto pomysł na zajęcia') and 'Sala jest psychologiem szkolnym.' in schowek() and 'Zapisz ten pomysł' in schowek(), 'polecenie z pomysłem działa w nowej rozmowie')

        # 5. karta: przykład, błędy, uwagi dla czatu
        pg.click('#b-przyklad'); time.sleep(0.6)
        spr('Karta jest gotowa: 3 decyzje, ok. 18 minut' in pg.inner_text('#wyniki') and pg.locator('#wyniki li').count() == 1 and not pg.is_disabled('#b-uruchom') and pg.is_disabled('#b-uwagi'), 'przykład: karta gotowa, przyciski odblokowane')
        spr('Gotowe: „Jutro prowadzisz zajęcia”' in pg.inner_text('#stan'), 'krok 4 pokazuje tytuł')
        zr('a02_gotowa')
        dobra = pg.input_value('#karta')
        pg.fill('#karta', dobra.replace('KRYTERIUM 2: Sala coś z tego wyniesie?\n', '').replace('C OCENA: tak, tak', 'C OCENA: chyba') + '\n=== DO SPRAWDZENIA ===\n- art. 240 kodeksu karnego\n'); time.sleep(0.7)
        w = pg.inner_text('#wyniki')
        spr('Brakuje linii „KRYTERIUM 2:”' in w and 'Decyzja 1, odpowiedź C: w linii „C OCENA:” podaj dwa słowa' in w and pg.locator('#wyniki li.blad').count() == 2 and pg.is_disabled('#b-uruchom') and pg.is_disabled('#b-podglad'), 'błędy w karcie: komunikaty i zablokowane przyciski')
        spr(pg.is_visible('#sprawdzic-ramka') and 'art. 240 kodeksu karnego' in pg.inner_text('#sprawdzic'), 'lista „sprawdź w źródłach”')
        pg.click('#b-uwagi'); time.sleep(0.3); t = schowek()
        spr(t.startswith('Oto karta prezentacji:') and 'Popraw tylko wskazane miejsca' in t and '1. Brakuje linii „KRYTERIUM 2:”' in t and '2. Decyzja 1, odpowiedź C' in t, 'uwagi dla czatu z kartą (bo jest pomysł do nowej rozmowy)')
        zr('a03_bledy')
        pg.fill('#karta', dobra); time.sleep(0.6)

        # 6. pamięć po odświeżeniu
        pg.reload(); time.sleep(0.8)
        spr(pg.input_value('#f-temat') == 'Tajemnica zawodowa psychologa' and pg.input_value('#f-minuty') == '15' and pg.input_value('#f-prowadzacy') == '2' and pg.is_checked('input[name=tryb][value=kilkanascie]') and pg.input_value('#karta') == dobra and 'Sala jest psychologiem' in pg.input_value('#pomysl'), 'po odświeżeniu wszystko zostaje')

        # 7. plik: pobranie i wczytanie
        with pg.expect_download() as dl: pg.click('#b-pobierz')
        plik = os.path.join(tempfile.mkdtemp(), dl.value.suggested_filename); dl.value.save_as(plik)
        spr(dl.value.suggested_filename == 'prezentacja-jutro-prowadzisz-zajecia.txt' and open(plik, encoding='utf-8').read() == dobra, 'pobrany plik ma nazwę z tytułu i treść karty')
        pg.fill('#karta', ''); time.sleep(0.5)
        spr(pg.is_disabled('#b-uruchom') and pg.is_disabled('#b-pobierz'), 'pusta karta: przyciski wyłączone')
        pg.set_input_files('#plik', plik); time.sleep(0.7)
        spr(pg.input_value('#karta') == dobra and not pg.is_disabled('#b-uruchom'), 'wczytanie pliku przywraca kartę')

        # 8. skrypt dla prowadzących
        with ctx.expect_page() as np: pg.click('#b-skrypt')
        sk = np.value; obserwuj(sk, 'skrypt'); sk.wait_for_load_state(); time.sleep(0.6)
        t = sk.inner_text('#kartka')
        spr('Skrypt dla prowadzących' in t and 'Decyzja 1 z 3: Za dużo slajdów' in t and 'Robisz próbę z zegarkiem. Wychodzi 31 minut.' in t and 'Razem\tok. 18' in t.replace('\n', '\t') and 'Plan B.' in t, 'skrypt: decyzje, sceny, plan czasu, plan B')
        spr('Masz 15 minut, a plan daje ok. 18' in t and sk.locator('.blok').count() == 10, 'skrypt: ostrzeżenie o czasie i 10 bloków (%d)' % sk.locator('.blok').count())
        sk.click('#kwestie'); time.sleep(0.3)
        t = sk.evaluate('navigator.clipboard.readText()')
        spr(t.startswith('Oto karta prezentacji') and 'SKRYPT DLA PROWADZĄCYCH' in t and 'Prowadzących jest 2' in t and '15 minutach' in t, 'skrypt: polecenie dla czatu z kartą')
        zr('a04_skrypt', sk); sk.pdf(path=os.path.join(OUT, 'skrypt.pdf'), format='A4'); sk.close()

        # 9. podgląd: duży ekran i telefon obok siebie
        with ctx.expect_page() as np: pg.click('#b-podglad')
        pod = np.value; obserwuj(pod, 'podglad'); pod.set_viewport_size({'width': 1440, 'height': 860}); pod.wait_for_load_state(); time.sleep(2.2)
        fp = pod.frame_locator('#prez'); ft = pod.frame_locator('#tel')
        spr('Jutro prowadzisz zajęcia' in fp.locator('#scena').inner_text() and 'Jesteś z nami' in ft.locator('main').inner_text() and '„Jutro prowadzisz zajęcia”' in pod.inner_text('#tytul'), 'podgląd: slajd tytułowy i telefon')
        for _ in range(3): pod.click('#dalej'); time.sleep(0.3)
        time.sleep(1.4)
        spr('twoja rola' in fp.locator('#scena').inner_text().lower() and 'Masz 20 minut i 24 slajdy' in ft.locator('main').inner_text(), 'podgląd: przycisk „Dalej” przełącza slajd i telefon')
        pod.keyboard.press('ArrowRight'); time.sleep(1.6)
        ft.locator("button.opt[data-v='C']").click(); time.sleep(1.5)
        spr('Wychodzi 17 minut' in ft.locator('main').inner_text() and fp.locator('.live b').inner_text() == '1', 'podgląd: odpowiedź z telefonu trafia na slajd')
        pod.screenshot(path=os.path.join(OUT, 'a05_podglad.png'))
        pod.click('#wstecz'); time.sleep(1.4)
        spr('twoja rola' in fp.locator('#scena').inner_text().lower(), 'podgląd: przycisk „Wstecz”')
        pod.reload(); time.sleep(2.2)
        pod.keyboard.press('ArrowRight'); pod.keyboard.press('ArrowRight'); pod.keyboard.press('ArrowRight'); pod.keyboard.press('ArrowRight'); time.sleep(1.8)
        spr(pod.frame_locator('#prez').locator('.live b').inner_text() == '0' and 'Za dużo slajdów' in pod.frame_locator('#tel').locator('main').inner_text(), 'podgląd po ponownym otwarciu zaczyna od zera')
        pod.close()

        # 10. „Zobacz przykład” działa bez własnej karty, a pusty podgląd i skrypt mówią, co zrobić
        c2 = b.new_context(); g = c2.new_page(); obserwuj(g, 'gosc'); g.set_viewport_size({'width': 1440, 'height': 860})
        g.goto(BASE); time.sleep(0.5)
        with c2.expect_page() as np: g.click('#b-przyklad-podglad')
        prz = np.value; obserwuj(prz, 'przyklad'); prz.wait_for_load_state(); time.sleep(2.2)
        spr('przykład' in prz.inner_text('#tytul') and 'Jutro prowadzisz zajęcia' in prz.frame_locator('#prez').locator('#scena').inner_text() and 'Jesteś z nami' in prz.frame_locator('#tel').locator('main').inner_text(), '„Zobacz przykład” pokazuje przykład bez własnej karty')
        spr(g.evaluate("localStorage.getItem('pzt-karta')") in (None, ''), 'przykład nie nadpisuje karty roboczej')
        prz.goto(BASE + 'podglad.html'); time.sleep(0.5)
        spr('Nie ma jeszcze karty do pokazania' in prz.inner_text('#brak'), 'podgląd bez karty: komunikat')
        prz.goto(BASE + 'skrypt.html'); time.sleep(0.5)
        spr('Nie ma jeszcze gotowej karty' in prz.inner_text('#kartka'), 'skrypt bez karty: komunikat')
        # 11. wąski ekran (telefon autora)
        g.set_viewport_size({'width': 390, 'height': 844}); time.sleep(0.4)
        spr(g.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'strona główna mieści się na wąskim ekranie')
        g.screenshot(path=os.path.join(OUT, 'a06_waski.png'), full_page=True)
        c2.close()

        # 12. uruchomienie prawdziwej sesji z kreatora (z podstawionym serwerem) i telefon z kodu QR
        pg.goto(BASE + '?serwer=http%3A%2F%2F127.0.0.1%3A' + str(NTFY) + '%2F'); time.sleep(0.8)
        with ctx.expect_page() as np: pg.click('#b-uruchom')
        pr = np.value; obserwuj(pr, 'prowadzacy'); pr.set_viewport_size({'width': 1600, 'height': 900}); pr.wait_for_load_state(); time.sleep(1.5)
        spr('karta=1' in pr.url and 'serwer=' in pr.url and 'Jutro prowadzisz zajęcia' in pr.inner_text('#scena'), 'uruchomienie z kreatora otwiera prezentację z karty')
        pr.keyboard.press('n'); time.sleep(0.3)
        adres = [t for t in pr.locator('#panel code').all_inner_texts() if t.startswith('http')][0]
        pr.keyboard.press('n')
        c3 = b.new_context(); tel = c3.new_page(); obserwuj(tel, 'telefon'); tel.set_viewport_size({'width': 390, 'height': 844}); tel.goto(adres); time.sleep(2.0)
        spr('Dołączyło: 1' in pr.inner_text('#scena').replace('\n', ' ') and 'połączono' in tel.inner_text('header'), 'telefon z adresu z kodu QR dołącza do sesji')
        # kod QR na slajdzie koduje dokładnie ten adres
        ok_qr = pr.evaluate("""(adres) => { const q = qrcode(0, 'M'); q.addData(adres); q.make(); const svg = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
          const d1 = /d="([^"]+)"/.exec(svg)[1], d2 = /d="([^"]+)"/.exec(document.querySelector('#scena .qr').innerHTML)[1]; return d1 === d2 && q.getModuleCount(); }""", adres)
        spr(ok_qr and ok_qr <= 61, 'kod QR na slajdzie zawiera adres z kluczem (wielkość kodu: %s modułów)' % ok_qr)
        c3.close(); pr.close()
        b.close()
finally:
    for pr_ in procs: pr_.terminate()

ok = sum(1 for w, _ in wyniki if w)
print('KREATOR: %d z %d sprawdzeń poprawnych' % (ok, len(wyniki)))
print('Błędy stron:', '\n'.join(bledy) if bledy else 'brak')
sys.exit(0 if ok == len(wyniki) and not bledy else 1)
