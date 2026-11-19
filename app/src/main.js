// Vice Coast Cover Studio — editor wiring.
// Photos never leave the machine: FileReader object URLs + canvas only.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js),
// and `?selftest=1` renders every export size and reports the exact pixels.
import { drawCover, renderExport, GRADES, LAYOUTS, EXPORT_SIZES, layoutRects } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

// ---- state ----
const state = {
  layout: 'trio',
  grade: 'sunset',
  caption: 'Sunset Heist',
  subcaption: 'One last score in the sunshine state',
  captionPos: 'bottom',
  captionScale: 1,
  badge: true,
  panels: [{ img: null, zoom: 1, ox: 0, oy: 0 }],
};
let photos = []; // {name, img, url}
let selectedPanel = 0;
let exportSize = EXPORT_SIZES[0];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

function syncPanels() {
  const n = panelCount();
  while (state.panels.length < n) state.panels.push({ img: null, zoom: 1, ox: 0, oy: 0 });
  state.panels.length = n;
  selectedPanel = Math.min(selectedPanel, n - 1);
}

/** Preview canvas follows the export aspect, capped for the screen. */
function sizePreview() {
  const maxW = 620;
  const maxH = 620;
  const scale = Math.min(maxW / exportSize.w, maxH / exportSize.h);
  canvas.width = Math.round(exportSize.w * scale);
  canvas.height = Math.round(exportSize.h * scale);
}

function redraw() {
  sizePreview();
  drawCover(canvas, state, canvas.width, canvas.height);
  document.querySelectorAll('#layout-list button').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.layout);
  });
  document.querySelectorAll('#grade-list button').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.grade);
  });
  document.querySelectorAll('#panel-list button').forEach((b, i) => {
    const p = state.panels[i];
    b.style.display = p ? '' : 'none';
    b.classList.toggle('active', i === selectedPanel);
    b.textContent = `Panel ${i + 1}${p && p.img ? ' ●' : ' ○'}`;
  });
  $('zoom').value = state.panels[selectedPanel].zoom;
  $('zoom-val').textContent = `${Math.round(state.panels[selectedPanel].zoom * 100)}%`;
}

// ---- photo library ----
function renderLibrary() {
  const strip = $('library');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = p.name;
    const im = document.createElement('img');
    im.src = p.url;
    im.alt = p.name;
    b.appendChild(im);
    b.addEventListener('click', () => {
      state.panels[selectedPanel] = { img: p.img, zoom: 1, ox: 0, oy: 0 };
      redraw();
    });
    strip.appendChild(b);
  });
  $('photo-count').textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} loaded`;
}

async function addFiles(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (photos.length >= 8) break;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      photos.push({ name: file.name, img, url });
      added += 1;
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  if (added) {
    renderLibrary();
    // Fill empty panels with the new photos in order.
    let pi = 0;
    for (let i = 0; i < state.panels.length && pi < photos.length; i += 1) {
      if (!state.panels[i].img) state.panels[i].img = photos[pi].img;
      pi += 1;
    }
    if (!state.panels.some((p) => p.img)) state.panels[0].img = photos[0].img;
    redraw();
  }
  return added;
}

$('photo').addEventListener('change', (e) => addFiles(e.target.files));
$('sample-pier').addEventListener('click', async () => {
  const img = await loadImage('samples/pier.jpg');
  photos.push({ name: 'pier.jpg (sample)', img, url: 'samples/pier.jpg' });
  renderLibrary();
  state.panels[0].img = img;
  redraw();
});
$('sample-boulevard').addEventListener('click', async () => {
  const img = await loadImage('samples/boulevard.jpg');
  photos.push({ name: 'boulevard.jpg (sample)', img, url: 'samples/boulevard.jpg' });
  renderLibrary();
  state.panels[0].img = img;
  redraw();
});

// ---- layout / grade / caption controls ----
function buildButtons(containerId, items, get, set) {
  const box = $(containerId);
  box.innerHTML = '';
  Object.entries(items).forEach(([id, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.label;
    b.dataset.id = id;
    b.addEventListener('click', () => {
      set(id);
      box.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.id === get()));
      redraw();
    });
    box.appendChild(b);
  });
  box.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.id === get()));
}

buildButtons('layout-list', LAYOUTS, () => state.layout, (id) => {
  state.layout = id;
  syncPanels();
});
buildButtons('grade-list', GRADES, () => state.grade, (id) => { state.grade = id; });

const panelBox = $('panel-list');
panelBox.innerHTML = '';
for (let i = 0; i < 4; i += 1) {
  const b = document.createElement('button');
  b.type = 'button';
  b.addEventListener('click', () => {
    selectedPanel = i;
    redraw();
  });
  panelBox.appendChild(b);
}
syncPanels();

$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('subcaption').addEventListener('input', (e) => { state.subcaption = e.target.value; redraw(); });
$('caption-size').addEventListener('input', (e) => {
  state.captionScale = Number(e.target.value);
  $('caption-size-val').textContent = `${Math.round(state.captionScale * 100)}%`;
  redraw();
});
$('caption-pos').addEventListener('change', (e) => { state.captionPos = e.target.value; redraw(); });
$('badge').addEventListener('change', (e) => { state.badge = e.target.checked; redraw(); });
$('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});
$('reset-crop').addEventListener('click', () => {
  const p = state.panels[selectedPanel];
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  redraw();
});

const sizeSel = $('export-size');
EXPORT_SIZES.forEach((s) => {
  const o = document.createElement('option');
  o.value = s.id;
  o.textContent = s.label;
  sizeSel.appendChild(o);
});
sizeSel.addEventListener('change', (e) => {
  exportSize = EXPORT_SIZES.find((s) => s.id === e.target.value) ?? EXPORT_SIZES[0];
  redraw();
});

// ---- drag to pan / wheel to zoom the selected panel ----
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
function hitPanel(p) {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = hitPanel(p);
  if (i < 0) return;
  selectedPanel = i;
  const panel = state.panels[i];
  drag = { x: p.x, y: p.y, ox: panel.ox, oy: panel.oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[selectedPanel];
  const rect = layoutRects(state.layout, canvas.width, canvas.height)[selectedPanel];
  panel.ox = drag.ox + (p.x - drag.x) / rect.w;
  panel.oy = drag.oy + (p.y - drag.y) / rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selectedPanel];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// ---- export ----
$('export').addEventListener('click', () => {
  const out = renderExport(state, exportSize);
  out.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${exportSize.w}x${exportSize.h}.png`;
    a.click();
    statusEl.textContent = `Saved ${a.download} (${exportSize.w} × ${exportSize.h} PNG)`;
  }, 'image/png');
});

// ---- shot / selftest modes ----
const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  runShot(params.get('shot'), params, async (photoName, text, opts) => {
    const img = await loadImage(`samples/${photoName}.jpg`);
    photos = [{ name: `${photoName}.jpg (sample)`, img, url: `samples/${photoName}.jpg` }];
    renderLibrary();
    state.layout = opts.layout ?? 'trio';
    state.grade = opts.grade ?? 'sunset';
    state.caption = text;
    state.subcaption = opts.subcaption ?? state.subcaption;
    state.captionPos = opts.captionPos ?? 'bottom';
    syncPanels();
    state.panels[0].img = img;
    if (state.panels[1]) state.panels[1].img = img;
    if (state.panels[2]) state.panels[2].img = img;
    if (state.panels[3]) state.panels[3].img = img;
    // Vary the crops so panels do not mirror each other.
    if (state.panels[1]) { state.panels[1].zoom = 1.4; state.panels[1].ox = 0.12; }
    if (state.panels[2]) { state.panels[2].zoom = 1.3; state.panels[2].oy = -0.08; }
    if (state.panels[3]) { state.panels[3].zoom = 1.5; state.panels[3].ox = -0.1; }
    if (opts.size) {
      exportSize = EXPORT_SIZES.find((s) => s.id === opts.size) ?? exportSize;
      sizeSel.value = exportSize.id;
    }
    redraw();
  });
} else if (params.get('selftest')) {
  (async () => {
    await document.fonts.ready;
    const results = [];
    const img = await loadImage('samples/pier.jpg');
    state.panels[0].img = img;
    for (const size of EXPORT_SIZES) {
      const out = renderExport(state, size);
      const ok = out.width === size.w && out.height === size.h;
      const url = out.toDataURL('image/png');
      results.push(`${size.id}: ${out.width}x${out.height} png=${url.startsWith('data:image/png')} ${ok ? 'OK' : 'FAIL'}`);
    }
    const el = document.createElement('pre');
    el.id = 'selftest';
    el.textContent = results.join('\n');
    document.body.appendChild(el);
    window.__shotReady = true;
  })();
} else {
  redraw();
}
