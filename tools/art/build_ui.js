// Tekstury interfejsu (faza 9): ciemne postarzone deski paneli, jaśniejsze czerwonobrązowe deski ekranów menu i pergamin z postrzępionymi brzegami pod przyciski.
// Wynik: assets/ui/*.png, używane z CSS (nie przez manifest). Uruchomienie: node tools/art/build_ui.js (wymaga SKILLS_DIR jak reszta generatora).
const L = require('./lib');
const { rt, clamp, mix } = L;

// planki poziome: kafel okresowy; ton i ziarno na planke, ciemna szpara, jaśniejszy wytarty brzeg, rzadkie rysy
function planks(size, seed, o) {
  const N = o.planks, ph = size / N;
  const grain = rt.fbm(size, seed, [0.4, 1.2]), big = rt.fbm(size, seed + 1, [3, 9]), scratch = rt.fbm(size, seed + 2, [0.15, 0.4]);
  const img = rt.makeImage(size, size, 4), R = rt.makeRng(seed);
  const tone = [], shift = [];
  for (let k = 0; k < N; k++) { tone.push(R.uniform(-1, 1)); shift.push(Math.floor(R.uniform(0, size))); }
  for (let y = 0; y < size; y++) {
    const k = Math.floor(y / ph), v = (y - k * ph) / ph;
    for (let x = 0; x < size; x++) {
      const gx = (x * 0.06 + shift[k]) | 0, i = y * size + ((x * 0.12 + shift[k]) % size | 0);   // ziarno rozciągnięte wzdłuż planki
      const g = grain[(k * 7 * size + (gx % size + size) % size + (y % 3) * size) % (size * size)] * 0.4 + grain[i % (size * size)] * 0.6;
      const t = clamp(0.5 + 0.22 * tone[k] + 0.18 * big[y * size + x] + 0.14 * g);
      let c = mix(o.dark, o.light, t);
      const edge = Math.min(v, 1 - v);
      if (edge < 0.05) c = mix(c, o.gap, 1 - edge / 0.05 * 0.2);          // szpara między deskami
      else if (edge < 0.12) c = mix(c, o.worn, (0.12 - edge) / 0.07 * 0.35);   // wytarta krawędź
      if (scratch[y * size + x] > 0.75) c = mix(c, o.worn, 0.45);
      const f = 1 + 0.07 * g;
      const d = (y * size + x) * 4;
      img.data[d] = Math.round(clamp(c[0] * f) * 255); img.data[d + 1] = Math.round(clamp(c[1] * f) * 255); img.data[d + 2] = Math.round(clamp(c[2] * f) * 255); img.data[d + 3] = 255;
    }
  }
  return img;
}
// pergamin: kremowy papier z plamami i ciemniejszym, nierównym brzegiem; alfa zerowa poza postrzępioną krawędzią
function parchment(w, h, seed) {
  const big = rt.fbm(256, seed, [3, 9]), fine = rt.fbm(256, seed + 1, [0.3, 0.9]), edgeN = rt.fbm(256, seed + 2, [0.5, 1.6]);
  const img = rt.makeImage(w, h, 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = (x / w), ny = (y / h), n = (y % 256) * 256 + (x % 256);
    const dx = Math.min(x, w - 1 - x), dy = Math.min(y, h - 1 - y), dist = Math.min(dx, dy);
    const edge = 3 + 3.2 * edgeN[n] + 2.0 * Math.sin((x + y) * 0.7 + seed);     // nierówna linia brzegu w px
    const d = (y * w + x) * 4;
    if (dist < edge - 1.5) { img.data[d + 3] = 0; continue; }
    const inner = clamp((dist - edge) / 10);
    let c = mix([0.62, 0.48, 0.30], [0.93, 0.85, 0.66], inner);                // przyciemniony brzeg
    c = mix(c, [0.80, 0.68, 0.46], clamp(0.5 + 0.25 * big[n]) * 0.4);
    const f = 1 + 0.05 * fine[n];
    img.data[d] = Math.round(clamp(c[0] * f) * 255); img.data[d + 1] = Math.round(clamp(c[1] * f) * 255); img.data[d + 2] = Math.round(clamp(c[2] * f) * 255);
    img.data[d + 3] = dist < edge ? Math.round(255 * clamp((dist - (edge - 1.5)) / 1.5)) : 255;
  }
  return img;
}
function all(lap) {
  L.writePng('ui/wood_dark.png', planks(256, 301, { planks: 4, dark: [0.17, 0.11, 0.07], light: [0.36, 0.25, 0.15], gap: [0.05, 0.03, 0.02], worn: [0.46, 0.36, 0.26] })); lap('deski ciemne');
  L.writePng('ui/wood_menu.png', planks(256, 311, { planks: 5, dark: [0.30, 0.13, 0.06], light: [0.62, 0.34, 0.16], gap: [0.08, 0.04, 0.02], worn: [0.74, 0.50, 0.30] })); lap('deski menu');
  L.writePng('ui/parchment.png', parchment(96, 88, 5)); L.writePng('ui/parchment_wide.png', parchment(180, 40, 9)); lap('pergamin');
}
module.exports = { all };
if (require.main === module) all(L.timer());
