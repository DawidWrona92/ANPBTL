# Źródła i ustalenia o oryginale (R0)

Reguła projektu: przy sprzeczności lub luce szukamy w źródłach, nie zgadujemy. Hierarchia: manual > recenzje i zapowiedzi z 2001 > patch notes > wiki i bazy gier > teksty maszynowe.
Status pozycji: `[Ź]` potwierdzone źródłem, `[P]` rekonstrukcja. Wiarygodność oznaczona przy każdym wpisie.

Dostęp: 2026-10-14. Zebrane przez właściciela projektu z wyszukiwarki i filmów; środowisko pracy Claude ma zablokowane pobieranie stron (polityka sieci), więc linki poniżej **nie zostały przeze mnie otwarte** i nie cytuję z nich niczego poza tym, co dostarczył właściciel.

## Ogólnie
- Cztery kampanie: Indianie (Sioux), Meksykanie, Desperado (Outlaws), Amerykanie (osadnicy/USA). Każda ma 6–8 misji, razem ok. 30–40 (GOG podaje „ponad 40", dokumentacja ponad 30, recenzja niemiecka 6–8 na kampanię). `[Ź]`, wiarygodność umiarkowana, liczba dokładna nieustalona.
- Cele misji potrafią zmieniać się w trakcie (np. po postawieniu osady nowy rozkaz: zniszcz wrogą milicję). `[Ź]` (Gameswelt).
- Zalecana kolejność kampanii (producent): Indianie → Meksykanie → Desperado → Amerykanie, od najłatwiejszej do najtrudniejszej. `[Ź]`
- Expansion Pack dodaje po 2 misje na frakcję (Gamicus). `[Ź]`

## Misje 1–2 każdej frakcji
| Frakcja | Misja | Tytuł | Co wiemy | Status |
|---|---|---|---|---|
| Sioux | 1 | The Santee Sioux Uprising | Powstanie Santee Sioux 1862. Misja oparta na **skradaniu**: traperzy wykrywają ukryte jednostki, znajomość ścieżek niemal niezbędna; uchodzi za najtrudniejszą misję gry | `[Ź]` tytuł i charakter, cele szczegółowe `[P]` |
| Sioux | 2 | Battle of North Platte River | Z komentarzy LP: napad/rajd („heist"), nie klasyczna bitwa bazowa | `[Ź]` tytuł, cele `[P]` |
| Meksyk | 1 | Trade Routes | Zabezpieczanie szlaków handlowych, typowe zadania ekonomiczne | `[Ź]` tytuł, cele `[P]` |
| Meksyk | 2 | Border Protection | Defensywna, liczne oddziały indiańskie, trudniejsza niż 1 | `[Ź]` tytuł i charakter |
| Desperado | 1 | Band Terror | Budowa obozu bandy, terroryzowanie okolicy, destylacja alkoholu | `[Ź]` |
| Desperado | 2 | **nieznany** | Nie znaleziono tytułu ani opisu. Dalej: rozdział 3 „Bounty Hunt", potem Jesse James (napad na bank), Sheriff's Deadline (starcie z armią USA) | **luka** |
| USA | 1 | The Trek West | Eskorta karawany osadników na Zachód, potem założenie osady | `[Ź]` tytuł i charakter |
| USA | 2 | Remember the Alamo | Fort Alamo 1836; czy obrona, czy odbicie, niejasne. Dalsze misje: Veracruz, Mexico City (wojna 1846–48) | `[Ź]` tytuł, cele **luka** |

## Mechaniki Desperado (rozstrzyga sprzeczność dokumentacji 5.1/8.2 kontra 19.3)
1. **Brak własnej produkcji.** Wszystkie surowce (żywność, drewno, złoto, broń, konie) trzeba zagarnąć w napadach i zrabować, a potem zawieźć do obozu. `[Ź]` (hisgames, MyAbandonware, LP)
2. **Whisky zamiast żywności**, wytwarzana w **destylarni**, jedynym zakładzie produkcyjnym frakcji („concerning amounts of liquor we are distilling here" w LP Band Terror). `[Ź]`
   Obie wersje dokumentacji miały rację: „rabunek" dotyczy surowców, a „destylarnia" produkcji whisky. Czas, koszt i plon whisky (19.3: 1 butelka / 8 s za 5 drewna) pozostają `[P]`.
3. Rozgrywka taktyczna (rajdy, zasadzki, mobilność) zamiast klasycznej ekonomii. `[Ź]`
4. Jednostki: bandleader, desperado, łowca (hunter), zabójca (assassin), trzaska bicza (whip cracker). `[Ź]` (MyAbandonware)
5. Konwencja legend Dzikiego Zachodu: Billy the Kid (bohater z kodów), Jesse James, polowania na nagrody, starcie z szeryfami i armią. `[Ź]`

## Inne ustalenia
- Indianie: tepee można pakować i przenosić, obóz jest mobilny (pasuje do rajdów). `[Ź]` (Giant Bomb)
- Osadnicy: szeryf z większym polem widzenia, banki z limitem 5 (znany błąd pozwala zbudować więcej). `[Ź]`
- Żywność: polowanie (bizony, krowy, konie) i kobiety na polach; ranczo zwiększa limit żywności. `[Ź]`

## Wymagania mechaniczne wynikające z misji
Ukrycie i wykrywanie (Sioux 1), rajd i rabunek jako cel (Sioux 2, Desperado), pakowanie tepee (Sioux 2), zmiana celów w trakcie misji (wiele), eskorta wozu A→B (USA 1), fale obronne (Meksyk 2), cele ekonomiczne i ochrona szlaku (Meksyk 1). Patrz `ROADMAP.md`, chunki C8a i M0.


## Wygląd budynków i kolor (pamięć gracza, 2026-10-14) `[Ź: pamięć gracza]`
- **Budynki nie mają koloru frakcji ani właściciela**: frakcje odróżnia styl architektury, nie kolor. Kolor drużyny dotyczy jednostek.
- **Desperado:** budynki z postarzonych, szarych, zniszczonych desek (wiele dziur i rusztowań), jak na dostarczonych screenach.
- **Osadnicy (USA):** też drewniane, ale **ze świeżego drewna, bez dziur i zniszczeń**. Zwykłe domy z **brązowych desek**. **Główna baza z desek malowanych na biało.** Jedynie **magazyn** (szopa) jest w zniszczonym, szarym stylu jak u Desperado.
- Meksykanie: biały tynk, czerwone dachy (ze screenów); Sioux: tepee ze skóry z niebieskimi pasami (ze screenów).
- Niebieskie i żółte wykończenia ze screenów USA i Desperado traktujemy jako stały element stylu (nie zależą od właściciela); do potwierdzenia.

## Do ustalenia
- Tytuł, cele i przebieg misji Desperado 2.
- Szczegółowe cele: Sioux 1 i 2, Meksyk 1, USA 1 i 2.
- Liczby z manuala (niemiecki PDF, ok. 11 MB, MyAbandonware): koszty, czasy, statystyki, model whisky.
- Dokładna liczba misji w kampaniach.

## Źródła (dostarczone przez właściciela)
- Let's Play TaxOwlbear: [#1 Native Americans 1: The Santee Sioux Uprising](https://www.youtube.com/watch?v=L09l71k2ZU8) oraz [dyskusja r/RealTimeStrategy](https://www.reddit.com/r/RealTimeStrategy/comments/f89loi/lets_play_america_no_peace_beyond_the_line_1/)
- [#2 Native Americans 2: Battle of North Platte River](https://www.youtube.com/watch?v=D9WsU1KYOKk)
- [#9 Mexicans 1: Trade Routes](https://www.youtube.com/watch?v=dmr-BGX4knM)
- [#10 Mexicans 2: Border Protection](https://www.youtube.com/watch?v=3xpV8K0IQHY)
- [#15 Outlaws 1: Band Terror](https://www.youtube.com/watch?v=BqUMghttGuw)
- [#17 Outlaws 3: Bounty Hunt](https://www.youtube.com/watch?v=sIbnCO5hixs)
- [U.S. Americans, rozdział 1: The Trek West](https://www.youtube.com/watch?v=wZMgJo7SkUw)
- [U.S. Americans, rozdział 2: Remember the Alamo (Rutube)](https://rutube.ru/video/aed4ae5aef3b6b18b839735216fff689/)
- [hisgames.org](https://hisgames.org/games/america-no-peace-beyond-the-line) (brak produkcji, whisky, kampanie 6–8 misji; tekst maszynowy, wiarygodność niska)
- [MyAbandonware](https://www.myabandonware.com/game/a-m-e-r-i-c-a-c5v) (jednostki Outlaws, kampanie)
- [Giant Bomb](https://giantbomb.com/wiki/Games/America_No_Peace_Beyond_the_Line) (szeryf USA, mobilne tepee)
- [Gameswelt](https://www.gameswelt.de/america-no-peace-beyond-the-line/test/america-no-peace-beyond-the-line-3029) (zmiany celów w trakcie misji, historyczne podstawy, kolejność kampanii)
- [GameFabrique](https://gamefabrique.com/games/america-no-peace-beyond-the-line/) (typowe cele: karawana z A do B)
- [Wikipedia: America (video game)](https://en.wikipedia.org/wiki/America_(video_game)), [Dakota War of 1862](https://en.wikipedia.org/wiki/Dakota_War_of_1862)

Wyniki mojego własnego wyszukiwania (potwierdzają tytuły rozdziałów, cztery frakcje, bandleadera i po 2 misje add-onu na frakcję): Gamicus, GOG Dreamlist, Cheatbook.


## Interfejs oryginału (zrzuty od właściciela, 2026-10-14) `[Ź: zrzuty]`
- **Pasek zasobów:** wąski ciemny pas na całą szerokość górnej krawędzi, małe ikony z liczbami. Kolejność: żywność (mięso), drewno, złoto (liczba i w nawiasie druga wartość, np. `5000(0)`, znaczenie nieustalone), broń, konie (liczba czerwona przy pełnym limicie, np. `8/8`), populacja `19/44`.
- **Panel dolny:** deski postarzonego drewna z postrzępioną górną krawędzią. Z lewej blok informacji o zaznaczeniu (nazwa, zdrowie, wartości, doświadczenie, procent), portret w pergaminowej płytce; przy wielu jednostkach siatka miniatur. W środku rząd małych zakładek (6, oznaczone kropkami jak kości do gry, znaczenie nieustalone) i pod nim dwa rzędy pergaminowych płytek poleceń ze szkicowanymi ikonami; w prawym dolnym rogu płytka z nagrobkiem (rozwiązanie/usunięcie jednostki).
- **Minimapa:** w drewnianej ramie, po lewej trzy pionowe przyciski, nad ramą widać mapę (panel nie zajmuje środka dołu ekranu).
- **Komunikaty:** czerwony napis na środku nad panelem (np. „Our people are under attack”), bez ramki.
- **Menu główne:** ciemna scena zachodu słońca z postacią wodza po lewej, tytuł u góry, polecenia (Start single-player campaign, Open multi-player game, Join multi player game, Settings, Credits, Exit game) jako czerwono-pomarańczowy tekst po prawej.
- **Wybór ludu:** deski, nagłówek AMERICA, wąska tabliczka „Select people”, cztery postacie w ciemnych kołach (trzy w rzędzie i jedna niżej), na dole przyciski „Back” i „Load game”.
- **Ustawienia:** deski, ciemne tabliczki z nazwami (Sound, Music, Resolution, Scroll speed, Game speed, Mouse speed, Shadow) i złote wartości po prawej (np. 1024×768, Normal, Fast, Transparent), przycisk OK na dole.
- **W prototypie `[P]`:** zakładki grup 1–6 zamiast kostek (funkcja zakładek w oryginale nieznana), przyciski pomoc/zapis/odczyt zamiast trzech przycisków minimapy (ich funkcje nieznane), nagrobek (rozwiązanie jednostki) i ustawienia rozdzielczości, muzyki i szybkości myszy pominięte (brak odpowiedników), postacie wodza i kobiet z menu zastąpione portretami jednostek z gry.


## Teren: klify i kaniony `[Ź: pamięć gracza, 2026-10-14]`
- W oryginale była **nieprzekraczalna elewacja terenu** (klify, kaniony) służąca do **tunelowania**, czyli kształtowania korytarzy i przełęczy na mapie. W prototypie to typ `T_CLIFF`: nieprzekraczalny dla każdej jednostki (także pływających), bez zabudowy i zasobów.
- `[P]` Wzrok przez klif przechodzi (w oryginale elewacja mogła zasłaniać widok, do potwierdzenia).
- Motywy terenu w oryginale (pamięć gracza): **arid** (oryginalny wygląd, ochrowa wypalona ziemia), preria i trawiasta; prototyp ma trzy motywy i opcję „auto” (Sioux: trawiasta, pozostali: preria).

- **Wygląd klifów w oryginale (zrzut od właściciela, 2026-10-15):** jedna ciągła płaska mesa z jasnym, spękanym, piaskowym wierzchem; ściany nierówne, ciemniejsze (brązowo-rdzawe), z pionowymi żłobieniami od erozji i poziomymi półkami, o różnych wysokościach tworzących tarasy; kontur schodkowy, u podstawy odłamki skalne. Prototyp (10.7): wierzch to okresowy atlas rysowany ciągłą powierzchnią, ściany to ścięta tekstura (żłobienia, półki), wysokość kafla z odległości od krawędzi masy i niskoczęstotliwościowego szumu `[P]`.
- **Widzenie i walka w oryginale (pamięć gracza, 2026-10-15):** nie było osobnego „skradania”. Misje typu Sioux 1 opierały się na zwykłych mechanikach: pole widzenia jednostek Indian jest większe niż innych, promień, w którym jednostka widzi, jest inny niż promień, w którym zaczyna atak (atak jest bliżej), do tego patrolowanie. Dzięki temu można lawirować jednostką Indian i chować się po prostu poza polem widzenia strażników. `[Ź: pamięć gracza]` Prototyp (12.1): `sight` > `aggro` dla wojska Sioux (wojownik 8, łucznik 8, medicine 8, wódz 9; reszta 6, szeryf 10) `[P: liczby]`, maska widzenia wroga `S.visibleE` i atak tylko na cele widziane przez frakcję, polecenie patrolu [V].


## Poradnik z manuala i poprawki (dostarczył właściciel, 2026-10-16) `[Ź instrukcja]`
Pliki: [podrecznik.md](podrecznik.md) (jednostki, budynki, ulepszenia, drzewka Indian i Osadników z manuala podstawki i Expansion Pack, plus walkthrough samouczków i misji 1) i [podrecznik-weryfikacja.md](podrecznik-weryfikacja.md) (tabela poprawek z recenzji i wątków). Od tej daty **dane liczbowe Osadników i Sioux pochodzą z poradnika**, a Część II dokumentacji (19.x) zostaje rezerwą dla tego, czego manual nie podaje (czasy, prędkości, zasięgi, pojemności) oraz dla Meksykan i Desperado.
- **Ekonomia:** złoto z Gold Warehouse trzeba dowieźć Travois/wozem do bazy; Pole jest osobnym budynkiem (do 5 przy Spichlerzu/Farmie); handel (Trading Post / General Store), napad Rob na banki, misje i magazyny złota, kradzież pojazdów Steal.
- **Kamuflaż:** ulepszenie Camouflage School; wykrywają go Arrow Shooter i Trapper (to samo dotyczy pułapek Pitfall). To koryguje mój wniosek z 12.1 „nie ma osobnego skradania”: pole widzenia i patrole nadal są podstawą, ale kamuflaż istnieje jako ulepszenie i w misji Sioux 1 (traperzy go wykrywają).
- **Tipi:** Travois (kupowana jednostka: 75 drewna + koń) dojeżdża do tipi, zwija je, przewozi i rozkłada.
- **Osadnicy:** Sheriff z większym wzrokiem `[Ź]`, Fort jako próg rozwoju (Sheriff's Office → Fort → Training Camp / Weapons Factory), Bank limit 5, bydło zyskuje wartość z czasem.
- **USA 1 „The Trek West”:** karawana, co najmniej dwa wozy, osadnik i osadniczka na zachód do Teksasu, założenie obozu, potem zniszczenie meksykańskiej milicji `[Ź Gameswelt, potwierdzone przez poradnik]`.
- **Sioux 1:** „traperzy wykrywający kamuflaż, znajomość ścieżek” `[Ź r/RealTimeStrategy]`.
- Otwarte: Tepee of the Elders (sprzeczne wymagania w podstawce i dodatku), nazwa i koszt General Store/Trading Post Osadników, „Gatling Gun” z prasy.
