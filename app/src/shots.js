// Fixed scenes for screenshots. `?shot=cover` shows the cover alone at the
// viewport size; `?shot=editor` shows the editor with a sample photo loaded.
// Query params: photo (pier|boulevard), caption, subcaption, layout
// (solo|duo|trio|quad), grade (sunset|neon|vice), captionPos (top|bottom),
// size (1080x1080|1080x1350|1920x1080). window.__shotReady is set once the
// fonts are in and the scene has painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await document.fonts.ready;
  await load(
    query.get('photo') ?? 'pier',
    query.get('caption') ?? 'Sunset Heist',
    {
      layout: query.get('layout') ?? undefined,
      grade: query.get('grade') ?? undefined,
      subcaption: query.get('subcaption') ?? undefined,
      captionPos: query.get('captionPos') ?? undefined,
      size: query.get('size') ?? undefined,
    },
  );
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
