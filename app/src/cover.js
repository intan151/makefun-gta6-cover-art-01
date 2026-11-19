// Palm Sunset Cover Studio — cover renderer.
// Draws a multi-panel GTA-poster-style cover onto any canvas: a Vice City
// neon-sunset grade, panelled photos, bold condensed title lettering and a
// skyline strip. Pure canvas 2D, no external assets, no network.

export const LAYOUTS = {
  trio: { label: 'Trio', panels: 3, hint: 'Three tall panels' },
  hero: { label: 'Hero + Duo', panels: 3, hint: 'One big panel, two below' },
  quad: { label: 'Four Grid', panels: 4, hint: 'Two by two panels' },
};

export const SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

const INK = '#fff7ec';
const PINK = '#ff2e88';
const TEAL = '#19e3d6';
const GOLD = '#ffc46b';
const DEEP = '#1b0b2e';

// Where the title band starts, as a fraction of the height, per size.
function titleTop(h, sizeKey) {
  return sizeKey === 'wide' ? h * 0.74 : h * 0.76;
}

// Panel rectangles for a layout inside the area above the title band.
export function panelRects(layout, w, h, sizeKey) {
  const top = h * 0.045;
  const bottom = titleTop(h, sizeKey) - h * 0.028;
  const left = w * 0.045;
  const right = w * 0.955;
  const gap = Math.max(8, w * 0.016);
  const areaW = right - left;
  const areaH = bottom - top;
  if (layout === 'trio') {
    const pw = (areaW - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({
      x: left + i * (pw + gap), y: top, w: pw, h: areaH,
    }));
  }
  if (layout === 'hero') {
    const heroH = areaH * 0.6;
    const lowH = areaH - heroH - gap;
    const pw = (areaW - gap) / 2;
    return [
      { x: left, y: top, w: areaW, h: heroH },
      { x: left, y: top + heroH + gap, w: pw, h: lowH },
      { x: left + pw + gap, y: top + heroH + gap, w: pw, h: lowH },
    ];
  }
  // quad: 2 x 2
  const pw = (areaW - gap) / 2;
  const ph = (areaH - gap) / 2;
  return [
    { x: left, y: top, w: pw, h: ph },
    { x: left + pw + gap, y: top, w: pw, h: ph },
    { x: left, y: top + ph + gap, w: pw, h: ph },
    { x: left + pw + gap, y: top + ph + gap, w: pw, h: ph },
  ];
}

function skyGradient(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#2a1052');
  g.addColorStop(0.38, '#7a1e6e');
  g.addColorStop(0.66, '#e8446c');
  g.addColorStop(0.86, '#ff8a3d');
  g.addColorStop(1.0, '#ffc46b');
  return g;
}

function drawStars(ctx, w, h, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.4;
    const r = 0.6 + rnd() * 1.6;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.fillStyle = '#ffe9c9';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSun(ctx, w, h, sizeKey) {
  const cy = titleTop(h, sizeKey) - h * 0.02;
  const cx = w * 0.82;
  const r = Math.min(w, h) * 0.16;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  glow.addColorStop(0.5, 'rgba(255, 90, 120, 0.18)');
  glow.addColorStop(1, 'rgba(255, 90, 120, 0)');
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Retro slats cut across the lower half of the sun, clipped to its disc
  // so no bar sticks out past the circle.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#e8446c';
  let y = cy + r * 0.08;
  let th = r * 0.05;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, th);
    y += th + r * 0.12;
    th += r * 0.03;
  }
  ctx.restore();
  ctx.restore();
}

function drawSkyline(ctx, w, h, sizeKey) {
  const base = titleTop(h, sizeKey);
  const stripH = h * 0.075;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  ctx.save();
  ctx.fillStyle = 'rgba(20, 8, 34, 0.92)';
  let x = 0;
  while (x < w) {
    const bw = w * (0.04 + rnd() * 0.07);
    const bh = stripH * (0.35 + rnd() * 0.65);
    ctx.fillRect(x, base - bh, bw, bh);
    // A few lit windows.
    ctx.fillStyle = 'rgba(255, 200, 110, 0.85)';
    for (let wy = base - bh + 6; wy < base - 6; wy += 14) {
      for (let wx = x + 6; wx < x + bw - 6; wx += 16) {
        if (rnd() < 0.35) ctx.fillRect(wx, wy, 5, 7);
      }
    }
    ctx.fillStyle = 'rgba(20, 8, 34, 0.92)';
    x += bw + w * 0.008;
  }
  ctx.restore();
}

function drawPhoto(ctx, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel && panel.img) {
    const iw = panel.img.naturalWidth || panel.img.width;
    const ih = panel.img.naturalHeight || panel.img.height;
    const zoom = panel.zoom || 1;
    const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
    const dw = iw * base;
    const dh = ih * base;
    const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0);
    const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0);
    ctx.drawImage(panel.img, dx, dy, dw, dh);
  } else {
    // Empty slot: warm placeholder so the layout still reads.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#3d1658');
    g.addColorStop(1, '#8a2a5e');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255, 247, 236, 0.75)';
    ctx.font = `600 ${Math.max(13, rect.w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  // Vice City sunset grade: warm wash + teal shadows.
  const warm = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  warm.addColorStop(0, `rgba(255, 122, 61, ${0.34 * grade})`);
  warm.addColorStop(0.55, `rgba(255, 46, 136, ${0.22 * grade})`);
  warm.addColorStop(1, `rgba(25, 227, 214, ${0.16 * grade})`);
  ctx.fillStyle = warm;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255, 170, 60, ${0.5 * grade})`;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.55);
  ctx.globalCompositeOperation = 'source-over';
  // Vignette inside the panel.
  const vg = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(10, 4, 20, 0)');
  vg.addColorStop(1, 'rgba(10, 4, 20, 0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  // Neon frame: hot pink edge with a teal echo.
  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = Math.max(2, rect.w * 0.008);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(25, 227, 214, 0.85)';
  ctx.lineWidth = Math.max(1, rect.w * 0.003);
  ctx.strokeRect(rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10);
  ctx.restore();
}

function fitFont(ctx, text, maxW, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitle(ctx, w, h, state, sizeKey) {
  const top = titleTop(h, sizeKey);
  const bandH = h - top;
  const cx = w / 2;
  const title = (state.title || 'NEON SUNSET').toUpperCase();
  const sub = state.subtitle || '';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(cx, top + bandH * 0.42);
  ctx.rotate(-0.022);
  const maxW = w * 0.9;
  const px = fitFont(ctx, title, maxW, Math.min(w * 0.115, bandH * 0.52), 'Anton, sans-serif', 400);
  // Layered neon lettering: teal echo, pink drop, white face.
  ctx.font = `400 ${px}px Anton, sans-serif`;
  ctx.fillStyle = TEAL;
  ctx.fillText(title, px * 0.045, px * 0.06);
  ctx.fillStyle = PINK;
  ctx.fillText(title, 0, px * 0.075);
  ctx.fillStyle = INK;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  if (sub) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subPx = fitFont(ctx, sub, w * 0.8, Math.min(w * 0.042, bandH * 0.15), 'Pacifico, cursive', 400);
    ctx.font = `400 ${subPx}px Pacifico, cursive`;
    ctx.fillStyle = GOLD;
    ctx.shadowColor = 'rgba(255, 46, 136, 0.9)';
    ctx.shadowBlur = subPx * 0.35;
    ctx.fillText(sub, cx, top + bandH * 0.77);
    ctx.restore();
  }

  // Thin gold rule + microcopy under the band, clear of the subtitle.
  ctx.save();
  ctx.fillStyle = 'rgba(255, 196, 107, 0.9)';
  ctx.fillRect(w * 0.18, h - h * 0.034, w * 0.64, Math.max(1.5, h * 0.002));
  ctx.fillStyle = 'rgba(255, 247, 236, 0.6)';
  ctx.font = `600 ${Math.max(10, w * 0.011)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('P A L M   S U N S E T   C O V E R   S T U D I O', cx, h - h * 0.014);
  ctx.restore();
}

// Render the whole cover. `state` carries title, subtitle, layout, grade and
// panels (each { img, zoom, ox, oy }). The canvas is resized to W x H.
export function drawCover(canvas, state, W, H) {
  const sizeKey = state.sizeKey || 'square';
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = skyGradient(ctx, W, H);
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, W, H, 1234567);
  drawSun(ctx, W, H, sizeKey);
  const rects = panelRects(state.layout || 'trio', W, H, sizeKey);
  const panels = state.panels || [];
  rects.forEach((rect, i) => drawPhoto(ctx, rect, panels[i], state.grade ?? 0.55));
  drawSkyline(ctx, W, H, sizeKey);
  drawTitle(ctx, W, H, state, sizeKey);
  return canvas;
}
