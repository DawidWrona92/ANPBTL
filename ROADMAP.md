# Mapa drogowa: America: No Peace Beyond the Line (prototyp)

Gra to `index.html` (canvas 2D, bez zależności); po migracji grafiki dojdzie katalog `assets/`. Źródłem zasad jest [docs/dokumentacja-zasad.md](docs/dokumentacja-zasad.md); oznaczenia `[Ź]` (źródło) i `[P]` (projekt własny) są tam wyjaśnione w sekcji 19.0.
Testy: `npm install && npx playwright install chromium && npm test` (49 sprawdzeń na prawdziwym `index.html`).

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

## 4. Fazy i podpunkty

Fazy to grube tematy, podpunkty ich szczegóły. Te same numery są w planie prac. ✅ zrobione, 🔶 w toku, ⬜ do zrobienia. W nawiasach dawne nazwy chunków (G2, C2...), żeby stare commity dało się odnaleźć. Definicja ukończenia podpunktu: mechanika + zasoby graficzne + test w `tests/regression.js` + budżet regresji balansu (5 seedów) + wpis tutaj.

| Faza | Temat | Status |
|---|---|---|
| 1 | Naprawy błędów i testy regresyjne | ✅ |
| 2 | Źródła i wierność oryginałowi (`docs/zrodla.md`, `docs/parametry.md`; R0) | ✅ stale uzupełniana |
| 3 | Komendy i interfejs (C1) | ✅ |
| 4 | Narzędzia balansu (B0, B1) | ✅ |
| 5 | Grafika w stylu oryginału (G1, G1b, G2) | ✅ |
| 6 | Fundament: frakcje jako dane, trudność, zapis (C2) | ✅ |
| 7 | Frakcja Osadnicy (C3) | ✅ (bez ablacji banku, do zrobienia przed fazą 14) |
| 8 | Teren i brzegi | 🔶 8.1–8.6 wypchnięte; 8.7 grunt w 2× rozdzielczości (był „niedoczytany”), 8.8 sucha preria i jasny piasek, 8.9 skały i żyły złota kanciaste; czeka na Twoją ocenę w grze |
| 9 | Interfejs jak w oryginale | ✅ 9.1 zrzuty od właściciela (docs/zrodla.md), 9.2 deski i pergamin (`tools/art/build_ui.js`) i pasek zasobów z ikonami, 9.3 panel dolny (info o zaznaczeniu, siatka poleceń na pergaminie, zakładki grup 1–6), 9.4 minimapa w ramie z przyciskami (pomoc, zapis, odczyt), 9.5 menu główne, wybór ludu (cztery koła), ustawienia (dźwięk, przewijanie, szybkość gry, cienie, trudność), okna dialogowe z deskami, 9.6 testy. Do oceny w grze; szczegóły na koniec |
| 10 | Potyczka: mapy, kaniony (10.7: ciągłe mesy z tarasami jak w oryginale), motywy terenu, wybór przeciwnika | ✅ 10.1 mapy jako dane ASCII (`assets/maps.js` z `tools/maps/build_maps.js`), zmienny rozmiar mapy, teren w kafelkach 512 px; 10.2 klify `T_CLIFF` (nieprzekraczalne, bez zabudowy; sprite'y warstwowego piaskowca per motyw); 10.3 mapy: Preria (klasyczna), Kanion Dwóch Przejść, Bród, Płaskowyż 56×56; 10.4 motywy arid / preria / trawiasta / auto; 10.5 ekran ustawień potyczki z miniaturami map, wyborem terenu, przeciwnika (tylko Desperado aktywny, reszta „wkrótce” do fazy 14) i trudności; 10.6 testy (przejścia na każdej mapie, klify, zapis, AI 6 min na nowych mapach) |
| 11 | Obsługa telefonów i ekranów dotykowych (po interfejsie): sterowanie dotykiem, układ pod mały ekran | ✅ 11.1 dotyk: dotknięcie zaznacza lub wydaje rozkaz, podwójne dotknięcie zaznacza typ, przeciągnięcie = kamera, przytrzymanie 350 ms + przeciągnięcie = ramka, przytrzymanie = rozkaz z kolejką, dwa palce = kamera i zoom (1.2–3×, kółko myszy też), tryb budowy/celowania celuje palcem i wykonuje po puszczeniu, przycisk „Anuluj”; 11.2 tryb zwarty (`html.compact`: niski panel, zwijany przyciskiem ▾, minimapa 104 px, przyciski ≥44 px, bezpieczne marginesy, menu przewijalne, komunikat „obróć telefon” w pionie); 11.3 ustawienie „Jakość grafiki” (Niska: teren 1×, bez cieni sprite'ów, DPR ≤1), domyślnie Niska na ekranach dotykowych i przy ≤4 GB pamięci; 11.4 testy Playwright z `hasTouch` (740×360, 844×390, zdarzenia przez CDP). Czucie gestów i wydajność na prawdziwym telefonie sprawdza gracz |
| 12 | Mechaniki misyjne i Sioux (C8a, M0) | ⬜ 12.1 pakowanie tepee, 12.2 skradanie i wykrywanie, 12.3 etapy celów, 12.4 wóz kryty, eskorta, rabunek |
| 13 | Kampanie Sioux i USA, misje 1–2 (M1) | ⬜ 13.1 szkielet misji, 13.2 Sioux, 13.3 USA |
| 14 | Desperado, AI wszystkich frakcji, misje Desperado (C4, C4b, M2) | ⬜ |
| 15 | Meksykanie i ich misje (C7, M3) | ⬜ |
| 16 | Backlog | ⬜ add-on, tutoriale, misje 3+, jednostki rzeczne, mapy 64/128/192 i A*, edytor, **multiplayer (mgliste TODO)** |

Szczegóły zrobionych faz: 1 i 3 w sekcji 2 (dziennik napraw); 4 w sekcji 6; 5 w sekcji 5; 6: tabela `RACES`, 5 poziomów trudności (docs/parametry.md), zapis/odczyt w localStorage (wersjonowany JSON, stany obu RNG, test identycznego przebiegu po wczytaniu), testy z 14.5. Nie zrobione z fazy 6, przeniesione do fazy 11: wybór frakcji wroga, kapitulacja AI, zwiadowca przed falą.

**Faza 7 (Osadnicy), stan:** bank (limit 5 od startu budowy, +1 złoto/s, limit złota +500), ranczo (limit żywności +150), szeryf (wzrok 10, aura jak przywódca), armata (obszar r 1.5), frontiersman i frontierswoman (osobne role), populacja do 200; sprite'y jednostek i budynków wygenerowane. Bot balansu przepisany: pierwsza piechota mediana 238 s (5 seedów) wobec 314 s przed fazą 7; **wyniki nie są porównywalne** (zmienił się i skład startowy, i bot), więc to nowy punkt odniesienia, a 306 s z dokumentacji przestaje być miarą zgodności. Żywność jest wąskim gardłem (at300s: 21), co wymaga decyzji, ile kobiet na start; nieznane (`[P]`).

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
