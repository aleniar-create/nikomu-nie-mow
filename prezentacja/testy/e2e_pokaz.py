# Test szablonu na pokazie z paczki (tresc.js: historia z decyzjami i wzorce dodatkowe): prowadzący + kilka telefonów.
# Użycie: python3 -I e2e.py <katalog z plikami> <mock|serwer> <katalog na zrzuty>
#   mock   — tryb próbny stron (?mock=1), bez sieci
#   serwer — podstawiony serwer w stylu ntfy.sh na localhost (serwer.js), ten sam kod sieciowy co na zajęciach
# Wymaga: Python z pakietem playwright (Chromium), a w trybie „serwer” także Node.js.
# Po zmianie treści w tresc.js sprawdzenia poniżej trzeba dopasować do nowych slajdów.
import subprocess, sys, time, os, urllib.request
from playwright.sync_api import sync_playwright

KIT, TRYB, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
WWW, NTFY = 8771, 8799
KOD = 'test123456'
Q = '&mock=1' if TRYB == 'mock' else '&serwer=http%3A%2F%2F127.0.0.1%3A' + str(NTFY) + '%2F'
BASE = 'http://127.0.0.1:%d/' % WWW

procs = [subprocess.Popen([sys.executable, '-m', 'http.server', str(WWW), '--bind', '127.0.0.1'], cwd=KIT,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)]
if TRYB == 'serwer':
    procs.append(subprocess.Popen(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'serwer.js'), str(NTFY)],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
time.sleep(1.5)

wyniki, bledy = [], []
def spr(warunek, opis):
    wyniki.append((bool(warunek), opis))
    if not warunek: print('  BŁĄD:', opis)

def obserwuj(pg, nazwa):
    pg.on('pageerror', lambda e: bledy.append('[%s] pageerror: %s' % (nazwa, e)))
    def kons(m):
        if m.type == 'error' and '429' not in m.text: bledy.append('[%s] console: %s' % (nazwa, m.text))
    pg.on('console', kons)

def przelacz(co, stan):
    urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:%d/%s/%d' % (NTFY, co, stan), method='POST'))

def doczekaj(warunek, sekundy):
    koniec = time.time() + sekundy
    while time.time() < koniec:
        if warunek(): return True
        time.sleep(0.5)
    return warunek()

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        wspolny = b.new_context()
        pres = wspolny.new_page(); pres.set_viewport_size({'width': 1600, 'height': 900}); obserwuj(pres, 'prowadzacy')
        pres.goto(BASE + 'prowadzacy.html?s=' + KOD + Q)

        def nowy_telefon(nazwa):
            ctx = wspolny if TRYB == 'mock' else b.new_context()
            pg = ctx.new_page(); pg.set_viewport_size({'width': 390, 'height': 844}); obserwuj(pg, nazwa)
            pg.goto(BASE + 'index.html?s=' + KOD + Q)
            return pg
        tel = [nowy_telefon('tel%d' % i) for i in range(5)]

        scena = lambda: pres.inner_text('#scena')
        ekran = lambda pg: pg.inner_text('main')
        licznik = lambda: pres.inner_text('.live b')
        ILE = pres.evaluate('window.TRESC.slajdy.length')
        def dalej(ile=1, czekaj=1.4):
            for _ in range(ile): pres.keyboard.press('ArrowRight')
            time.sleep(czekaj)
        def idz_do(sid, czekaj=1.4):   # w przód aż do slajdu o podanym id
            cel = pres.evaluate('id => window.TRESC.slajdy.findIndex(s => s.id === id)', sid) + 1
            for _ in range(80):
                if int(pres.evaluate("location.hash.replace('#', '').split('.')[0] || '1'")) >= cel: break
                pres.keyboard.press('ArrowRight')
            time.sleep(czekaj)
            spr(('%d / %d' % (cel, ILE)) in pres.inner_text('#hud'), 'przejście do slajdu „%s”' % sid)
        def zrzut(nazwa, pg=None): (pg or pres).screenshot(path=os.path.join(OUT, nazwa + '.png'))
        def stuknij(wartosci):
            for t, v in zip(tel, wartosci): t.click("button.opt[data-v='%s']" % v)

        time.sleep(1.8)
        # 1. tytuł i dołączanie
        spr('Dołączyło: 5' in scena(), 'tytuł: licznik pokazuje 5 telefonów')
        spr('5 telefonów' in pres.inner_text('#hud'), 'pasek stanu: 5 telefonów')
        spr(pres.locator('.qr svg').count() == 1, 'tytuł: kod QR jest narysowany')
        spr(all('Jesteś z nami' in ekran(t) for t in tel), 'telefony: ekran startowy')
        zrzut('s01_tytul'); zrzut('t01_start', tel[0])
        spr(not pres.is_visible('#kontrola'), 'kontrola treści: brak ostrzeżenia przy poprawnym pliku')
        pres.keyboard.press('n')
        pan = pres.inner_text('#panel')
        spr('Kontrola treści: bez uwag' in pan and 'Ekrany z odpowiedzią: 13' in pan and 'do 15 telefonów' in pan, 'panel: kontrola treści bez uwag i szacunek')
        pres.keyboard.press('n')

        # 2. slajd bez pola „ekran”: telefony zostają na ekranie startowym
        idz_do('zasady')
        spr(all('Jesteś z nami' in ekran(t) for t in tel), 'slajd bez telefonu: telefony zostają na swoim ekranie')
        zrzut('s02_zasady')

        # 3. wzorzec 1: pytanie na start (wysyłka od razu po stuknięciu)
        idz_do('przed')
        spr(all('PYTANIE NA START' in ekran(t).upper() for t in tel), 'telefony przeszły na pytanie na start')
        for i in (0, 1, 2): tel[i].click("button.opt[data-v='tak']")
        tel[4].click("button.opt[data-v='zalezy']")
        # telefon 3 stuka odpowiedź i w tej samej chwili zmienia mu się ekran: odpowiedź nie może przepaść
        tel[3].evaluate("() => { document.querySelector(\"button.opt[data-v='nie']\").click(); document.querySelectorAll('#lista button')[1].click(); }")
        time.sleep(1.5)
        spr(all('Wysłane ✓ Możesz zmienić odpowiedź.' in tel[i].inner_text('#st') for i in (0, 1, 2, 4)), 'telefony: potwierdzenie wysyłki')
        spr('Spójrz na duży ekran' in ekran(tel[3]), 'telefon 3: ekran zmieniony zaraz po stuknięciu')
        spr(licznik() == '5', 'slajd: 5 odpowiedzi, także ta stuknięta tuż przed zmianą ekranu')
        zrzut('s03_przed'); zrzut('t03_przed', tel[0])

        # 3a. historia: rola i wariant startowy
        idz_do('rola')
        stuknij(['sam', 'sam', 'sam', 'para', 'para'])
        time.sleep(1.5)
        spr('Wszystko zależy od ciebie' in ekran(tel[0]) and 'druga osoba może pomóc' in ekran(tel[3]), 'historia: karta wariantu startowego')
        spr(licznik() == '5', 'slajd: 5 wyborów wariantu')
        zrzut('s03a_rola'); zrzut('t03a_rola', tel[3])

        # 3b. decyzja 1: scena, fakty, pasek czasu, skutek, blokada, wynik sali, tabela ocen
        idz_do('d1')
        spr('DECYZJA 1 Z 3' in ekran(tel[0]).upper() and 'dwa fakty' in ekran(tel[0]) and tel[0].locator('#pasek i').count() == 1, 'historia: scena, fakty i pasek czasu na telefonie')
        zrzut('t03b_d1_przed', tel[0])
        stuknij(['A', 'C', 'C', 'C', 'D'])
        time.sleep(1.5)
        spr('26. minucie' in ekran(tel[0]) and '17 minut' in ekran(tel[1]) and 'spójrz na duży ekran' in ekran(tel[1]), 'historia: skutek wybranej decyzji')
        spr(tel[0].is_disabled("button.opt[data-v='B']") and not tel[0].is_visible('#pasek'), 'historia: wybór zablokowany, pasek czasu znika')
        spr(licznik() == '5', 'slajd: 5 decyzji')
        spr('Sala nie zna tematu' in scena() and 'dopiero w 28. minucie' in scena() and 'odmierza 30 sekund' in scena(), 'slajd: scena z dwoma faktami i czasem na decyzję')
        zrzut('s03b_d1_0'); zrzut('t03b_d1_po', tel[1])
        dalej(czekaj=0.5)
        w = pres.locator('.grp').all_inner_texts()
        spr(len(w) == 4 and 'Zostawiam jedną myśl' in w[2] and '3 (60%)' in w[2] and '0 (0%)' in w[1], 'slajd: wybory sali ze skrótami odpowiedzi')
        zrzut('s03b_d1_1')
        dalej(czekaj=0.5)
        s = scena()
        spr(pres.locator('table.t tr').count() == 5 and '✓ tak' in s and '✗ nie' in s and 'nie ma jednej odpowiedzi' in s, 'slajd: tabela ocen według dwóch kryteriów')
        zrzut('s03b_d1_2')

        # 3c. decyzja 2: skutek i ocena zależą od wariantu startowego
        idz_do('d2')
        stuknij(['B'] * 5)
        time.sleep(1.5)
        spr('pokazujesz kartkę' in ekran(tel[0]) and 'rysuje wykres na tablicy' in ekran(tel[3]), 'historia: skutek zależy od wariantu startowego')
        spr(tel[3].evaluate("() => document.querySelector('.pokaz').getBoundingClientRect().bottom <= innerHeight + 1"), 'historia: skutek widać bez przewijania')
        zrzut('t03c_d2', tel[3])
        dalej(2, czekaj=0.5)
        s = scena()
        spr('Sam:' in s and 'We dwoje:' in s, 'slajd: ocena rozpisana na warianty')
        zrzut('s03c_d2_2')

        # 3d. decyzja 3 i epilog: własne zakończenie na telefonie, zakończenia sali na slajdzie
        idz_do('d3')
        stuknij(['B', 'B', 'C', 'B', 'D'])
        time.sleep(1.5)
        idz_do('epilog')
        e = [ekran(t) for t in tel]
        spr('Sala zapamięta niewiele' in e[0] and 'Sala zapamięta część' in e[1] and 'Sala wychodzi z jedną myślą' in e[3], 'historia: własne zakończenie zależne od decyzji i wariantu')
        spr('Czasu zabrakło' in e[0] and 'Czas się zgadzał' in e[1], 'historia: epilog ocenia czas')
        zrzut('s03d_epilog_0'); zrzut('t03d_epilog', tel[3])
        dalej(czekaj=0.5)
        w = pres.locator('.grp').all_inner_texts()
        spr(len(w) == 3 and '1 (20%)' in w[0] and '1 (20%)' in w[1] and '3 (60%)' in w[2], 'slajd: zakończenia całej sali')
        zrzut('s03d_epilog_1')

        # 4. wzorzec 2: zgadnij (suwak + przycisk), potem prawda
        idz_do('zgadnij')
        spr(all('Jaki procent doby' in ekran(t) for t in tel), 'telefony na ekranie „zgadnij” (także telefon 3 po ręcznej zmianie)')
        spr(tel[0].is_disabled('#go'), 'suwak: przycisk nieaktywny przed ruchem')
        for i, t in enumerate(tel):
            t.evaluate("v => { const r = document.querySelector('input[type=range]'); r.value = v; r.dispatchEvent(new Event('input', {bubbles: true})); }", [10, 20, 30, 40, 50][i])
            t.click('#go')
        time.sleep(1.2)
        spr('30%' in scena() and 'Poprawny wynik' not in scena(), 'slajd: średnia typów 30%, wynik ukryty')
        zrzut('s04_zgadnij_0'); zrzut('t04_zgadnij', tel[0])
        dalej(czekaj=0.5)
        spr('25%' in scena() and 'Poprawny wynik' in scena(), 'slajd: po kliknięciu widać poprawny wynik')
        zrzut('s04_zgadnij_1')

        # 5. wzorzec 3: głosowanie z odsłonięciem, odpowiedź tylko raz
        idz_do('quiz')
        stuknij(['366', '366', '366', '365', '367'])
        time.sleep(1.5)
        spr(tel[0].is_disabled("button.opt[data-v='365']") and not tel[0].is_disabled("button.opt[data-v='366']"), 'quiz: po wysłaniu inne odpowiedzi są zablokowane')
        spr(tel[0].inner_text('#st').strip() == 'Wysłane ✓', 'quiz: potwierdzenie bez zachęty do zmiany')
        spr(licznik() == '5', 'slajd: 5 odpowiedzi w quizie')
        zrzut('s05_quiz_0'); zrzut('t05_quiz', tel[0])
        dalej(czekaj=0.5)
        w = pres.locator('.grp').all_inner_texts()
        spr(len(w) == 3 and '3 (60%)' in w[1] and '1 (20%)' in w[0], 'slajd: rozkład odpowiedzi w quizie')
        spr(pres.locator('.glabel.hl').inner_text().strip() == '366', 'slajd: poprawna odpowiedź wyróżniona')
        zrzut('s05_quiz_1')

        # 6. wzorzec 4: dane ze źródła, telefony na ekranie „pauza”
        idz_do('dane')
        spr(all('Spójrz na duży ekran' in ekran(t) for t in tel), 'telefony: ekran „pauza” przy slajdzie z danymi')
        spr(pres.locator('.bar').count() == 4 and 'LICZBY PRZYKŁADOWE' in scena(), 'slajd: wykres z czterema słupkami i podpisem')
        zrzut('s06_dane'); zrzut('t06_pauza', tel[0])

        # 7. wzorzec 5: grupy + minutnik
        idz_do('grupy')
        spr(pres.inner_text('#timer') == '5:00', 'minutnik ustawiony na 5:00')
        stuknij(['A', 'A', 'A', 'B', 'B'])
        time.sleep(1.3)
        spr('Grupa A: zwykła rozmowa' in ekran(tel[0]) and 'Grupa B: runda' in ekran(tel[3]), 'telefony: karta właściwej grupy')
        pres.keyboard.press('t'); time.sleep(1.4)
        spr(pres.inner_text('#timer') in ('4:59', '4:58'), 'minutnik odlicza po naciśnięciu T')
        pres.keyboard.press('t')
        zrzut('s07_grupy'); zrzut('t07_grupy', tel[3])

        # 8. wzorzec 6: ocena w skali + tekst, porównanie grup
        idz_do('ocena')
        spr(tel[0].locator('.opt.on').inner_text() == 'Grupa A', 'ocena: grupa zapamiętana z poprzedniego ekranu')
        for i, t in enumerate(tel): t.click(".skala button[data-v='%d']" % [5, 4, 3, 2, 1][i])
        tel[0].fill('textarea', 'Format robi różnicę.')
        tel[3].fill('textarea', 'W rundzie trudniej zacząć.')
        for t in tel: t.click('#go')
        time.sleep(1.2)
        spr(licznik() == '5', 'slajd: 5 ocen')
        zrzut('s08_ocena_0'); zrzut('t08_ocena', tel[0])
        dalej(czekaj=0.5)
        s = scena()
        spr('4,0' in s and '1,5' in s, 'slajd: średnie grup 4,0 i 1,5')
        spr('n = 3' in s and 'n = 2' in s, 'slajd: liczebność grup 3 i 2')
        spr('Format robi różnicę.' in s and 'W rundzie trudniej zacząć.' in s, 'slajd: teksty z telefonów')
        zrzut('s08_ocena_1')

        # 9. wzorzec 7: zadanie z tekstem, potem rozwiązanie
        idz_do('zadanie')
        spr(tel[0].is_disabled('#go'), 'zadanie: przycisk nieaktywny przy pustym polu')
        teksty = ['Telefon wyjmujemy tylko na prośbę.', 'Wyniki pokazujemy dla całej sali.', 'Każde pytanie można pominąć.']
        for t, x in zip(tel, teksty): t.fill('textarea', x); t.click('#go')
        time.sleep(1.2)
        spr(licznik() == '3', 'slajd: 3 teksty zebrane')
        zrzut('s10_zadanie_0'); zrzut('t10_zadanie', tel[0])
        dalej(czekaj=0.5)
        pok = pres.locator('.box .txt').all_inner_texts()
        spr(len(pok) == 2 and all(x in teksty for x in pok) and 'PROPOZYCJA PROWADZĄCYCH' not in scena().upper(), 'slajd: dwa teksty z sali, rozwiązanie jeszcze ukryte')
        zrzut('s10_zadanie_1')
        dalej(czekaj=0.5)
        spr('PROPOZYCJA PROWADZĄCYCH' in scena().upper() and 'dopóki prowadzący nie poprosi' in scena(), 'slajd: rozwiązanie prowadzących po drugim kliknięciu')
        zrzut('s10_zadanie_2')

        # 10. wzorzec 8: debata z kartami i przyciskami czasu
        idz_do('debata')
        spr(pres.inner_text('#timer') == '2:00', 'debata: minutnik ustawiony na 2:00')
        stuknij(['A', 'A', 'B', 'B', 'B'])
        time.sleep(1.3)
        spr('Strona A: pomagają' in ekran(tel[0]) and 'Strona B: przeszkadzają' in ekran(tel[4]), 'telefony: karta argumentów swojej strony')
        pres.click("[data-t='60']"); time.sleep(1.3)
        spr(pres.inner_text('#timer') in ('0:59', '0:58') and 'run' in pres.get_attribute('#timer', 'class'), 'debata: przycisk 1:00 ustawia i uruchamia minutnik')
        pres.keyboard.press('t')
        zrzut('s11_debata'); zrzut('t11_debata', tel[4])

        # 11. wzorzec 8 (część druga): głosowanie po debacie
        idz_do('glos')
        stuknij(['A', 'A', 'A', 'B', 'B'])
        time.sleep(1.5)
        spr(licznik() == '5', 'slajd: 5 głosów')
        zrzut('t12_glos', tel[0])
        dalej(czekaj=0.5)
        spr('3 (60%)' in scena() and '2 (40%)' in scena(), 'slajd: wynik głosowania')
        zrzut('s12_glos_1')

        # 12. wzorzec 1 (część druga): pytanie na koniec + przed/po
        idz_do('po')
        stuknij(['tak'] * 5)
        time.sleep(1.5)
        spr(licznik() == '5', 'slajd: 5 odpowiedzi na pytanie na koniec')
        dalej(czekaj=0.5)
        s = scena()
        spr('3 (60%)' in s and '5 (100%)' in s and '1 (20%)' in s and '0 (0%)' in s, 'slajd: porównanie przed i po')
        zrzut('s13_przed_po')

        # spóźniony telefon dostaje bieżący ekran
        tel.append(nowy_telefon('tel5')); time.sleep(1.8)
        spr('PYTANIE NA KONIEC' in ekran(tel[5]).upper(), 'spóźniony telefon: od razu bieżący ekran')
        spr('6 telefonów' in pres.inner_text('#hud'), 'pasek stanu: 6 telefonów')

        # ręczny wybór ekranu i „wyślij ekran ponownie”
        tel[1].click('#recznieB'); tel[1].click("#lista button:has-text('Zgadnij')")
        spr('Jaki procent doby' in ekran(tel[1]), 'ręczny wybór ekranu działa')
        pres.keyboard.press('n'); pres.click('#pE'); time.sleep(1.0)
        spr('PYTANIE NA KONIEC' in ekran(tel[1]).upper(), '„Wyślij ekran ponownie” przywraca ekran')
        zrzut('s13_panel'); pres.keyboard.press('n')

        # odświeżenie strony prowadzącego zachowuje sesję, slajd i wyniki
        pres.reload(); time.sleep(2.0)
        s = scena()
        spr('6 telefonów' in pres.inner_text('#hud'), 'po odświeżeniu: 6 telefonów')
        spr('3 (60%)' in s and '5 (100%)' in s, 'po odświeżeniu: ten sam slajd i te same wyniki')

        # odświeżenie telefonu zachowuje odpowiedzi
        tel[0].reload(); time.sleep(1.8)
        spr(tel[0].locator('.opt.on').inner_text() == 'Tak', 'telefon po odświeżeniu pamięta odpowiedź')

        if TRYB == 'serwer':
            # serwer odmawia przyjęcia odpowiedzi (429): telefon ponawia sam
            przelacz('__odmowa', 1)
            tel[2].click("button.opt[data-v='nie']"); time.sleep(1.6)
            spr('Ponawiam' in tel[2].inner_text('#st'), 'odmowa 429: telefon zapowiada ponowienie')
            przelacz('__odmowa', 0)
            spr(doczekaj(lambda: 'Wysłane' in tel[2].inner_text('#st'), 45), 'po odmowie: telefon sam wysłał odpowiedź ponownie')
            time.sleep(0.6)
            spr('4 (80%)' in scena() and '1 (20%)' in scena(), 'slajd: zmieniona odpowiedź policzona')

            # serwer odmawia przyjęcia zmiany ekranu: strona prowadzącego ostrzega i ponawia
            przelacz('__odmowa', 1)
            dalej(czekaj=1.6)
            spr(pres.is_visible('#ostrz') and 'Ponawiam' in pres.inner_text('#ostrz'), 'zmiana ekranu odrzucona: ostrzeżenie na stronie prowadzącego')
            spr('PYTANIE NA KONIEC' in ekran(tel[3]).upper(), 'zmiana ekranu odrzucona: telefon zostaje na poprzednim ekranie')
            przelacz('__odmowa', 0)
            spr(doczekaj(lambda: 'NA WYNOS' in ekran(tel[3]).upper(), 14), 'po odmowie: ekran dochodzi do telefonów bez udziału prowadzącego')
            spr(doczekaj(lambda: not pres.is_visible('#ostrz'), 3), 'po odmowie: ostrzeżenie znika')

            # serwer odmawia otwarcia nasłuchu (429, jak przy przekroczonym limicie): telefon łączy się ponownie sam
            przelacz('__odmowa_sse', 1)
            tel.append(nowy_telefon('tel6')); time.sleep(1.5)
            spr('brak połączenia' in tel[6].inner_text('header'), 'odmowa nasłuchu: telefon pokazuje brak połączenia')
            przelacz('__odmowa_sse', 0)
            spr(doczekaj(lambda: 'połączono' in tel[6].inner_text('header'), 36), 'po odmowie nasłuchu: telefon połączył się sam')
            spr(doczekaj(lambda: 'NA WYNOS' in ekran(tel[6]).upper(), 3), 'po odmowie nasłuchu: telefon dostał bieżący ekran')
            spr(doczekaj(lambda: '7 telefonów' in pres.inner_text('#hud'), 3), 'pasek stanu: 7 telefonów')

            # liczba wiadomości (do oszacowania limitu dobowego)
            for kan in ('a', 'c'):
                raw = urllib.request.urlopen('http://127.0.0.1:%d/prez-demo-%s-%s/json?poll=1&since=all' % (NTFY, KOD, kan)).read().decode()
                print('  wiadomości w kanale -%s: %d' % (kan, len([w for w in raw.split('\n') if w.strip()])))
        else:
            dalej()

        # 13. wzorzec 9: koniec i karta na wynos
        spr('Dziękujemy' in scena() and all('NA WYNOS' in ekran(t).upper() and 'Dziękujemy' in ekran(t) for t in tel), 'ostatni slajd i karta na wynos na telefonach')
        zrzut('s14_koniec'); zrzut('t14_karta', tel[0])

        # 14. zepsuty plik tresc.js: strona prowadzącego wypisuje, co poprawić
        dobry = open(os.path.join(KIT, 'tresc.js'), encoding='utf-8').read()
        zly = dobry.replace("{ id: 'zgadnij', ekran: 'zgadnij'", "{ id: 'zgadnij', ekran: 'zgadnijj'").replace("h.srednia('typ')", "h.srednia('typp')")
        zly = zly.replace("tytul: 'Jak było w twojej grupie?', wyslij: 'Wyślij', bloki", "tytul: 'Jak było w twojej grupie?', bloki").replace("h.zebrane('po')", "h.brak.cos")
        zly = zly.replace("B: a => a.tryb === 'para' ?", "B: a => a.tryb.brak.cos === 'para' ?").replace("html: a => hEpilog(a) }", "html: a => a.tryb.length && hEpilog(a) }")
        spr(zly.count('zgadnijj') == 1 and zly.count('typp') == 1 and zly.count('h.brak.cos') == 1 and zly.count('a.tryb.brak.cos') == 1 and zly.count('a.tryb.length') == 1 and "tytul: 'Jak było w twojej grupie?', bloki" in zly, 'test: zepsuta treść przygotowana')
        ctx = b.new_context(); zp = ctx.new_page(); zp.set_viewport_size({'width': 1600, 'height': 900})
        zp.route('**/tresc.js', lambda r: r.fulfill(body=zly, content_type='text/javascript; charset=utf-8'))
        zp.goto(BASE + 'prowadzacy.html?s=zly1234567' + Q); time.sleep(1.2)
        k = zp.inner_text('#kontrola') if zp.is_visible('#kontrola') else ''
        spr('nie ma ekranu telefonu „zgadnijj”' in k, 'kontrola: nieistniejący ekran telefonu')
        spr('pyta o odpowiedź „typp”' in k, 'kontrola: literówka w kluczu odpowiedzi')
        spr('pole tekstowe wymaga przycisku' in k, 'kontrola: pole tekstowe bez przycisku')
        spr('błąd w kodzie slajdu' in k and 'slajd 17' in k, 'kontrola: błąd w kodzie slajdu')
        spr('ekran „d2”' in k and 'błąd w treści zależnej od odpowiedzi' in k, 'kontrola: błąd w treści zależnej od odpowiedzi')
        spr('ekran „epilog”, blok 1: treść zależna od odpowiedzi nie działa na telefonie, który nie ma wcześniejszych odpowiedzi' in k, 'kontrola: treść, która nie działa bez wcześniejszych odpowiedzi')
        spr(k.count('ekran „d2”') == 1, 'kontrola: jeden błąd treści jest zgłaszany raz')
        zrzut('s15_kontrola', zp)
        zp.keyboard.press('ArrowRight'); time.sleep(0.4)
        spr(('2 / %d' % ILE) in zp.inner_text('#hud'), 'kontrola: mimo uwag slajdy dają się przełączać')
        ctx.close()
        ctx = b.new_context(); zp = ctx.new_page()
        zp.route('**/tresc.js', lambda r: r.fulfill(body='window.TRESC = { prefiks: ', content_type='text/javascript; charset=utf-8'))
        zp.goto(BASE + 'prowadzacy.html?s=zly1234567' + Q); time.sleep(0.8)
        spr('Nie wczytał się plik tresc.js' in zp.inner_text('body'), 'błąd składni w tresc.js: czytelny komunikat na stronie prowadzącego')
        zt = ctx.new_page()
        zt.route('**/tresc.js', lambda r: r.fulfill(body='window.TRESC = { prefiks: ', content_type='text/javascript; charset=utf-8'))
        zt.goto(BASE + 'index.html?s=zly1234567' + Q); time.sleep(0.8)
        spr('Strona się nie wczytała' in zt.inner_text('body'), 'błąd składni w tresc.js: czytelny komunikat na telefonie')
        ctx.close()

        # 15. najmniejsza możliwa treść: jeden ekran ze skalą, jeden slajd z rozkładem ocen (slajd bez pola „ekran”)
        obraz = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%222000%22%20height=%221000%22%3E%3Crect%20width=%222000%22%20height=%221000%22%20fill=%22%232a78d6%22/%3E%3C/svg%3E'
        mini = '''window.TRESC = { prefiks: 'prez-mini', tytul: 'Mini', ekrany: { o: { tytul: 'Ocena', bloki: [{ typ: 'tekst', html: `<img alt="próba" src="OBRAZ">` }, { typ: 'skala', klucz: 'o1', pytanie: 'Jak było?' }] } },
          slajdy: [{ id: 's', html: h => `<h1>Rozkład</h1><img id="o1" alt="próba" src="OBRAZ" style="max-height:120px"><div class="row"><div class="col"><img id="o2" alt="próba" src="OBRAZ"></div><div class="col">${h.wykres('o1')}</div></div>` }] };'''.replace('OBRAZ', obraz)
        ctx = b.new_context(); ctx.route('**/tresc.js', lambda r: r.fulfill(body=mini, content_type='text/javascript; charset=utf-8'))
        mp = ctx.new_page(); mp.set_viewport_size({'width': 1600, 'height': 900}); obserwuj(mp, 'mini-prowadzacy')
        mp.goto(BASE + 'prowadzacy.html?s=mini123456' + Q)
        mt = ctx.new_page(); mt.set_viewport_size({'width': 390, 'height': 844}); obserwuj(mt, 'mini-telefon')
        mt.goto(BASE + 'index.html?s=mini123456' + Q); time.sleep(1.5)
        mt.click(".skala button[data-v='4']"); time.sleep(1.6)
        wiersze = mp.locator('.grp').all_inner_texts()
        spr(len(wiersze) == 5 and '1 (100%)' in wiersze[3] and '0 (0%)' in wiersze[0], 'najmniejsza treść: rozkład ocen w skali 1–5')
        spr(not mp.is_visible('#kontrola'), 'najmniejsza treść: kontrola bez uwag')
        wym = "(() => [...document.querySelectorAll('img')].map(i => { const r = i.getBoundingClientRect(); return [i.naturalWidth, Math.round(r.width), Math.round(r.height)]; }))()"
        ot = mt.evaluate(wym); szer = mt.evaluate('[document.documentElement.scrollWidth, innerWidth]')
        spr(len(ot) == 1 and ot[0][0] == 2000 and 200 < ot[0][1] <= 390 and abs(ot[0][1] - 2 * ot[0][2]) <= 2 and szer[0] <= szer[1], 'obrazek na telefonie: mieści się w szerokości ekranu i zachowuje proporcje (%s, %s)' % (ot, szer))
        osl = mp.evaluate(wym)
        spr(len(osl) == 2 and osl[0][2] == 120 and osl[0][1] == 240 and 600 < osl[1][1] <= 684 and abs(osl[1][1] - 2 * osl[1][2]) <= 2, 'obrazek na slajdzie: ograniczona wysokość i kolumna, proporcje zachowane (%s)' % osl)
        zrzut('s16_obrazki', mp); zrzut('t16_obrazek', mt)
        ctx.close()
        b.close()
finally:
    for pr in procs: pr.terminate()

ok = sum(1 for w, _ in wyniki if w)
print('TRYB %s: %d z %d sprawdzeń poprawnych' % (TRYB, ok, len(wyniki)))
print('Błędy stron:', '\n'.join(bledy) if bledy else 'brak')
sys.exit(0 if ok == len(wyniki) and not bledy else 1)
