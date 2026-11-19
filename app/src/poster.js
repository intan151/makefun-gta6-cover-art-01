// poster.js — the cover renderer for Vice Lights Cover Studio.
//
// A cover is a white-framed poster: one to four photo panels, a colour
// grade washed over the whole sheet, and a big condensed caption with an
// optional neon script subtitle. Everything is drawn on a 2D canvas, so
// the preview on screen and the exported PNG are the same drawing.

export const LAYOUTS = {
  solo: { label: 'Solo', panels: 1 },
  duo: { label: 'Split Duo', panels: 2 },
  trio: { label: 'Hero Trio', panels: 3 },
  quad: { label: 'Quad Grid', panels: 4 },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    wash: ['#ff9a3d', '#ff4d6d', '#7b2fbe'],
    tint: 'rgba(255, 122, 26, 0.16)',
    glow: 'rgba(255, 120, 40, 0.55)',
    accent: '#ffd166',
    sun: true,
  },
  neon: {
    label: 'Neon Nights',
    wash: ['#ff2ea6', '#7b2fff', '#00e5ff'],
    tint: 'rgba(255, 46, 166, 0.14)',
    glow: 'rgba(255, 46, 166, 0.75)',
    accent: '#00e5ff',
    sun: false,
  },
  dusk: {
    label: 'Palm Dusk',
    wash: ['#00b3a6', '#ffb347', '#ff5e62'],
    tint: 'rgba(0, 179, 166, 0.14)',
    glow: 'rgba(255, 179, 71, 0.5)',
    accent: '#ffe66d',
    sun: true,
  },
  noir: {
    label: 'Midnight Noir',
    wash: ['#8d99ae', '#2b2d42', '#0d0d1a'],
    tint: 'rgba(40, 60, 120, 0.18)',
    glow: 'rgba(140, 160, 255, 0.5)',
    accent: '#edf2f4',
    sun: false,
  },
};

export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

const GUTTER = 0.014; // white gap between panels, as a share of the short side

/** Panel rectangles for a layout, in canvas pixels. */
export function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(Math.min(w, h) * GUTTER));
  const x0 = g, y0 = g, x1 = w - g, y1 = h - g;
  const full = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  if (layout === 'solo') return [full];
  if (layout === 'duo') {
    const half = (full.w - g) / 2;
    return [
      { x: x0, y: y0, w: half, h: full.h },
      { x: x0 + half + g, y: y0, w: half, h: full.h },
    ];
  }
  if (layout === 'trio') {
    const heroH = (full.h - g) * 0.62;
    const botY = y0 + heroH + g;
    const botH = full.h - heroH - g;
    const half = (full.w - g) / 2;
    return [
      { x: x0, y: y0, w: full.w, h: heroH },
      { x: x0, y: botY, w: half, h: botH },
      { x: x0 + half + g, y: botY, w: half, h: botH },
    ];
  }
  // quad: a 2 x 2 grid
  const halfW = (full.w - g) / 2;
  const halfH = (full.h - g) / 2;
  return [
    { x: x0, y: y0, w: halfW, h: halfH },
    { x: x0 + halfW + g, y: y0, w: halfW, h: halfH },
    { x: x0, y: y0 + halfH + g, w: halfW, h: halfH },
    { x: x0 + halfW + g, y: y0 + halfH + g, w: halfW, h: halfH },
  ];
}

let noiseTile = null;
/** A small tile of random grey noise, reused as the grain overlay. */
function grainTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement('canvas');
  t.width = 140;
  t.height = 140;
  const c = t.getContext('2d');
  const data = c.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 40);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  noiseTile = t;
  return t;
}

/** Draws one photo into a panel, cover-fit, with the panel's pan/zoom. */
function drawPanelPhoto(ctx, img, rect, pan) {
  const { zoom, ox, oy } = pan;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Washes the grade's colours over the whole sheet and adds grain. */
function washGrade(ctx, w, h, grade) {
  ctx.save();
  // Warm wash, strongest at the bottom where the caption sits.
  const wash = ctx.createLinearGradient(0, 0, w * 0.4, h);
  wash.addColorStop(0, 'rgba(0,0,0,0)');
  wash.addColorStop(0.55, grade.wash[0] + '33');
  wash.addColorStop(0.85, grade.wash[1] + '55');
  wash.addColorStop(1, grade.wash[2] + '66');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
  // A low sun for the sunset grades.
  if (grade.sun) {
    const sun = ctx.createRadialGradient(w * 0.74, h * 0.2, 0, w * 0.74, h * 0.2, w * 0.3);
    sun.addColorStop(0, 'rgba(255, 214, 130, 0.5)');
    sun.addColorStop(0.5, 'rgba(255, 140, 60, 0.18)');
    sun.addColorStop(1, 'rgba(255, 140, 60, 0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
  }
  // Vignette to pull the eye to the middle.
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(8, 2, 18, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 18, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  // Film grain.
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Splits the caption into at most two lines that fit the width. */
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
      lines[1] = `${lines[1]} ${word}`;
    }
  }
  return lines;
}

/** Draws the caption, subtitle and corner tag on top of the panels. */
function drawLettering(ctx, w, h, grade, caption, subtitle, sizeScale, position) {
  const text = caption.trim().toUpperCase();
  const maxW = w * 0.88;
  let size = Math.round(Math.min(w, h) * 0.115 * sizeScale);
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  let lines = wrapCaption(ctx, text, maxW);
  while (lines.length > 2 && size > 18) {
    size = Math.round(size * 0.92);
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    lines = wrapCaption(ctx, text, maxW);
  }
  while (lines.some((l) => ctx.measureText(l).width > maxW) && size > 18) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  const lineH = size * 1.04;
  const blockH = lines.length * lineH;
  const sub = subtitle.trim();
  const subSize = Math.round(size * 0.42);
  const gap = size * 0.35;
  const totalH = blockH + (sub ? subSize + gap : 0);
  const bottom = position === 'top';
  const baseY = bottom
    ? h * 0.055 + totalH - lineH * 0.5
    : h - h * 0.055 - totalH + lineH * 0.5;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // Subtitle first, in the grade's accent colour, tilted like a neon sign.
  if (sub) {
    ctx.save();
    ctx.translate(w / 2, (bottom ? baseY - blockH / 2 - gap : baseY + blockH / 2 + gap));
    ctx.rotate(-0.03);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = size * 0.18;
  ctx.strokeStyle = 'rgba(16, 4, 28, 0.92)';
  ctx.lineWidth = Math.max(3, size * 0.085);
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, i) => {
    const y = baseY - (lines.length - 1) * lineH * 0.5 + i * lineH;
    ctx.strokeText(line, w / 2, y);
    ctx.fillText(line, w / 2, y);
  });
  ctx.restore();

  // Small corner tag, the studio's own mark — never a game logo.
  ctx.save();
  ctx.font = `${Math.max(11, Math.round(Math.min(w, h) * 0.018))}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 6;
  const tag = '★  NEON COAST';
  ctx.fillText(tag, w * 0.028, h * 0.022);
  ctx.restore();
}

/**
 * Draws a whole cover onto `canvas` at its own pixel size.
 * `state` holds: layout, grade, caption, subtitle, captionSize, captionPos,
 * and panels: [{ photo: HTMLImageElement | null, zoom, ox, oy }, ...].
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = panelRects(state.layout, w, h);

  // White poster board, then the panels sit on it with gutters showing.
  ctx.fillStyle = '#fdf7ef';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((rect, i) => {
    const pan = state.panels[i] ?? { photo: null, zoom: 1, ox: 0, oy: 0 };
    if (pan.photo) {
      drawPanelPhoto(ctx, pan.photo, rect, pan);
    } else {
      const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      empty.addColorStop(0, '#3a1c5c');
      empty.addColorStop(1, '#12081f');
      ctx.fillStyle = empty;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = `${Math.round(Math.min(rect.w, rect.h) * 0.06)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
  });

  washGrade(ctx, w, h, grade);
  drawLettering(ctx, w, h, grade, state.caption, state.subtitle, state.captionSize, state.captionPos);

  // Thin inner rule to finish the poster frame.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
  ctx.strokeRect(
    Math.min(w, h) * 0.012,
    Math.min(w, h) * 0.012,
    w - Math.min(w, h) * 0.024,
    h - Math.min(w, h) * 0.024,
  );
  ctx.restore();
}
