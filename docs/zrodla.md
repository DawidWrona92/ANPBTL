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
