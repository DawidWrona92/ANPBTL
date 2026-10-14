# Mapa drogowa: America: No Peace Beyond the Line (prototyp)

Gra to `index.html` (canvas 2D, bez zależności); po migracji grafiki dojdzie katalog `assets/`. Źródłem zasad jest [docs/dokumentacja-zasad.md](docs/dokumentacja-zasad.md); oznaczenia `[Ź]` (źródło) i `[P]` (projekt własny) są tam wyjaśnione w sekcji 19.0.
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

## 3. Nadrzędny cel i zasady

Cel: **jak najwierniejsze odtworzenie oryginału.** Przy sprzeczności lub luce szukamy w źródłach, nie zgadujemy (hierarchia: manual > recenzje z 2001 > patch notes > wiki > teksty maszynowe). Każda mechanika ma status `[Ź]` (źródło) albo `[P]` (rekonstrukcja); wartości `[Ź]` nie „poprawiamy" dla wygody balansu. Ustalenia i źródła: [docs/zrodla.md](docs/zrodla.md).

## 4. Co zostało: kolejność chunków

Rozmiary: S = kilka godzin, M = dzień, L = kilka dni. Definicja ukończenia chunku: mechanika + sprite'y (po G2) + test w `tests/regression.js` + budżet regresji balansu + wpis tutaj.

| Faza | Chunk | Rozmiar | Zakres |
|---|---|---|---|
| A | **G1 Spike grafiki** | S–M | cztery próbki (dom, drzewo, humanoid, koń) w stylu AoE2; decyzja właściciela: hybryda `rts-prerender-3d` (budynki, drzewa, teren) + `painted-rts-sprites` (jednostki, zwierzęta) / tylko painted / tylko prerender. Sprite'y w 128 px, `CFG` zostaje 64×32 i `ZOOM=2` |
| A | **C1 Komendy i UX** — **zrobione** | M | punkt zbiórki (`P`, przycisk albo PPM przy zaznaczonym budynku), Shift+PPM = trasa, `X` stop, `Q` atak-ruch, podwójny klik zaznacza typ na ekranie, sloty kolejki anulowane kliknięciem ze zwrotem, kolejka czeka przy braku surowców, alert „Atak z …” i spacja na jego miejsce. Odstępstwo od 19.7 `[P]`: skróty `X/Q/P` zamiast `S/A/H`, bo `S` i `A` to kamera (WASD), a `H` to Dom; `H` (trzymaj pozycję) jest już pod `T`. **Zmiana ekonomii:** koszt jednostki pobierany przy starcie slotu, nie przy zamówieniu; wpływa na baseline B1 |
| A | **R0 Badania źródłowe** | S | w tle; wyniki w `docs/zrodla.md`, dalsze po odblokowaniu domen (manual PDF, filmy) |
| B | **B1 Balans: bot + baseline** (+ B0 rejestr parametrów) — **narzędzia i pierwsze wyniki gotowe** | M | bot z build orderem, `npm run balance`, `npm run balance:duels`, ≥20 seedów; wyniki w sekcji 6. Zostaje: lepszy bot (złoto), bot Sioux, N ≥ 100 dla porównań wyników partii |
| B | **G2 Migracja grafiki** | L | **zrobione**: zasoby w `assets/` (teren ochra/oliwka, drzewa, rekwizyty, budynki wg stylu nacji, jednostki 8-kierunkowe, zwierzyna), stary zestaw retro usunięty, generator w `tools/art/` (`node tools/art/build_assets.js`); test pokrycia zasobów w `tests/regression.js` |
| C | **C2 Fundament** | M | **zrobione**: `RACES` (frakcje jako dane: jednostki startowe, menu budowy i produkcji, styl budynków, teren, zestaw testowy), wybór frakcji i 5 poziomów trudności w menu, zapis/odczyt (localStorage, wersjonowany JSON, stany obu RNG; test: po wczytaniu przebieg identyczny), testy z 14.5 (grupa przez las, postawy, brak duchów we mgle); **nie zrobione**: wybór frakcji wroga (czeka na C4b), kapitulacja AI i zwiadowca przed falą (C4b) |
| D | **C3 Osadnicy** | M | bank (limit sprawdzany przy starcie budowy), szeryf, armata, ranczo, frontiersman/woman, wóz kryty, cap 200 |
| D | **C8a Pakowanie tepee** | S–M | wymagane przez Sioux 2 |
| D | **M0 Mechaniki misyjne** | M | ukrycie i wykrywanie (traperzy), etapy celów zmieniane w trakcie, eskorta A→B, rabunek jako cel |
| D | **M1 Misje Sioux 1–2 i USA 1–2** | L | The Santee Sioux Uprising, Battle of North Platte River, The Trek West, Remember the Alamo; format JSON z triggerami (19.8); klątwa szamana |
| E | **C4 Desperado grywalni** | L | brak własnej produkcji, wszystko z napadów, destylarnia → whisky; bandleader, łowca, zabójca, trzaska bicza; rabunek z przewozem do obozu |
| E | **C4b AI dla każdej frakcji** | L | poziomy trudności 19.9, fale `5+2n` cap 40, alokacja robotników, zagroda dla AI (konne bandy), kapitulacja, `cpuon/cpuoff` |
| E | **M2 Misje Desperado 1–2** | M | Band Terror + misja 2 (tytuł do ustalenia) |
| F | **C7 Meksykanie** + **M3 Misje Meksyku 1–2** | L + M | leczenie, konwersja padre, mobilna armata, gaucho; Trade Routes, Border Protection |
| Backlog | | | add-on (technologie, tartak, obóz treningowy, restauracja, namiot starszyzny, tomahawk, pionier, Gatling, miotacz ognia, sabotuer, dyliżans), jednostki rzeczne, tutoriale (4 poziomy Indian), misje 3+, mapy 64/128/192 i A*, edytor poziomów, **multiplayer (mgliste TODO)** |

Zdolności i technologie frakcyjne (klątwa szamana, leczenie, konwersja) wchodzą razem z frakcją.

## 5. Grafika

Kierunek: styl AoE2 (pre-render 3D). `rts-prerender-3d` jest dobry do budynków, drzew, rekwizytów i kafli, ale słaby dla ludzi i koni, dlatego rekomendowana jest hybryda z `painted-rts-sprites` dla jednostek (obie dzielą kamerę 2:1, światło z prawej góry i maskę drużyny). Rozstrzyga G1. Sprite'y renderowane w 128 px i rysowane w połowie rozmiaru z wygładzaniem; światło w grze idzie dziś z lewej, w nowych sprite'ach z prawej (odbicie poziome). Grafika w `assets/` (koniec „jednego pliku" zaakceptowany).

## 6. Balans

Narzędzia: `npm run balance` (bot gracza, wiele seedów) i `npm run balance:duels` (macierz pojedynków i bitwy armii). Surowe wyniki w `docs/balance/`, rejestr parametrów i rozbieżności z dokumentacją w [docs/parametry.md](docs/parametry.md). **Wszystkie liczby poniżej opisują model prototypu, nie oryginał.**

### Pierwsze wyniki (2026-10-14, B1)
**Ekonomia (bot Osadników, 20 seedów × 20 min, obecna wersja vs wersja tylko z poprawioną rekurencją):**
- Pierwsza piechota: mediana 313,6 s (18 z 20 partii ją zbudowało) vs 316,6 s (14 z 20). Dokumentacja 20.1 podaje ok. 306 s; bot jest inny, więc zgodność jest orientacyjna. Naprawy F3/F7/R3 nie zmieniły wczesnej ekonomii.
- Złoto jest wąskim gardłem: mediana 0–10 po 5 i 10 minutach, broni ok. 10 po 10 min. To zgodne z opisem w 20.1, ale bot jest też po prostu słaby (część partii nie zbudowała w ogóle piechoty).
- Zakończenia po 20 min: obecna wersja wygrana 6 / porażka 1 / bez rozstrzygnięcia 13; kontrola 4 / 4 / 12. **Różnica nie jest rozróżnialna od szumu** (przy N=20 wykrywalna różnica to ok. 30 punktów procentowych). Nie wolno z tego wnioskować, że naprawy osłabiły lub wzmocniły AI.
- Ograniczenie: 12–13 z 20 partii nie kończy się w 20 minut, bo bot rzadko atakuje. Pytanie „czy kompetentny gracz przeżywa pierwszą wyprawę AI (480 s)" wymaga lepszego bota i N ≥ 100.

**Pojedynki 1:1 (N=20 na parę, strony naprzemiennie; szum ok. ±4 wygrane):**
- Wódz wygrywa ze wszystkimi poza bandleaderem (z nim 8:12); bandleader wygrywa z resztą (z wodzem 12:8). Obaj są silni względem kosztu; to dane `[P]` z 19.2.
- Piechota wygrywa z desperado (18:2), z konnobandą (13:7) i z jeźdźcem (13:7), a jeździec przegrywa z piechotą (7:13). Zgodne z 20.5 („jeździec to rajdy, nie starcie czołowe").
- Łucznik wygrywa z wojownikiem (19:1), ale przegrywa z piechotą (2:18) i z wodzem (0:20).
- Pary tych samych jednostek wychodzą od 5:15 do 15:5, więc to pokazuje poziom szumu przy N=20.

**Armie przy równym koszcie (N=20, bez mikro, marsz do środka areny):**
- Koszt liczony w całości (broń = 15, koń = 30): 17 łuczników i 20 mieszanych Sioux pokonują 9 piechurów (20:0); piechota pokonuje mieszany oddział piechota+jeźdźcy (20:0).
- Koszt liczony tylko w żywności i drewnie (bez złota, broni, koni): 17 samych łuczników pokonuje 15 piechurów (20:0), ale 15 piechurów pokonuje mieszaną armię Sioux z wojownikami (20:0). Wynik zależy więc od wag i od składu: łucznik jest mocny w obu wycenach, wojownicy rozcieńczają armię.
- Wniosek ostrożny: przewaga masowego łucznika jest zgodna z opisem w dokumentacji („tani, śmiertelny masowo", `[Ź]` co do roli), ale skala (20:0) to artefakt liczb `[P]` i braku mikro. Do ustalenia po uzyskaniu liczb z manuala; nie stroimy tego teraz.

**Czego nie zmierzono:** farmy zatrzymane przez upkeep, wpływ ucieczki squaw na żywność Sioux, bot Sioux, parytet frakcji przy realnej ekonomii, wrażliwość na każdy parametr osobno (ablacje).

## 7. Pytania otwarte

1. Tytuł i treść misji Desperado 2; cele Sioux 1–2, Meksyk 1, USA 1–2 (filmy, manual, pamięć gracza).
2. Liczby z manuala PDF (koszty, czasy, whisky).
3. Wybór stylu grafiki po G1.
