// photo-panels.js — pictures, placements and panel geometry.
//
// A "picture" is anything drawable with a width and a height: a bundled
// photograph, an uploaded image, or one of the illustrated scene canvases.
// Each panel of the active template owns a placement: which picture fills
// it (null paints solid ink), a pan offset in -1..1 on each axis, a zoom
// factor, and — new in Vice Frame 3 — an optional per-panel grade id that
// overrides the cover-wide grade for that panel alone.
//
// This module holds that state and the cover-fit maths; drawing lives in
// render-cover.js.

// The order pictures are dealt into fresh panels: the illustrated scenes
// lead, so a brand-new cover already reads as poster art.
export const DEFAULT_DEAL_ORDER = [
  'scene-pier',
  'scene-skyline',
  'scene-neon',
  'scene-highway',
  'photo-pier',
  'scene-beach',
  'photo-boulevard',
];

// One fresh placement for a panel. gradeId null means "use the cover grade".
export function makePlacement(photoId) {
  return { photoId: photoId ?? null, panX: 0, panY: 0, zoom: 1, gradeId: null };
}

// Build placements for a panel count, dealing the built-in pictures in
// catalogue order and wrapping around when a layout has more panels than
// there are pictures.
export function dealPlacements(panelCount, photos) {
  const byId = new Map(photos.map((p) => [p.id, p]));
  const deal = DEFAULT_DEAL_ORDER.filter((id) => byId.has(id));
  const order = deal.length > 0 ? deal : photos.map((p) => p.id);
  const out = [];
  for (let i = 0; i < panelCount; i++) {
    out.push(makePlacement(order.length > 0 ? order[i % order.length] : null));
  }
  return out;
}

// Resize a placement list to a new panel count (a template switch), keeping
// the placements that still exist — photo, crop and grade included — and
// dealing fresh ones for panels the new layout adds.
export function resizePlacements(placements, panelCount, photos) {
  const next = placements.slice(0, panelCount).map((p) => ({ ...p }));
  if (next.length < panelCount) {
    const dealt = dealPlacements(panelCount, photos);
    while (next.length < panelCount) next.push(dealt[next.length]);
  }
  return next;
}

// Point every panel at the same picture ("one photo fills all panels"),
// keeping each panel's crop and grade.
export function fillAllPanels(placements, photoId) {
  return placements.map((p) => ({ ...p, photoId }));
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Cover-fit maths: the scale at which a photo covers a box, with a zoom
// factor on top, and the drawn size that scale produces.
export function coverFit(photoW, photoH, boxW, boxH, zoom) {
  const scale = Math.max(boxW / photoW, boxH / photoH) * (zoom || 1);
  return { scale, w: photoW * scale, h: photoH * scale };
}

// Where a cover-fitted photo sits inside its box for a placement's pan:
// pan -1 pins the photo's left/top edge to the box, 1 the right/bottom.
export function coverOffset(photoW, photoH, boxW, boxH, placement) {
  const fit = coverFit(photoW, photoH, boxW, boxH, placement.zoom);
  const spareX = Math.max(0, fit.w - boxW);
  const spareY = Math.max(0, fit.h - boxH);
  return {
    x: -spareX * (0.5 + 0.5 * clamp(placement.panX, -1, 1)),
    y: -spareY * (0.5 + 0.5 * clamp(placement.panY, -1, 1)),
    w: fit.w,
    h: fit.h,
  };
}

// Which panel polygon (unit cover space) contains a point — the topmost
// panel wins, so later panels answer first. -1 when the point misses all.
export function panelAtPoint(panels, x, y) {
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, panels[i].points)) return i;
  }
  return -1;
}

// Even-odd ray-casting point-in-polygon over unit-space points.
export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// The axis-aligned bounding box of a unit-space polygon.
export function polygonBox(points) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
