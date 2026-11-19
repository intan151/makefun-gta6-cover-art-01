[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/intan151/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/intan151/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Coast Cover Studio

Turn your photo + a caption into GTA-style multi-panel poster cover art, and export it as a PNG to share. Built for the [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

Everything runs offline in a desktop browser from the static files under `app/` — your photos never leave your machine. No Rockstar Games logo, wordmark, artwork, character, or font is used anywhere; the lettering is set in Anton and Bebas Neue, both shipped under the SIL Open Font License (see `app/fonts/`).

## How it works

1. Add photos from your machine (up to 8), or try the two included sample photos.
2. Pick a panel layout — Solo, Duo, Trio, or Quad — and click a photo to fill each panel.
3. Drag a photo on the preview to move it, scroll (or use the zoom slider) to crop it.
4. Type a caption and tagline, set the size and position, pick a colour grade (Sunset / Neon / Vice).
5. Choose an export size — 1080 × 1080, 1080 × 1350, or 1920 × 1080 — and hit **Export PNG**.

## Try it

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

Or open `app/index.html` directly in desktop Chrome — it works offline with zero network requests.

## Verify the exports

```sh
# Render every export size headlessly and report exact pixels:
# open app/index.html?selftest=1 in a browser and read the report it prints.
```

## Layout

- `main.ts` — Node 22 program: copies `app/` and `screenshots/` to the output dir and writes `dossier.json` (via `vendor/makefun-app.ts`, copied from the kit unchanged).
- `serve.ts` — tiny static server for local testing.
- `app/` — the offline web app (`index.html`, `style.css`, `src/cover.js` cover engine, `src/main.js` editor, `src/shots.js` screenshot scenes, `fonts/` OFL fonts, `samples/` two sample photos).
- `screenshots/` — 3–4 real renders: the editor with a photo loaded, plus exported covers.
- `shots.json` — the scenes used to take the screenshots.

## License

MIT — see [LICENSE](LICENSE).
