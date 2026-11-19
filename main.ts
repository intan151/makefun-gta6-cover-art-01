// main.ts — the entrypoint for Vice Lights Cover Studio (Node 22, standard
// library only). The app itself is plain static files under app/: a desktop
// browser loads app/index.html offline and the editor runs entirely on the
// person's own machine. This program just hands the app in: it copies app/
// and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with the vendored make.fun library, the
// summary the judge reads. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyIfPresent(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyIfPresent('app');
copyIfPresent('screenshots');

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes
// the dossier text; the others refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files in app/
// or 48 MiB of app files in all, or a path under app/ over 1000 bytes).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
