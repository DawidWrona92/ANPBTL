# America: No Peace Beyond the Line (prototyp)

Fanowska rekonstrukcja mechaniki RTS-a z 2001 roku (Related Designs / Data Becker). Silnik to jeden plik `index.html`, grafika leży w `assets/` (PNG + `manifest.js`): otwórz `index.html` bezpośrednio z repozytorium w przeglądarce (bez serwera). Zasoby powstają z `tools/art/` (`node tools/art/build_assets.js`, wymaga skilli renderujących, `SKILLS_DIR`).

- Sterowanie i zasady: przycisk `?` w grze oraz [docs/dokumentacja-zasad.md](docs/dokumentacja-zasad.md)
- Plan dalszych prac i dziennik napraw: [ROADMAP.md](ROADMAP.md)
- Testy regresyjne: `npm install && npx playwright install chromium && npm test`
