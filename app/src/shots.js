// shots.js — fixed scenes for screenshots: ?shot=editor shows the editor
// with a sample photo loaded; ?shot=cover shows the cover alone, drawn at
// the export size in the query. window.__shotReady is set once painted.

/**
 * Sets up a screenshot scene.
 * @param {string} shot - 'editor' or 'cover'
 * @param {URLSearchParams} query - photo, caption, subtitle, layout, grade, size, pos
 * @param {object} state - the editor state object from main.js
 * @param {Function} redraw - redraws the preview canvas
 */
export async function runShot(shot, query, state, redraw) {
  const api = window.__viceLights;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  state.layout = query.get('layout') ?? 'trio';
  state.grade = query.get('grade') ?? 'sunset';
  state.caption = query.get('caption') ?? 'Vice Lights';
  state.subtitle = query.get('subtitle') ?? 'Neon Coast';
  state.captionPos = query.get('pos') ?? 'bottom';
  state.exportSize = query.get('size') ?? '1080x1080';
  document.getElementById('caption').value = state.caption;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('caption-pos').value = state.captionPos;
  document.getElementById('export-size').value = state.exportSize;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });

  await api.addSample(query.get('photo') ?? 'pier');
  // A second sample photo for the lower panels, when the scene asks for it.
  const second = query.get('photo2');
  if (second) {
    const img = await api.loadImage(`samples/${second}.jpg`);
    api.state.photos.push({ name: `${second}.jpg`, img });
    api.state.panels.forEach((p, i) => {
      if (i > 0) p.photo = img;
    });
  }
  redraw();
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch {
    // Fallbacks still draw.
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
