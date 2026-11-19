[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01/)
[![rank](https://make.fun/badge/gta6-cover-art-01/intan151/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01/)
[![reward](https://make.fun/badge/gta6-cover-art-01/intan151/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01/)

# Palm Sunset Cover Studio

A GTA-style cover art maker for the [make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01/).
Turn your photo and a caption into multi-panel poster cover art with a Vice City
neon-sunset grade — fully offline in your browser, exported as a PNG ready to post.

## What it does

- **Any photo** — upload your own photo into any panel, or use the built-in
  sample sunset photo. Drag a photo to reposition it, scroll to zoom it.
- **Multi-panel covers** — three layouts: Trio (three tall panels), Hero + Duo
  (one big panel over two), and Four Grid (2×2). One photo can fill every panel
  with a different crop, or each panel can hold its own photo.
- **Bold caption lettering** — a big condensed title (Anton) with a neon pink
  drop and teal echo, plus a script subtitle (Pacifico) in gold.
- **Vice City sunset grade** — warm orange-to-pink wash, teal shadows, a retro
  slatted sun, skyline strip and stars, with a grade-strength slider.
- **One-click export** — PNG at 1080 × 1080, 1080 × 1350, or 1920 × 1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `app/` is plain static files (HTML + CSS + ES modules),
every font and image it loads lives under `app/`, and photos are read on your own
machine — nothing is ever uploaded.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22+, standard library only) copies `app/` and `screenshots/` to
the output directory and writes `dossier.json` with the kit's vendored
`buildDossier` library (`vendor/makefun-app.ts`).

## Originality

All artwork and code are original. No Rockstar Games logo, wordmark, official
artwork, character, or font appears anywhere. The title font Anton and the script
font Pacifico are licensed under the SIL Open Font License (texts in
`app/fonts/`). The sample photo `app/samples/sunset-boulevard.jpg` is original
artwork generated for this entry — it shows no real person.

## Layout

```
app/
  index.html            editor page
  style.css             editor chrome
  src/
    main.js             editor state, uploads, drag/zoom, export
    cover.js            cover renderer: layouts, grade, lettering
  fonts/                Anton + Pacifico (OFL) + licence texts
  samples/              built-in sample photo
screenshots/            real renders of the app and its exports
main.ts                 entry program (Node 22, stdlib only)
serve.ts                local dev server
vendor/makefun-app.ts   kit library, unchanged
```

## License

MIT — see [LICENSE](LICENSE).
