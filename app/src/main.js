// main.js — wires the Vice Lights Cover Studio editor: photos, layouts,
// grades, caption, per-panel crop, and PNG export. A `?shot=` query sets
// up a fixed scene for a screenshot instead (see shots.js).

import { drawPoster, EXPORT_SIZES, LAYOUTS, panelRects } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const statusEl = document.getElementById('status');
const stripEl = document.getElementById('photo-strip');
const zoomEl = document.getElementById('zoom');
const zoomVal = document.getElementById('zoom-val');
const panelHint = document.getElementById('panel-hint');

const state = {
  layout: 'trio',
  grade: 'sunset',
  caption: 'Vice Lights',
  subtitle: 'Neon Coast',
  captionSize: 1,
  captionPos: 'bottom',
  exportSize: '1080x1080',
  panels: [], // { photo, zoom, ox, oy } per panel slot
  photos: [], // { name, img } in load order
  selected: 0,
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function ensurePanels() {
  while (state.panels.length < panelCount()) {
    state.panels.push({ photo: state.photos[0]?.img ?? null, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = panelCount();
  if (state.selected >= panelCount()) state.selected = 0;
}

function resizeCanvas() {
  const size = EXPORT_SIZES[state.exportSize];
  canvas.width = size.w;
  canvas.height = size.h;
}

export function redraw() {
  ensurePanels();
  resizeCanvas();
  drawPoster(canvas, state);
  const pan = state.panels[state.selected];
  zoomEl.value = String(Math.round((pan?.zoom ?? 1) * 100));
  zoomVal.textContent = `${Math.round((pan?.zoom ?? 1) * 100)}%`;
  panelHint.textContent = `Panel ${state.selected + 1} of ${panelCount()} — drag the photo to move it, or use the zoom slider.`;
  stripEl.querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('active', state.panels[state.selected]?.photo === state.photos[i]?.img);
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function addPhoto(name, img) {
  state.photos.push({ name, img });
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb';
  btn.title = name;
  const thumb = document.createElement('img');
  thumb.src = img.src;
  thumb.alt = name;
  btn.appendChild(thumb);
  btn.addEventListener('click', () => {
    ensurePanels();
    state.panels[state.selected].photo = img;
    redraw();
  });
  stripEl.appendChild(btn);
  // A fresh photo fills any empty panel, so the cover is never blank.
  ensurePanels();
  state.panels.forEach((p) => {
    if (!p.photo) p.photo = img;
  });
  redraw();
}

async function addPhotoFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  addPhoto(file.name, img);
}

async function addSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  addPhoto(`${name}.jpg`, img);
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// --- controls -----------------------------------------------------------

document.getElementById('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      await addPhotoFile(file);
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  e.target.value = '';
});
document.getElementById('sample-pier').addEventListener('click', () => addSample('pier'));
document.getElementById('sample-boulevard').addEventListener('click', () => addSample('boulevard'));

document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('caption-size').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value) / 100;
  document.getElementById('caption-size-val').textContent = `${e.target.value}%`;
  redraw();
});
document.getElementById('caption-pos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});
document.getElementById('export-size').addEventListener('change', (e) => {
  state.exportSize = e.target.value;
  redraw();
});

zoomEl.addEventListener('input', () => {
  ensurePanels();
  state.panels[state.selected].zoom = Number(zoomEl.value) / 100;
  redraw();
});
document.getElementById('fill-all').addEventListener('click', () => {
  ensurePanels();
  const img = state.panels[state.selected]?.photo;
  if (!img) return;
  state.panels.forEach((p) => { p.photo = img; });
  redraw();
  setStatus('All panels now use the selected photo.');
});

// --- panel picking and dragging ------------------------------------------

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit === -1) return;
  state.selected = hit;
  const pan = state.panels[hit];
  drag = { x: p.x, y: p.y, ox: pan.ox, oy: pan.oy, rect: rects[hit] };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const pan = state.panels[state.selected];
  pan.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (p.x - drag.x) / drag.rect.w));
  pan.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (p.y - drag.y) / drag.rect.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// --- export ---------------------------------------------------------------

export async function exportPNG(sizeKey) {
  const size = EXPORT_SIZES[sizeKey ?? state.exportSize];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawPoster(off, { ...state, panels: state.panels.slice(0, LAYOUTS[state.layout].panels) });
  return new Promise((resolve) => {
    off.toBlob((blob) => resolve({ blob, w: size.w, h: size.h }), 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  const { blob, w, h } = await exportPNG();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-lights-${w}x${h}.png`;
  a.click();
  setStatus(`Exported vice-lights-${w}x${h}.png — ${w} × ${h}.`);
});

// Test hook for the screenshot scenes and the build checks.
window.__viceLights = { state, redraw, exportPNG, loadImage, addSample };

// --- start -----------------------------------------------------------------

async function boot() {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch {
    // The fallback fonts still draw; the cover just loses its display face.
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, redraw);
  } else {
    await addSample('pier');
    redraw();
  }
}

boot();
