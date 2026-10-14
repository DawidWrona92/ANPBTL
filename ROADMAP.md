# Mapa drogowa: America: No Peace Beyond the Line (prototyp)

Gra to jeden plik `index.html` (canvas 2D, bez zależności). Źródłem zasad jest [docs/dokumentacja-zasad.md](docs/dokumentacja-zasad.md); oznaczenia `[Ź]` (źródło) i `[P]` (projekt własny) są tam wyjaśnione w sekcji 19.0.
Testy: `npm install && npx playwright install chromium && npm test` (21 sprawdzeń na prawdziwym `index.html`).

## 1. Stan na dziś

Działa: ekonomia z upkeepem farm, łańcuchy dostaw, budowa i kolejki (5 slotów), populacja przez domy/tepee, morale i panika, XP z walki i z pracy, model walki 19.4, jazda i konie (dzikie stada, zagroda, schwytanie), polowanie, 4 technologie, postawy G/N/O/T i grupy Ctrl+1–9, frakcje Osadnicy i Sioux (squaw, wojownik, łucznik, medicine man, wódz, rzeka, gąszcz, deszcz i burza), AI Desperado z koszarami i wyprawami, mgła wojny, minimapa, tryb testowy, dźwięk syntezowany, grafika retro-rts 64×32.

## 2. Dziennik napraw (przegląd kodu 2026-10-14)

Każda pozycja ma w `tests/regression.js` test, który na wersji bez poprawki pada.

| Id | Błąd | Weryfikacja |
|---|---|---|
| F1 | `uPath` / `pathToBuildingU` wywoływały same siebie: gra nie startowała | uruchomiona: `RangeError` przy ładowaniu |
| F2 | jednostki wręcz nie atakowały z przekątnej, szturm zacinał się w rogach (także po ponownym wyznaczeniu ścieżki w połowie kafla) | uruchomiona: 40/40 szturmów po poprawce, 3×3 było 4/8 |
| F3 | limit populacji liczył tylko kolejkę jednego budynku | uruchomiona: 15 zamówień przy 6 wolnych miejscach |
| F4 | zmiana surowca zamieniała niesione drewno w złoto | uruchomiona |
| F5 | podwójna cyfra grupy ustawiała kamerę we współrzędnych kafli | uruchomiona |
| F6 | `#abilitybar` bez CSS (punkt 0,0, szare przyciski) | uruchomiona |
| F7 | jednostki pojawiały się do 3 kafli od budynku, a przy braku miejsca ginęły | uruchomiona |
| R1 | zabity w danym ticku jeszcze atakował | uruchomiona |
| R2 | `Math.random()` w trafieniach: partie nie były powtarzalne | uruchomiona (dwa przebiegi różne → takie same) |
| R3 | wielkość stada losowana w warunku pętli (średnia 18,2 zamiast 19,5 koni) | uruchomiona na 200 seedach. **Mapy dla danego seeda wyglądają inaczej niż przed poprawką** |
| R4 | skróty ignorowały Ctrl/Alt (Ctrl+C wyciszał), Shift psuł WASD, brak czyszczenia na `blur` | uruchomiona |
| R5 | kamera przewijała w nieskończoność po wyjściu kursora z okna | uruchomiona |
| R6 | prostokąt widoku na minimapie z dwóch narożników | oględziny zrzutu (romb z czterech narożników) |
| R7 | łucznik nie strzelał w paśmie 6–7 kafli (nabór i zerwanie celu się nie zgadzały) | uruchomiona |
| R8 | wojownik Sioux (aggro 0) nie bronił się. **Decyzja właściciela:** wojownik `aggro 5`, squaw tylko ucieka (`fleesOnHit`). W źródłach brak danych | uruchomiona |
| R9 | ciche straty: koń przy limicie, koszt kolejki zburzonego budynku, nadmiar surowca | uruchomiona |
| R10 | brak powrotu do menu po końcu gry (w tym pułapka: `Test` po porażce zamrażał symulację), wyciszenie zerowane, pomoc nie pauzowała, nieaktualny tekst pomocy | uruchomiona |
| R11 | budowa w mgle i pod jednostkami, jednostka przechodziła przez nowy budynek | uruchomiona |

Nie jest błędem, tylko brakiem funkcji (przeniesione do C4): AI Desperado nie ma koni, więc gałąź `konnobanda` jest martwa poza trybem testowym.

Nie zweryfikowane: odczucie z gry (tempo, balans po zmianie `aggro` wojownika), wygląd grafiki, zachowanie na ekranach dotykowych i w innych przeglądarkach niż Chromium.

## 3. Co zostało względem dokumentacji

Rozmiary: S = kilka godzin, M = jeden dzień, L = kilka dni. Każdy chunk kończy się commitem, własnym testem w `tests/regression.js` i wpisem w sekcji 2.

| Chunk | Zakres | Rozmiar | Zależy od |
|---|---|---|---|
| **C1 Komendy i UX** (start) | punkty zbiórki (flaga rally per budynek, `P`), Shift-waypointy, skróty `A` atak / `S` stop / `H` hold / spacja = ostatni alert, podwójny klik zaznacza wszystkich tego typu, anulowanie slotu kolejki ze zwrotem kosztu, alert z kierunkiem ataku, slot czeka przy braku zasobów (dok. 19.7) | M | — |
| **C2 Fundament silnika** | wybór frakcji i trudności także dla **przeciwnika**, zapis i odczyt (snapshot + seed), tabele danych wydzielone z `CFG` (14.3), testy z 14.5 (las, rozbierane obiekty, rozkaz grupowy) | M | — |
| **C3 Dokończenie Osadników** | frontiersman/frontierswoman (podział płci), bank (limit 5 sprawdzany **przy starcie budowy**, +1 złota/s, +500 limitu), szeryf (wzrok 10, aura +10), armata (gałąź `art` w `typeMult` już jest), ranczo (+150 żywności), cap populacji 200 | M | C2 |
| **C4 Desperado i AI** | whiskey i destylarnia, kradzież broni, łowca / zabójca / trzaska bicza, 5 poziomów trudności (19.9), fale: pierwsza 480 s, interwał 180 s, wielkość `5+2n` cap 40, alokacja robotników 40/30/20/10, **zagroda dla AI** (konne bandy od fali 3), kapitulacja AI, przełącznik `cpuon/cpuoff` | L | C2 |
| **C5 Technologie i budynki add-onu** | 10 brakujących technologii z 14 (19.4), tartak, obóz treningowy, restauracja, namiot starszyzny | M | C3 |
| **C6 Zdolności specjalne** | leczenie (ksiądz/zakonnica), konwersja padre, klątwa szamana, szarża kawalerii, mount/dismount, bohaterowie, jednostki add-onu (tomahawk, pionier, Gatling, miotacz ognia, sabotuer, opancerzony dyliżans) | M | C3, C5 |
| **C7 Meksykanie** | milicjant, gaucho (bolas), gunslinger, commandant, mobilna armata, ksiądz | L | C2, C6 |
| **C8 Woda i obóz Sioux** | kanu, tratwa, łódź żaglowa (rekonstrukcja z okładki pudełka, bez danych liczbowych), pakowanie i przenoszenie tepee | M | — |
| **C9 Misje i kampanie** | format JSON z triggerami (19.8), cele: zniszcz / eskortuj / uratuj / zdobądź / przetrwaj / zbierz, tutorial 4 poziomów, kampanie, później edytor | L | C2, C4 |
| **C10 Grafika painted** (równolegle od C1) | migracja całej gry (patrz niżej) | L | — |
| **C11 Skala i wydajność** (opcjonalnie) | mapy 64/128/192, A* z sektorami 16×16, błoto i droga, klify, stały tick 10 Hz, LOD poza kamerą | L | C2 |

Poza zakresem do osobnej decyzji: multiplayer lockstep (19.10), głosy i muzyka (19.11), lokalizacja.

### C10, uwagi do grafiki

Decyzja właściciela: przejście na **painted** (skill painted-rts-sprites). Obecna gra ma kafel 64×32 (`CFG.tileW/tileH`), a skill domyślnie 96 px, więc najpierw trzeba wybrać: renderować painted w `tilePx: 64` (bez zmian w silniku, wcześniejsze próby z dokumentacji 20.17 tak robiły) albo przeskalować `CFG` i kamerę. Światło w grze pada z lewego górnego rogu, w skillu z prawego górnego, więc sprite'y trzeba odbić poziomo. Kolejność: teren i drzewa → budynki 3 nacji → jednostki (8 kierunków, chód i atak) → Sioux (tepee, squaw, wojownik, łucznik, medicine man, wódz) → zwierzyna (bizon, bydło, koń) → detale terenu. Kolor drużyny przez maskę zamiast palet, cień jako osobna warstwa. Do czasu migracji obowiązuje stary styl: nie mieszać obu w jednej scenie.

## 4. Pytania otwarte do właściciela

1. Skala painted: `tilePx 64` (zalecane, bez zmian w silniku) czy 96?
2. Czy Desperado ma być frakcją grywalną (C4), czy tylko przeciwnikiem?
3. Czy multiplayer w ogóle jest celem?
4. Ile misji kampanii wchodzi do pierwszego wydania (dokumentacja: ponad 30)?
