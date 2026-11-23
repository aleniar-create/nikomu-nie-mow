# Test trybu karty: prezentacja z karty, ekrany jadą do telefonów z podpisem.
# Użycie: python3 -I prezentacja/testy/e2e_karta.py <katalog strony> <mock|serwer> <katalog na zrzuty>
import sys, os, time, json, subprocess, urllib.request, urllib.parse
from playwright.sync_api import sync_playwright

SITE, TRYB, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
WWW, NTFY = 8772, 8798
Q = '&mock=1' if TRYB == 'mock' else '&serwer=http%3A%2F%2F127.0.0.1%3A' + str(NTFY) + '%2F'
BASE = 'http://127.0.0.1:%d/' % WWW
TU = os.path.dirname(os.path.abspath(__file__))
procs = [subprocess.Popen([sys.executable, '-m', 'http.server', str(WWW), '--bind', '127.0.0.1'], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)]
if TRYB == 'serwer':
    procs.append(subprocess.Popen(['node', os.path.join(TU, 'serwer.js'), str(NTFY)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
time.sleep(1.5)

wyniki, bledy = [], []
def spr(w, opis):
    wyniki.append((bool(w), opis))
    if not w: print('  BŁĄD:', opis)
def obserwuj(pg, nazwa):
    pg.on('pageerror', lambda e: bledy.append('[%s] pageerror: %s' % (nazwa, e)))
    pg.on('console', lambda m: bledy.append('[%s] console: %s' % (nazwa, m.text)) if m.type == 'error' and '429' not in m.text else None)
def post(kanal, tresc):
    urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:%d/%s' % (NTFY, kanal), data=tresc.encode('utf-8'), method='POST'))
def historia(kanal):
    t = urllib.request.urlopen('http://127.0.0.1:%d/%s/json?poll=1&since=all' % (NTFY, kanal)).read().decode('utf-8')
    return [json.loads(w) for w in t.split('\n') if w.strip()]

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        wsp = b.new_context()
        pres = wsp.new_page(); pres.set_viewport_size({'width': 1600, 'height': 900}); obserwuj(pres, 'prowadzacy')

        # 1. bez karty w przeglądarce strona mówi, co zrobić
        pres.goto(BASE + 'sala/prowadzacy.html?karta=1' + Q); time.sleep(0.6)
        spr('nie ma karty prezentacji' in pres.inner_text('body') and pres.locator('a[href="../"]').count() == 1, 'brak karty: komunikat i link do strony głównej')
        pres.evaluate("localStorage.setItem('pzt-karta', 'TYTUŁ: Zła karta\\n=== DECYZJA 1 ===\\nSCENA: x')")
        pres.goto(BASE + 'sala/prowadzacy.html?karta=1' + Q); time.sleep(0.6)
        spr('W karcie prezentacji są błędy' in pres.inner_text('body'), 'karta z błędami: komunikat')
        pres.evaluate("localStorage.setItem('pzt-karta', window.Karta.PRZYKLAD)")

        # wiadomość poprawnie podpisana kluczem, który nie należy do tej sesji (do próby podszycia się)
        OBCY_KLUCZ = pres.evaluate("""async () => { const n = await window.Karta.nadawca('obcy' + Date.now(), { getItem: () => null, setItem: () => {} }); const m = await n.podpisz('X'); return m.slice(0, m.length - 1); }""")
        # 2. start: nowa sesja, klucz w adresie dla uczestników
        pres.goto(BASE + 'sala/prowadzacy.html?karta=1' + Q); time.sleep(1.2)
        scena = lambda: pres.inner_text('#scena')
        licznik = lambda: pres.inner_text('.live b')
        KOD = urllib.parse.parse_qs(urllib.parse.urlparse(pres.url).query)['s'][0]
        pres.keyboard.press('n'); time.sleep(0.3)
        adres = [t for t in pres.locator('#panel code').all_inner_texts() if t.startswith('http')][0]
        panel = pres.inner_text('#panel')
        pres.keyboard.press('n')
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(adres).query)
        spr(len(KOD) == 8 and qs['s'][0] == KOD and len(qs.get('k', [''])[0]) == 22 and '/sala/?' in adres, 'adres dla uczestników ma kod sesji i klucz (%s)' % adres[:80])
        spr('Kontrola treści: bez uwag' in panel and 'Prezentacja z karty: Jutro prowadzisz zajęcia' in panel and 'Ekrany z odpowiedzią: 5' in panel, 'panel: kontrola bez uwag, tytuł karty, 5 ekranów z odpowiedzią')
        spr('Jutro prowadzisz zajęcia' in scena() and 'Imię Nazwisko' in scena() and pres.locator('#scena .qr svg').count() == 1, 'slajd tytułowy z kodem QR')
        spr(pres.evaluate("localStorage.getItem('pzt-karta:%s') === window.Karta.PRZYKLAD && !!localStorage.getItem('pzt-klucz:%s')" % (KOD, KOD)), 'kopia karty i klucz zapisane dla sesji')

        def nowy_telefon(nazwa, url=None):
            ctx = wsp if TRYB == 'mock' else b.new_context()
            pg = ctx.new_page(); pg.set_viewport_size({'width': 390, 'height': 844}); obserwuj(pg, nazwa)
            pg.goto(url or adres)
            return pg
        tel = [nowy_telefon('tel%d' % i) for i in range(5)]
        ekran = lambda pg: pg.inner_text('main')
        ILE = 10
        def dalej(ile=1, czekaj=1.5):
            for _ in range(ile): pres.keyboard.press('ArrowRight')
            time.sleep(czekaj)
        def stuknij(wartosci, kto=None):
            for t, v in zip(kto or tel, wartosci): t.click("button.opt[data-v='%s']" % v)
        def zrzut(nazwa, pg=None): (pg or pres).screenshot(path=os.path.join(OUT, nazwa + '.png'))
        time.sleep(2.0)
        spr('Dołączyło: 5' in scena().replace('\n', ' ') and all('Jesteś z nami' in ekran(t) for t in tel), 'pięć telefonów dołączyło i widzi ekran powitalny')
        spr(all(t.locator('#lista button').count() == 1 for t in tel), 'telefon zna na początku tylko ekran powitalny')
        zrzut('k01_tytul'); zrzut('kt01_start', tel[0])

        # 3. zasady (bez zmiany ekranu), pytanie na start
        dalej()
        spr('Zasady na dziś' in scena() and all('Jesteś z nami' in ekran(t) for t in tel), 'zasady: telefony zostają na ekranie powitalnym')
        dalej()
        spr(all('Czy dobre zajęcia to przede wszystkim dużo materiału?' in ekran(t) for t in tel), 'pytanie na start dotarło do telefonów')
        stuknij(['o1', 'o1', 'o2', 'o3', 'o1']); time.sleep(1.6)
        spr(licznik() == '5', 'pytanie na start: 5 odpowiedzi')
        zrzut('k03_przed'); zrzut('kt03_przed', tel[0])

        # 4. rola
        dalej()
        e0 = ekran(tel[0])
        spr('TWOJA ROLA' in e0.upper() and 'Masz 20 minut i 24 slajdy' in e0 and 'Przed tobą 3 decyzje' in e0 and 'Jest wieczór przed zajęciami' in scena(), 'rola na telefonie i na slajdzie')
        zrzut('k04_rola'); zrzut('kt04_rola', tel[0])

        # 5. decyzja 1: scena, fakty, pasek, skutek, blokada, wybory sali, tabela
        dalej()
        e0 = ekran(tel[0])
        spr('DECYZJA 1 Z 3' in e0.upper() and 'Wychodzi 31 minut' in e0 and 'dwa fakty' in e0 and 'Sala nie zna tematu' in e0 and tel[0].locator('#pasek i').count() == 1, 'decyzja 1 na telefonie: scena, fakty, pasek czasu')
        spr('Sala nie zna tematu' in scena() and 'odmierza 30 sekund' in scena(), 'decyzja 1 na slajdzie: streszczenie i fakty')
        zrzut('kt05_d1_przed', tel[0])
        stuknij(['A', 'C', 'C', 'C', 'D']); time.sleep(1.6)
        spr('26. minucie' in ekran(tel[0]) and '17 minut' in ekran(tel[1]) and 'spójrz na duży ekran' in ekran(tel[1]), 'skutek wybranej odpowiedzi')
        spr(tel[0].is_disabled("button.opt[data-v='B']") and not tel[0].is_visible('#pasek') and licznik() == '5', 'wybór zablokowany, pasek znika, 5 decyzji na slajdzie')
        zrzut('k05_d1_0'); zrzut('kt05_d1_po', tel[1])
        dalej(czekaj=0.5)
        w = pres.locator('.grp').all_inner_texts()
        spr(len(w) == 4 and 'Zostawiam jedną myśl' in w[2] and '3 (60%)' in w[2] and '0 (0%)' in w[1], 'wybory sali ze skrótami')
        zrzut('k05_d1_1')
        dalej(czekaj=0.5)
        s = scena()
        spr(pres.locator('table.t tr').count() == 5 and '✓ tak' in s and '✗ nie' in s and '? to zależy' in s and 'ZMIEŚCISZ SIĘ W CZASIE?' in s.upper(), 'tabela ocen według dwóch kryteriów')
        zrzut('k05_d1_2')

        # 6. decyzja 2 i próby podszycia się pod prowadzącego
        dalej()
        spr(all('Rzutnik gaśnie' in ekran(t) and 'SMS od technika' in ekran(t) for t in tel), 'decyzja 2 na telefonach')
        stuknij(['B'] * 5); time.sleep(1.5)
        if TRYB == 'serwer':
            kan = 'pzt-%s-c' % KOD
            h = historia(kan)
            spr(len(h) >= 4 and all(m['message'].startswith('K1.') and len(m['message'].encode('utf-8')) < 4096 for m in h), 'kanał sterowania: same podpisane wiadomości poniżej 4096 bajtów (%d)' % len(h))
            post(kan, json.dumps({'t': 'e', 'e': 'd1', 'n': 9999999999999}))                                   # bez podpisu
            post(kan, json.dumps({'t': 'e', 'e': 'zly', 'n': 9999999999999, 'd': {'t': 'PODMIENIONE', 'b': []}}))  # bez podpisu, z treścią
            stara = h[0]['message']; cz = stara.split('.', 3)   # K1, klucz, podpis, treść
            falsz = json.dumps({'t': 'e', 'e': 'zly', 'n': 9999999999999, 'd': {'t': 'PODMIENIONE', 'b': []}})
            post(kan, 'K1.' + cz[1] + '.' + 'A' * 86 + '.' + falsz)                                          # prawdziwy klucz, zły podpis
            post(kan, 'K1.' + cz[1] + '.' + cz[2] + '.' + falsz)                                             # prawdziwy klucz i podpis od innej treści
            post(kan, '.'.join(cz[:3]) + '.' + cz[3].replace('Jesteś z nami', 'PODMIENIONE'))                # dobry podpis, zmieniona treść
            post(kan, OBCY_KLUCZ + falsz)                                                                     # poprawnie podpisane, ale cudzym kluczem
            post(kan, stara)                                                                                  # powtórka starej, poprawnej wiadomości
            time.sleep(2.5)
            spr(all('Rzutnik gaśnie' in ekran(t) and 'PODMIENIONE' not in ekran(t) for t in tel), 'fałszywe i powtórzone wiadomości nie zmieniają ekranu telefonów')
            spr(all(t.locator('#lista button').count() == 5 and 'PODMIENIONE' not in t.inner_text('#lista') for t in tel), 'fałszywy ekran nie trafia na listę ekranów')
        # telefon z innym kluczem w adresie niczego nie przyjmuje
        zly_klucz = adres.replace('&k=' + qs['k'][0], '&k=' + ('B' if qs['k'][0][0] != 'B' else 'C') + qs['k'][0][1:])
        obcy = nowy_telefon('obcy', zly_klucz)
        # spóźniony telefon dostaje bieżący ekran i zna wcześniejsze
        tel.append(nowy_telefon('tel5')); time.sleep(2.2)
        spr('Rzutnik gaśnie' in ekran(tel[5]), 'spóźniony telefon dostaje bieżący ekran')
        spr(tel[5].locator('#lista button').count() == 5, 'spóźniony telefon zna wcześniejsze ekrany (%d)' % tel[5].locator('#lista button').count())
        spr('Jesteś z nami' in ekran(obcy) and obcy.locator('#lista button').count() == 1, 'telefon z innym kluczem zostaje na ekranie powitalnym')
        tel[5].click('#recznieB'); tel[5].locator('#lista button', has_text='decyzja 1 z 3').click(); time.sleep(0.4)
        spr('Za dużo slajdów' in ekran(tel[5]), 'spóźniony telefon wraca ręcznie do decyzji 1')
        tel[5].click("button.opt[data-v='C']"); time.sleep(1.0)
        tel[5].click('#recznieB'); tel[5].locator('#lista button', has_text='decyzja 2 z 3').click(); time.sleep(0.4)
        tel[5].click("button.opt[data-v='B']"); time.sleep(1.5)
        spr('Zaczynasz punktualnie' in ekran(tel[5]), 'spóźniony telefon odpowiada na decyzję 2')
        dalej(2, czekaj=0.6)
        zrzut('k06_d2_2'); zrzut('kt06_d2', tel[0])

        # 7. decyzja 3, epilog: własne zakończenie i zakończenia sali
        dalej()
        stuknij(['A', 'A', 'C', 'A', 'D', 'A']); time.sleep(1.5)
        dalej(3)
        e = [ekran(t) for t in tel]
        spr('zapamięta część' in e[0] and 'umie ją powtórzyć' in e[1] and 'zapamięta część' in e[2] and 'umie ją powtórzyć' in e[3] and 'zapamięta niewiele' in e[4] and 'umie ją powtórzyć' in e[5], 'własne zakończenie zależne od decyzji')
        spr('Wieczór, 20:00. Mówię szybciej' in e[0].replace('\n', ' ') and '✗ nie' in e[0] and '✓ tak' in e[0], 'epilog na telefonie: lista decyzji z ocenami')
        zrzut('k07_epilog_0'); zrzut('kt07_epilog', tel[0])
        dalej(czekaj=0.6)
        w = pres.locator('.grp').all_inner_texts()
        spr(len(w) == 3 and '3 (50%)' in w[0] and '2 (33%)' in w[1] and '1 (17%)' in w[2], 'zakończenia sali: 3, 2, 1 (%s)' % ' | '.join(x.replace('\n', ' ') for x in w))
        zrzut('k07_epilog_1')
        dalej(czekaj=0.5)
        spr('Jakie jedno zdanie ma zostać po twoich następnych zajęciach?' in scena(), 'pytanie na koniec na slajdzie')
        zrzut('k07_epilog_2')

        # 8. pytanie na koniec i porównanie
        dalej()
        spr(all('To samo pytanie co na początku' in ekran(t) for t in tel), 'pytanie na koniec na telefonach')
        stuknij(['o2', 'o2', 'o2', 'o3', 'o1', 'o2']); time.sleep(1.6)
        spr(licznik() == '6', 'pytanie na koniec: 6 odpowiedzi')
        dalej(czekaj=0.5)
        s = scena(); w = pres.locator('.grp').all_inner_texts()
        spr('Na początku (n = 5)' in s and 'Na końcu (n = 6)' in s and '3 (60%)' in w[0] and '1 (17%)' in w[0] and '4 (67%)' in w[1], 'porównanie przed i po')
        zrzut('k08_przed_po')

        # 9. koniec: myśl przewodnia, źródła, karta na wynos
        dalej()
        spr('Z zajęć zostaje jedna myśl' in scena() and 'Źródła:' in scena() and all('NA WYNOS' in ekran(t).upper() and 'Z zajęć zostaje jedna myśl' in ekran(t) for t in tel), 'ostatni slajd i karta na wynos')
        spr(('%d / %d' % (ILE, ILE)) in pres.inner_text('#hud'), 'slajdów jest %d' % ILE)
        zrzut('k09_koniec'); zrzut('kt09_karta', tel[0])

        # 10. odświeżenie strony prowadzącego: ta sama sesja, ten sam klucz, telefony dalej słuchają
        pres.reload(); time.sleep(1.5)
        spr(('%d / %d' % (ILE, ILE)) in pres.inner_text('#hud') and KOD in pres.url, 'po odświeżeniu ten sam slajd i ta sama sesja')
        pres.keyboard.press('ArrowLeft'); time.sleep(1.6)
        spr(all('To samo pytanie co na początku' in ekran(t) for t in tel[:3]), 'po odświeżeniu telefony przyjmują ekrany od prowadzącego')
        spr('6 telefonów' in pres.inner_text('#hud') or '7 telefonów' in pres.inner_text('#hud'), 'po odświeżeniu wyniki wracają (%s)' % pres.inner_text('#hud').replace('\n', ' '))

        # 11. nowa sesja z tą samą kartą, nawet gdy karta robocza zniknęła
        pres.evaluate("localStorage.removeItem('pzt-karta')")
        pres.goto(BASE + 'sala/prowadzacy.html?karta=1&z=' + KOD + Q); time.sleep(1.2)
        KOD2 = urllib.parse.parse_qs(urllib.parse.urlparse(pres.url).query)['s'][0]
        spr(KOD2 != KOD and 'z=' not in pres.url and 'Jutro prowadzisz zajęcia' in scena() and 'Dołączyło: 0' in scena().replace('\n', ' '), 'nowa sesja: nowy kod, ta sama karta, puste wyniki')
        pres.keyboard.press('n'); time.sleep(0.3)
        adres2 = [t for t in pres.locator('#panel code').all_inner_texts() if t.startswith('http')][0]
        spr(urllib.parse.parse_qs(urllib.parse.urlparse(adres2).query)['k'][0] != qs['k'][0], 'nowa sesja ma nowy klucz')

        # 12. telefon w trybie karty bez pliku tresc.js
        ctx = b.new_context(); ctx.route('**/tresc.js', lambda r: r.abort())
        sam = ctx.new_page(); obserwuj(sam, 'bez-tresc'); sam.goto(adres2); time.sleep(1.2)
        spr('Jesteś z nami' in sam.inner_text('main'), 'telefon w trybie karty nie potrzebuje pliku tresc.js')
        ctx.close()
        b.close()
finally:
    for pr in procs: pr.terminate()

ok = sum(1 for w, _ in wyniki if w)
print('KARTA, TRYB %s: %d z %d sprawdzeń poprawnych' % (TRYB, ok, len(wyniki)))
print('Błędy stron:', '\n'.join(bledy) if bledy else 'brak')
sys.exit(0 if ok == len(wyniki) and not bledy else 1)
