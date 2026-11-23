#!/bin/sh
# Wszystkie testy strony „prezentacja”. Użycie: sh prezentacja/testy/wszystko.sh <katalog strony> <katalog na zrzuty>
# Wymaga: Node.js oraz Pythona z pakietem playwright (Chromium).
S="${1:-prezentacja}"; Z="${2:-/tmp/zrzuty-prezentacja}"; T="$(dirname "$0")"; W=0
uruchom() { "$@" > "$Z/ostatni.log" 2>&1 || W=1; tail -2 "$Z/ostatni.log"; }
mkdir -p "$Z"
uruchom node "$T/test_karta.js" "$S/sala/karta.js"
uruchom python3 -I "$T/e2e_pokaz.py" "$S/sala" mock "$Z/pokaz-mock"
uruchom python3 -I "$T/e2e_pokaz.py" "$S/sala" serwer "$Z/pokaz-serwer"
uruchom python3 -I "$T/e2e_karta.py" "$S" mock "$Z/karta-mock"
uruchom python3 -I "$T/e2e_karta.py" "$S" serwer "$Z/karta-serwer"
uruchom python3 -I "$T/e2e_kreator.py" "$S" "$Z/kreator"
[ "$W" = 0 ] && echo "WSZYSTKIE TESTY POPRAWNE" || echo "SĄ BŁĘDY"
exit $W
