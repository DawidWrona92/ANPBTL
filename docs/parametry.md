# Rejestr parametrów (B0)

Stan z 2026-10-14, na podstawie `CFG` w `index.html` zestawionego z tabelami 19.1–19.6 i sekcjami 20.x dokumentacji ([dokumentacja-zasad.md](dokumentacja-zasad.md)). Cel: wiedzieć, skąd bierze się każda liczba, zanim zaczniemy ją stroić (zasada wierności oryginałowi, `ROADMAP.md` pkt 3).

Proweniencja:
- **źródło**: wartość lub fakt z publicznych źródeł o oryginale (`docs/zrodla.md`); nie stroić.
- **projekt `[P]`**: rekonstrukcja z Części II dokumentacji (19.x); wartość „najlepszego zgadnięcia", do zastąpienia danymi z manuala.
- **deliberate**: świadome odstępstwo prototypu od 19.x, z powodem (zwykle walidacja symulacją w 20.x lub mała mapa 40×40).
- **feel**: wartość dobrana dla grywalności, bez odpowiednika w źródłach.
- **do rozstrzygnięcia**: rozbieżność, której nie wolno zamknąć domysłem.

## Odchylenia od dokumentacji do rozstrzygnięcia
| Parametr | Dokumentacja | Prototyp | Uwaga |
|---|---|---|---|
| Częstość ataku | 19.1: co 500 ms (2 ataki/s) | `cd` 0.9–1.5 s na jednostkę | Przy tych samych obrażeniach na trafienie DPS w prototypie to ok. połowa wartości z 19.1. Wpływa na TTK i tempo bitew (B1, pytanie 3). Do rozstrzygnięcia z manuala lub filmów |
| Morale startowe | 19.1: 70 | 100 (`addUnit`) | wpływa na pierwsze panika/pracowitość (`workMult`) |
| Zasięg piechoty | 19.2: 6 | `range: 5` | ten sam zasięg ma milicjant i desperado w 19.2 |
| Czas wyszkolenia robotnika | 19.2: frontiersman 15 s, frontierswoman 12 s | `worker.train: 12` | prototyp łączy obie postacie w jednego `worker` (C3 je rozdzieli) |
| Obóz główny | 19.3: koszt 400 drewna | `cost: {}` (jest od startu) | w prototypie obóz nie jest budowany |
| Nagroda XP | 19.1: progi 100/300/700, zabicie = 10% kosztu celu | progi 25/75/150, +2 za trafienie, +10 za zabicie | deliberate (20.17), bo praca też daje XP |
| Premia poziomu | 19.1: +10% obrażeń i +5% prędkości | tylko +10% obrażeń | brak premii prędkości |
| Limit koni | 19.5: 100 na gracza | 20 | deliberate: mapa 40×40 |
| AI: robotnicy | 19.9: 6–22 zależnie od poziomu | `workersMax: 3` | uproszczenie prototypu, do zastąpienia w C4b |
| AI: pierwsza fala | 19.9: 480 s, interwał 180 s, wielkość `5+2n`, cap 40 | 480 s, interwał 150 s, `4+2n`, cap 12 | uproszczenie prototypu, C4b |
| Mapa | 19.6: 64/128/192 | 40×40 | backlog (C11) |

## Parametry ekonomii
| Parametr | Wartość | Proweniencja |
|---|---|---|
| `startRes` | drewno 300, żywność 150 | deliberate (20.2: bez bufora farma stawała na upkeepie) |
| `resCap` | drewno/żywność 500, złoto 2000, broń 200, konie 20 | projekt `[P]` (19.1); konie deliberate |
| `carry` | 10 | projekt `[P]` (19.5) |
| `chop` | 2.5/s | deliberate (20.2; w 19.5 było 2.0) |
| `mine` | 1.5/s | projekt `[P]` (19.5) |
| `butcher` | 3/s | projekt `[P]` (19.5) |
| Farma `foodRate`, `upkeep` | 0.6 żywności/s, 0.02 drewna na żywność | deliberate (20.2: model ciągły zamiast cyklu 100/5 s); sama zasada upkeepu: źródło (patch 1.02) |
| Drzewo / złoże | 100 drewna / 4×1000 złota na żyłę | projekt `[P]` (19.5) |
| Zwierzyna: mięso | bizon 150, bydło 100 | projekt `[P]` (19.5); bizony: potwierdzone w grze |
| `fogRadius`, `fogHq` | 6, 8 | projekt `[P]` (19.1) |
| Pop cap | obóz +10, dom +10, tepee +5 | projekt `[P]`; dom jako pop cap: źródło (PC Games) |
| Robotnicy startowi | 4 (Sioux: 2 squawy + 2 wojowników) | deliberate (20.2) |

## Jednostki (`CFG.units`)
Statystyki Sioux (squaw, wojownik, łucznik, medicine man, wódz) są zgodne z 19.2 `[P]`; ich role (kto buduje, rąbie, poluje, pływa) to źródło (6.2, 19.6). `wojownik.aggro` 5 i `squaw.fleesOnHit` to decyzja właściciela (brak danych w źródłach). Osadnicy: `piechota`, `jezdiec` wg 19.2 `[P]` z odchyleniami wyżej i 20.5/20.9 (jeździec strzela z konia, zasięg 4: deliberate). Desperado (`desperado`, `bandleader`, `konnobanda`): koszty i zasięgi prototypu to deliberate (przeciwnik gra standardową gospodarką), do zastąpienia modelem z `docs/zrodla.md` w C4. `aggro` (promień automatycznego naboru celu): feel. Zwierzęta (`bizon`, `bydlo`, `horse`): HP i prędkość feel (20.19).

## Walka, morale, doświadczenie, praca
| Parametr | Wartość | Proweniencja |
|---|---|---|
| Trafienie, obrażenia, mnożniki typu | wzory 19.4 | projekt `[P]`; „oskrzydlenie" uproszczone do celu w walce (20.17) |
| Pancerz | 0 dla wszystkich | brak danych, czeka na manual |
| Morale: regeneracja 0.2/s, kara za śmierć 2 w r=6, aura przywódcy 0.5/s r=6, próg paniki 30, panika 5 s | wzory 19.4 | projekt `[P]` |
| Morale: `restRegen` 1.0 przy braku wroga w 10, `hitPenalty` 1, `fleeBreak` 30 s, aura obozu 0.5/s r=8 | | deliberate (20.4) |
| Śmierć wodza −30 morale armii | | źródło co do faktu (19.2), wartość `[P]` |
| `work.xpRate` 0.5/s, `work.moraleMin` 0.6 | | feel; mechanizm: źródło (Gameswelt) |
| Deszcz (+100%, 60 s, odnowienie 180 s), burza (r=3, 10 obr./s, 5 s, −20 morale, odnowienie 120 s) | | projekt `[P]` (19.4); fakt zdolności: źródło |

## Budynki i technologie
Budynki (dom, farma, magazyn, fabryka, zagroda, tepee) zgodnie z 19.3 `[P]`. Koszary (100 drewna + 40 złota, 40 s, 300 HP) nie występują w tabeli 19.3: wartość feel. Technologie (siekiery, pług, selekcja koni, sztauga) zgodne z 19.4 `[P]`.

## AI (`CFG.ai`)
`thinkEvery` 2 s, `startRes`, `trainCap` 3, `buildR` 6, `farmsPer` 5: feel. `workersMax`, `armyBase/Grow/Cap`, `attackCooldown`: patrz odchylenia wyżej.


## Poziomy trudności AI (C2) [P]
Źródło kształtu: tabela 19.9 (robotnicy AI 6/10/14/18/22, interwał fal 300/240/180/150/120 s, „bardzo łatwy: nie atakuje budynków, kapituluje szybko" `[Ź]`).
Prototyp ma słabszą bazę AI niż ta tabela (3 robotników, wyprawa po 480 s co 150 s), więc **normalny = dotychczasowe wartości** (punkt odniesienia balansu z `ROADMAP.md` §6, wyniki 5 seedów bez zmian), a pozostałe poziomy skalują je proporcjami z tabeli:

| Poziom | robotnicy | wojsko bazowe | mnożnik przerwy | pierwsza wyprawa [s] | budynki |
|---|---|---|---|---|---|
| Bardzo łatwy | 2 | 3 | ×1.67 | 800 | armia ich nie rusza |
| Łatwy | 2 | 3 | ×1.33 | 640 | tak |
| Normalny | 3 | 4 | ×1.00 | 480 | tak |
| Trudny | 4 | 5 | ×0.83 | 400 | tak |
| Bardzo trudny | 5 | 6 | ×0.67 | 320 | tak |

Nie zrobione: kapitulacja AI na „bardzo łatwym", zwiadowca przed falą, mikro (słabe/standardowe/koncentracja ognia), niszczenie gospodarki na „trudnym" (C4b). Poziomy nie mają jeszcze pomiaru balansu (N ≥ 20 na poziom), więc ich realna trudność jest nieznana.


## Osadnicy, faza 7 [P]
| Parametr | Wartość | Uwaga |
|---|---|---|
| Armata, koszt | 150 złota + 100 drewna, 60 s | Sprzeczność w dokumentacji 19.2/19.3: tabela jednostek mówi 150 Zł + 100 D, wiersz fabryki 50 D + 100 Zł. Przyjęta tabela jednostek |
| Armata, cd 3.0 s, zasięg 12, HP 150, szybkość 0.6 | | cd `[P]`; reszta z 19.2 |
| Armata, obszar | promień 1.5, połowa obrażeń, bez rzutu na trafienie, bez friendly fire | `[P]` (doc podaje tylko „obsz.") |
| Bank | 1 złoto/s, +500 limitu złota, limit 5 od startu budowy | `[P]` z 19.3; 5 banków daje 5 złota/s, więc ablacja bankowa jest wymagana przed uznaniem wartości |
| Ranczo | +150 limitu żywności | hisgames podaje 80 `[Ź niska wiarygodność]` |
| Szeryf | 60 Ż, 40 Zł, 1 broń, 30 s, HP 70, dmg 15, zasięg 6, wzrok 10, aura jak przywódca (0.5 morale/s w promieniu 6) | wzrok i aura jako fakt `[Ź]`, liczby `[P]`; doc podaje +10 w promieniu 5, w prototypie aura działa jak u bandleadera |
| Frontiersman | buduje, kopie złoto, poluje, walczy wręcz; 30 Ż, 15 s, HP 50 | role `[Ź]` „buduje", kto kopie `[P]` |
| Frontierswoman | farmi i rąbi, nie buduje; 25 Ż, 12 s, HP 40, ucieka po trafieniu | `[Ź]` role, ucieczka jak squaw `[P]` |
| Start Osadników | 2 frontiersmani + 2 frontierswomen | skład `[P]`; wpływa na tempo ekonomii (pierwsza piechota 238 s vs 314 s przy starym starcie 4×robotnik) |
| Limit populacji | 200 | `[Ź]` |

Jednostka `worker` zostaje jako ogólny robotnik Desperado (AI) do fazy 11.

## Faza 12: widzenie, tepee, wozy `[P]` (do korekty z pamięci gracza)
| Parametr | Wartość | Status |
|---|---|---|
| Pole widzenia `sight` (kafle): wojownik, łucznik, medicine man Sioux | 8 | `[P]`, zasada `[Ź: pamięć gracza]`: Indianie widzą dalej, niż zaczynają atak |
| `sight` wódz Sioux | 9 | `[P]` |
| `sight` szeryf | 10 | `[Ź fakt, P wartość]` |
| `sight` konnobanda | 8 (jej `aggro` 7) | `[P]` |
| `sight` pozostałe | 6 (`CFG.fogRadius`) | `[P]` |
| Maska widzenia wroga | odświeżana co 0,25 s, budynki wroga 8 (`CFG.fogHq`) | `[P]` |
| Pakowanie i rozkładanie tepee | 5 s (`CFG.packTime`) | `[P]` |
| Travois | HP z tepee, prędkość 0,6, poza populacją | `[P]` |
| Wóz kryty | HP 120, prędkość 0,7, poza populacją | `[P]` |
