// Vice Coast Cover Studio — cover engine.
// Draws a multi-panel, GTA-poster-style cover from the editor state onto any
// 2D canvas at any size. Everything is drawn with plain canvas calls and the
// two OFL fonts vendored under app/fonts/ (Anton + Bebas Neue). No Rockstar
// assets, no network, no external images: photos come from the user's machine.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#2a0a3d', '#c62b6e', '#ff7a3d'],
    sun: '#ffd166',
    tint: 'rgba(255, 94, 122, 0.22)',
    caption: ['#fff6a3', '#ff9e57'],
    accent: '#ff5e7a',
    scrim: 'rgba(24, 4, 36, 0.62)',
  },
  neon: {
    label: 'Neon',
    sky: ['#05081f', '#1b2a6b', '#ff2e88'],
    sun: '#37f4e4',
    tint: 'rgba(55, 244, 228, 0.15)',
    caption: ['#eafffb', '#37f4e4'],
    accent: '#37f4e4',
    scrim: 'rgba(4, 6, 28, 0.62)',
  },
  vice: {
    label: 'Vice',
    sky: ['#1c0533', '#8b1e6e', '#ff7a59'],
    sun: '#ff5da2',
    tint: 'rgba(255, 93, 162, 0.20)',
    caption: ['#ffe3f2', '#ff9ecf'],
    accent: '#ff5da2',
    scrim: 'rgba(26, 4, 48, 0.62)',
  },
};

export const LAYOUTS = {
  solo: { label: 'Solo', panels: [{ x: 0, y: 0, w: 1, h: 1 }] },
  duo: {
    label: 'Duo',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  trio: {
    label: 'Trio',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  quad: {
    label: 'Quad',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
};

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

/** Panel rects in pixels for a layout at W x H. */
export function layoutRects(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.trio;
  return layout.panels.map((p) => ({
    x: p.x * W,
    y: p.y * H,
    w: p.w * W,
    h: p.h * H,
  }));
}

/** Clamp a panel's pan offsets so the photo still covers its rect. */
function clampPan(panel, rect) {
  const img = panel.img;
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const dw = img.naturalWidth * base * panel.zoom;
  const dh = img.naturalHeight * base * panel.zoom;
  const maxX = Math.max(0, (dw - rect.w) / 2 / rect.w);
  const maxY = Math.max(0, (dh - rect.h) / 2 / rect.h);
  panel.ox = Math.max(-maxX, Math.min(maxX, panel.ox || 0));
  panel.oy = Math.max(-maxY, Math.min(maxY, panel.oy || 0));
}

let grainPattern = null;
function getGrain(ctx) {
  if (grainPattern) return grainPattern;
  const n = document.createElement('canvas');
  n.width = 140;
  n.height = 140;
  const nctx = n.getContext('2d');
  const data = nctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(n, 'repeat');
  return grainPattern;
}

/** Wrap a caption into at most two lines that fit maxWidth at the given font. */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || lines[lines.length - 1] === '') {
      lines[lines.length - 1] = trial;
    } else if (lines.length === 1) {
      lines.push(word);
    } else {
      // Second line is full: squeeze the word onto it anyway; font shrinks later.
      lines[1] = `${lines[1]} ${word}`;
    }
  }
  return lines;
}

/**
 * Draw the whole cover.
 * state: { layout, grade, caption, subcaption, captionPos ('top'|'bottom'),
 *          captionScale (0.6..1.6), badge (bool), panels: [{img, zoom, ox, oy}] }
 */
export function drawCover(canvas, state, W, H) {
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gutter = Math.max(3, Math.round(W * 0.008));

  // Sky gradient shows through the gutters and behind any empty panel.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? {};
    const px = rect.x + gutter / 2;
    const py = rect.y + gutter / 2;
    const pw = rect.w - gutter;
    const ph = rect.h - gutter;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();

    if (panel.img) {
      clampPan(panel, { w: pw, h: ph });
      const base = Math.max(pw / panel.img.naturalWidth, ph / panel.img.naturalHeight);
      const dw = panel.img.naturalWidth * base * (panel.zoom || 1);
      const dh = panel.img.naturalHeight * base * (panel.zoom || 1);
      const dx = px + (pw - dw) / 2 + (panel.ox || 0) * pw;
      const dy = py + (ph - dh) / 2 + (panel.oy || 0) * ph;
      ctx.drawImage(panel.img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = grade.sky[0];
      ctx.fillRect(px, py, pw, ph);
    }

    // Warm/cool grade wash over the photo.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(px, py, pw, ph);

    // A soft sunset glow in the biggest panel's sky: a glow, not a hard disc,
    // so it never reads as an object pasted over the subject's face.
    if (i === 0) {
      const r = Math.min(pw, ph) * 0.24;
      const sx = px + pw * 0.72;
      const sy = py + ph * 0.12;
      const glow = ctx.createRadialGradient(sx, sy, r * 0.05, sx, sy, r);
      glow.addColorStop(0, grade.sun);
      glow.addColorStop(0.5, grade.sun + '44');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = glow;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }

    // Panel frame: bright keyline + thin dark inner edge, poster style.
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, W * 0.0035);
    ctx.strokeRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, W * 0.0012);
    ctx.strokeRect(px + 3, py + 3, pw - 6, ph - 6);
  });

  // ---- Caption block ----
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subcaption || '').trim().toUpperCase();
  const bottom = (state.captionPos || 'bottom') === 'bottom';
  const zoneH = H * 0.24;
  const zoneY = bottom ? H - zoneH : 0;
  const scrim = ctx.createLinearGradient(0, zoneY, 0, zoneY + zoneH);
  if (bottom) {
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(0.45, grade.scrim);
    scrim.addColorStop(1, grade.scrim);
  } else {
    scrim.addColorStop(0, grade.scrim);
    scrim.addColorStop(0.55, grade.scrim);
    scrim.addColorStop(1, 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, zoneY, W, zoneH);

  // Accent rule next to the caption.
  const ruleY = bottom ? zoneY + zoneH * 0.16 : zoneY + zoneH * 0.84;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(W * 0.06, ruleY, W * 0.1, Math.max(3, H * 0.006));

  if (text) {
    const maxW = W * 0.88;
    // Caption area: inside the zone, clear of the tagline line.
    const subY = bottom ? H - zoneH * 0.07 : zoneY + zoneH * 0.9;
    const areaTop = bottom ? zoneY + zoneH * 0.1 : zoneY + zoneH * 0.06;
    const areaBottom = bottom ? subY - H * 0.025 : zoneY + zoneH * 0.8;
    const availH = Math.max(H * 0.05, areaBottom - areaTop);
    let size = H * 0.115 * (state.captionScale || 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let lines = [];
    for (;;) {
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
      lines = wrapCaption(ctx, text, maxW);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const blockH = lines.length * size * 1.02;
      if ((widest <= maxW && blockH <= availH) || size <= H * 0.03) break;
      size -= Math.max(2, H * 0.004);
    }
    const lineH = size * 1.02;
    const blockH = lines.length * lineH;
    const centerY = areaTop + availH / 2;
    const grad = ctx.createLinearGradient(0, centerY - blockH / 2, 0, centerY + blockH / 2);
    grad.addColorStop(0, grade.caption[0]);
    grad.addColorStop(1, grade.caption[1]);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(10, 2, 18, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    lines.forEach((line, li) => {
      const y = centerY - blockH / 2 + lineH * (li + 0.5);
      ctx.strokeText(line, W / 2, y);
      ctx.fillText(line, W / 2, y);
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (sub) {
    const subSize = Math.max(10, H * 0.021);
    ctx.font = `${subSize}px 'Bebas Neue', 'Arial Narrow', sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(2, H * 0.004)}px`;
    } catch {
      /* older canvas: ignore */
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const subY = bottom ? H - zoneH * 0.07 : zoneY + zoneH * 0.9;
    ctx.fillText(sub, W / 2, subY);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      /* ignore */
    }
  }

  // Badge ribbon, top-left, sized to fit its text, when enabled.
  if (state.badge !== false) {
    const bH = H * 0.038;
    const bx = gutter + W * 0.012;
    const by = gutter + H * 0.012;
    ctx.font = `${bH * 0.52}px 'Bebas Neue', sans-serif`;
    try {
      ctx.letterSpacing = '2px';
    } catch {
      /* ignore */
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = '★ VICE COAST';
    const bW = ctx.measureText(label).width + bH * 0.9;
    ctx.fillStyle = grade.accent;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bW, by);
    ctx.lineTo(bx + bW - bH * 0.45, by + bH);
    ctx.lineTo(bx, by + bH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#14041f';
    ctx.fillText(label, bx + bH * 0.35, by + bH / 2 + 1);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      /* ignore */
    }
  }

  // Grain + vignette for a printed-poster feel.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = getGrain(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** Render the state to a fresh canvas at exact export size and return it. */
export function renderExport(state, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state, size.w, size.h);
  return canvas;
}
