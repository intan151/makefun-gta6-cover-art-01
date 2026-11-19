// Palm Sunset Cover Studio — editor.
// Owns the page state: photo slots, caption, layout, grade, export size.
// The preview canvas redraws live; dragging pans the selected panel, the
// wheel zooms it, and Export renders the exact post size to a PNG download.

import { LAYOUTS, SIZES, drawCover, panelRects } from './cover.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

const state = {
  title: 'NEON SUNSET',
  subtitle: 'chase the golden hour',
  layout: 'trio',
  sizeKey: 'square',
  grade: 0.55,
  panels: [{}, {}, {}, {}],
};
let selected = 0;
let lastExportUrl = '';

function sizeOf() {
  return SIZES[state.sizeKey];
}

function previewDims() {
  const s = sizeOf();
  const scale = 880 / Math.max(s.w, s.h);
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function renderPreview() {
  const d = previewDims();
  preview.width = d.w;
  preview.height = d.h;
  // Draw at preview resolution through the same renderer.
  const off = document.createElement('canvas');
  drawCover(off, state, d.w, d.h);
  pctx.clearRect(0, 0, d.w, d.h);
  pctx.drawImage(off, 0, 0);
  drawSelection();
}

function drawSelection() {
  const rects = panelRects(state.layout, preview.width, preview.height, state.sizeKey);
  const r = rects[selected];
  if (!r) return;
  pctx.save();
  pctx.strokeStyle = '#19e3d6';
  pctx.lineWidth = 3;
  pctx.setLineDash([10, 6]);
  pctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
  pctx.setLineDash([]);
  pctx.fillStyle = '#19e3d6';
  pctx.font = '600 13px system-ui, sans-serif';
  pctx.textAlign = 'left';
  pctx.fillText(`PANEL ${selected + 1} — drag to move, scroll to zoom`, r.x, r.y - 8);
  pctx.restore();
}

function refreshSlots() {
  const wrap = $('slots');
  wrap.innerHTML = '';
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) {
    const p = state.panels[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot' + (i === selected ? ' active' : '');
    btn.textContent = p.img ? `Panel ${i + 1} ✓ photo` : `Panel ${i + 1} · empty`;
    btn.addEventListener('click', () => { selected = i; renderPreview(); refreshSlots(); });
    wrap.appendChild(btn);
  }
  $('slotHint').textContent = `Panel ${selected + 1} selected — upload a photo into it, or drag it on the preview.`;
}

function loadImageFile(file, slot) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.panels[slot] = { img, zoom: 1, ox: 0, oy: 0 };
      URL.revokeObjectURL(url);
      renderPreview();
      refreshSlots();
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
}

function loadSample(slot) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      state.panels[slot] = { img, zoom: 1, ox: 0, oy: 0 };
      renderPreview();
      refreshSlots();
      resolve();
    };
    img.onerror = reject;
    img.src = 'samples/sunset-boulevard.jpg';
  });
}

async function fillAllWithSample() {
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) await loadSample(i);
  // Offset each panel's crop so the same photo reads differently per panel.
  state.panels.forEach((p, i) => {
    if (!p.img) return;
    p.zoom = 1.35;
    p.ox = (i - 1) * 40;
    p.oy = (i % 2 === 0 ? -18 : 14);
  });
  renderPreview();
}

function exportPNG() {
  const s = sizeOf();
  const off = document.createElement('canvas');
  drawCover(off, state, s.w, s.h);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      lastExportUrl = url;
      const a = document.createElement('a');
      a.href = url;
      a.download = `palm-sunset-cover-${s.w}x${s.h}.png`;
      a.click();
      const shot = $('lastExport');
      shot.src = url;
      shot.hidden = false;
      $('exportNote').textContent = `Exported ${s.w} × ${s.h} PNG — ${Math.round(blob.size / 1024)} KiB.`;
      resolve(url);
    }, 'image/png');
  });
}

// --- Controls -------------------------------------------------------------
$('titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
$('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
$('gradeInput').addEventListener('input', (e) => {
  state.grade = Number(e.target.value);
  $('gradeValue').textContent = `${Math.round(state.grade * 100)}%`;
  renderPreview();
});

document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    selected = 0;
    document.querySelectorAll('[data-layout]').forEach((x) => x.classList.toggle('active', x === b));
    renderPreview();
    refreshSlots();
  });
});

document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => {
    state.sizeKey = b.dataset.size;
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
    renderPreview();
  });
});

$('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) await loadImageFile(file, selected);
  e.target.value = '';
});
$('sampleBtn').addEventListener('click', () => loadSample(selected));
$('fillAllBtn').addEventListener('click', fillAllWithSample);
$('exportBtn').addEventListener('click', exportPNG);

// --- Preview interaction: click a panel to select it, drag to pan, wheel to zoom.
let dragging = false;
let lastX = 0;
let lastY = 0;

function panelAt(x, y) {
  const rects = panelRects(state.layout, preview.width, preview.height, state.sizeKey);
  const scale = preview.width / preview.clientWidth;
  const px = x * scale;
  const py = y * scale;
  return rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
}

preview.addEventListener('pointerdown', (e) => {
  const r = preview.getBoundingClientRect();
  const i = panelAt(e.clientX - r.left, e.clientY - r.top);
  if (i >= 0) {
    selected = i;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
    refreshSlots();
    renderPreview();
  }
});
preview.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = state.panels[selected];
  if (!p.img) return;
  const scale = preview.width / preview.clientWidth;
  p.ox = (p.ox || 0) + (e.clientX - lastX) * scale;
  p.oy = (p.oy || 0) + (e.clientY - lastY) * scale;
  lastX = e.clientX;
  lastY = e.clientY;
  renderPreview();
});
preview.addEventListener('pointerup', () => { dragging = false; });
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selected];
  if (!p.img) return;
  p.zoom = Math.min(3, Math.max(1, (p.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.92)));
  renderPreview();
}, { passive: false });

// --- Boot -----------------------------------------------------------------
// Small handle the screenshots / tests use: load the sample, render, export.
window.__studio = {
  state,
  loadSample,
  fillAllWithSample,
  exportPNG,
  renderPreview,
  get lastExportUrl() { return lastExportUrl; },
};

(async () => {
  try {
    await document.fonts.load('400 80px Anton');
    await document.fonts.load('400 40px Pacifico');
  } catch (_) { /* fall back to system fonts; the cover still renders */ }
  await fillAllWithSample();
  renderPreview();
})();
