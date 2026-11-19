# Vice Lights Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/intan151/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/intan151/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your own photo and a caption into GTA-style poster cover art — multi-panel layouts, a Vice City sunset or neon colour grade, bold condensed lettering — and exports it as a PNG to share. Made for the [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

## How it works

1. **Add photos** from your machine (or try the two built-in samples). Photos are read locally and never uploaded anywhere.
2. **Pick a layout** — Solo, Split Duo, Hero Trio, or Quad Grid — and click a photo in the strip to place it in the selected panel. Click a panel to select it, drag the photo to move it, use the zoom slider to crop it. One photo can fill every panel, or each panel can hold a different one.
3. **Pick a colour grade** — Vice Sunset, Neon Nights, Palm Dusk, or Midnight Noir.
4. **Write the caption** — big condensed Anton lettering with a dark outline — plus an optional neon script subtitle, size and top/bottom placement.
5. **Export a PNG** in 1080 × 1080, 1080 × 1350, or 1920 × 1080.

## Run it

No build step, no network. Serve `app/` with any static server and open it in desktop Chrome:

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

Or open `app/index.html` through any static file server. The app's fonts (Anton and Pacifico, both under the SIL Open Font License — see `app/fonts/OFL-Anton.txt` and `app/fonts/OFL-Pacifico.txt`) and sample photos are all files under `app/`, so it works fully offline.

## Originality

Everything here is original work. There is no Rockstar Games logo, wordmark, official artwork, character, or font anywhere in the app. The display typefaces are Anton and Pacifico, shipped under the SIL Open Font License, and the two sample photos (`app/samples/`) are the kit's AI-made samples, free to use.

## Files

- `main.ts` — the Node 22 entrypoint; copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.
- `app/index.html`, `app/style.css` — the editor page and its styles.
- `app/src/poster.js` — the cover renderer (panels, grades, lettering).
- `app/src/main.js` — the editor wiring (photos, drag-to-crop, export).
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor` / `?shot=cover`).
- `app/fonts/` — Anton and Pacifico, SIL OFL.
- `app/samples/` — pier and boulevard sample photos.
- `screenshots/` — the cover and the editor, rendered by the app itself.
- `vendor/makefun-app.ts` — the kit's make.fun library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
