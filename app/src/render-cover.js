// render-cover.js — the one render pipeline behind the live preview and
// the full-size PNG export, so what the editor shows is what exports.
//
// Paint order: the cover's base ink; each panel's picture graded (with the
// panel's own grade where it has one, else the cover grade) and clipped to
// the template polygon; the sunburst inside the hero panel; the white
// keylines; the poster finish (halftone, light leak, vignette, grain); the
// Cover Lines headline strips; the caption block; the starburst badge; and
// the bottom banner. Everything is drawn from the plain state object the
// editor keeps; nothing here touches the DOM beyond offscreen canvases.

import { gradeById, applyGradeOverlays } from './color-grades.js';
import { templateById } from './cover-templates.js';
import { coverOffset, polygonBox } from './photo-panels.js';
import { drawCaption, drawBanner, drawStarburst, captionThemeById, BANNER_FRACTION } from './caption-lettering.js';

// The three export sizes the bounty calls the common post sizes.
export const EXPORT_SIZES = {
  square: { id: 'square', name: 'Square', w: 1080, h: 1080 },
  portrait: { id: 'portrait', name: 'Portrait', w: 1080, h: 1350 },
  landscape: { id: 'landscape', name: 'Landscape', w: 1920, h: 1080 },
};

export function exportSize(id) {
  return EXPORT_SIZES[id] || EXPORT_SIZES.square;
}

// Trace a unit-space polygon as a path in pixel space.
function tracePolygon(ctx, points, W, H) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * W, y * H);
    else ctx.lineTo(x * W, y * H);
  });
  ctx.closePath();
}

// A tileable grain canvas, generated once: mid-grey noise that the overlay
// blend turns into print-like texture.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  let a = 987654321;
  for (let i = 0; i < img.data.length; i += 4) {
    a = (Math.imul(a, 1103515245) + 12345) | 0;
    const v = 108 + ((a >>> 16) % 88);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// Sunburst rays fanning from a focal point inside the hero panel:
// alternating soft wedges of warm light, clipped to the panel so they sit
// behind the subject like the rays on a printed cover.
function drawSunburst(ctx, panel, W, H) {
  const box = polygonBox(panel.points);
  const cx = (box.x + box.w * 0.5) * W;
  const cy = (box.y + box.h * 0.40) * H;
  const radius = Math.max(box.w * W, box.h * H) * 1.25;
  ctx.save();
  tracePolygon(ctx, panel.points, W, H);
  ctx.clip();
  ctx.globalCompositeOperation = 'soft-light';
  const rays = 24;
  for (let i = 0; i < rays; i += 2) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 1) / rays) * Math.PI * 2;
    ctx.fillStyle = 'rgba(255, 236, 190, 0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The magazine headline strips painted into a Cover Lines `lines` panel:
// each headline is a small accent rule over condensed white type, stacked
// down the rail. Drawn after the finish so the type stays crisp.
function drawHeadlinePanel(ctx, panel, headlines, W, H) {
  const box = polygonBox(panel.points);
  const bx = box.x * W;
  const by = box.y * H;
  const bw = box.w * W;
  const bh = box.h * H;
  ctx.save();
  tracePolygon(ctx, panel.points, W, H);
  ctx.clip();
  // Ink ground with a whisper of vertical light.
  const g = ctx.createLinearGradient(0, by, 0, by + bh);
  g.addColorStop(0, '#160b28');
  g.addColorStop(1, '#08040f');
  ctx.fillStyle = g;
  ctx.fillRect(bx, by, bw, bh);

  const items = (headlines || []).map((s) => String(s || '').trim()).filter(Boolean);
  if (items.length === 0) {
    ctx.restore();
    return;
  }
  const padX = bw * 0.09;
  const slotH = bh / items.length;
  const accents = ['#ffcf3f', '#ff5e8a', '#22d3ee'];
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  items.forEach((text, i) => {
    const slotY = by + i * slotH;
    // Accent rule.
    ctx.fillStyle = accents[i % accents.length];
    ctx.fillRect(bx + padX, slotY + slotH * 0.20, bw * 0.16, Math.max(3, H * 0.006));
    // Headline, fitted to the rail's width in up to two lines.
    const label = text.toUpperCase();
    let size = slotH * 0.30;
    ctx.font = size + 'px Anton, "Arial Narrow Bold", sans-serif';
    const words = label.split(/\s+/).filter(Boolean);
    let lines = [label];
    if (ctx.measureText(label).width > bw - padX * 2 && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      size = slotH * 0.24;
      ctx.font = size + 'px Anton, "Arial Narrow Bold", sans-serif';
    }
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest > bw - padX * 2) {
      size = Math.max(9, (size * (bw - padX * 2)) / widest);
      ctx.font = size + 'px Anton, "Arial Narrow Bold", sans-serif';
    }
    ctx.fillStyle = '#ffffff';
    const lineH = size * 1.06;
    const firstBase = slotY + slotH * 0.20 + H * 0.012 + size;
    lines.forEach((line, j) => {
      ctx.fillText(line, bx + padX, firstBase + j * lineH);
    });
    // Hairline between strips.
    if (i < items.length - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx + padX, slotY + slotH - 1, bw - padX * 2, 1);
    }
  });
  ctx.restore();
}

// One panel: its picture (or solid ink) graded on an offscreen canvas at
// the panel's bounding-box size — with the placement's own grade when it
// carries one, else the cover grade — then drawn into the main canvas
// clipped to the panel polygon, so diagonal Slash panels grade cleanly.
function drawPanel(ctx, panel, placement, photosById, coverGrade, W, H, sunburst) {
  const box = polygonBox(panel.points);
  const bx = Math.round(box.x * W);
  const by = Math.round(box.y * H);
  const bw = Math.max(2, Math.round(box.w * W));
  const bh = Math.max(2, Math.round(box.h * H));
  const photo = placement && placement.photoId ? photosById.get(placement.photoId) : null;
  const grade = placement && placement.gradeId ? gradeById(placement.gradeId) : coverGrade;

  ctx.save();
  tracePolygon(ctx, panel.points, W, H);
  ctx.clip();

  if (panel.ink || panel.lines || !photo) {
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, grade.ink);
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
  } else {
    const off = document.createElement('canvas');
    off.width = bw;
    off.height = bh;
    const octx = off.getContext('2d');
    octx.filter = grade.filter;
    const placed = coverOffset(photo.width, photo.height, bw, bh, placement);
    octx.drawImage(photo.source, placed.x, placed.y, placed.w, placed.h);
    octx.filter = 'none';
    applyGradeOverlays(octx, grade, bw, bh);
    ctx.drawImage(off, bx, by);
  }
  ctx.restore();

  if (panel.hero && sunburst) drawSunburst(ctx, panel, W, H);
}

// The poster finish: halftone dot texture, a warm leak of light from the
// top corner, a vignette, and grain — the print-shop layer over the panels.
function drawFinish(ctx, state, W, H) {
  if (state.halftone) {
    const spacing = Math.max(6, Math.round(W * 0.0075));
    const tile = document.createElement('canvas');
    tile.width = spacing;
    tile.height = spacing;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    tctx.beginPath();
    tctx.arc(spacing / 2, spacing / 2, spacing * 0.30, 0, Math.PI * 2);
    tctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Light leak.
  const leak = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.75);
  leak.addColorStop(0, 'rgba(255, 160, 80, 0.20)');
  leak.addColorStop(0.5, 'rgba(255, 120, 90, 0.06)');
  leak.addColorStop(1, 'rgba(255, 120, 90, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Vignette.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(8, 2, 14, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 14, 0.40)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Grain.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Render the full cover described by `state` into `ctx` at W x H pixels.
// `photosById` is a Map of every picture entry the panels can name.
export function renderCover(ctx, state, photosById, W, H) {
  const template = templateById(state.template);
  const grade = gradeById(state.grade);
  const panels = template.panels();
  const bannerOn = !!(state.banner && state.banner.on && state.banner.text);

  ctx.fillStyle = grade.ink;
  ctx.fillRect(0, 0, W, H);

  panels.forEach((panel, i) => {
    drawPanel(ctx, panel, state.placements[i], photosById, grade, W, H, state.sunburst !== false);
  });

  // White keylines between the panels and around the cover's edge.
  const key = Math.max(2, Math.round(W * 0.011));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = key;
  ctx.lineJoin = 'round';
  for (const panel of panels) {
    tracePolygon(ctx, panel.points, W, H);
    ctx.stroke();
  }
  ctx.strokeRect(key / 2, key / 2, W - key, H - key);

  drawFinish(ctx, state, W, H);

  // Headline strips sit above the finish so their type stays crisp.
  panels.forEach((panel) => {
    if (panel.lines) drawHeadlinePanel(ctx, panel, state.headlines, W, H);
  });

  const triptychBand = template.id === 'triptych' && state.captionPos !== 'top' ? 0.8 : null;
  drawCaption(ctx, W, H, {
    main: state.caption,
    sub: state.subcaption,
    theme: captionThemeById(state.captionTheme),
    position: state.captionPos,
    scale: state.captionScale,
    skew: state.skew,
    bandTop: triptychBand,
    bottomInset: bannerOn ? Math.round(H * BANNER_FRACTION) : 0,
  });

  if (state.badge && state.badge.on && state.badge.text) {
    drawStarburst(ctx, W, H, state.badge.text, state.badge.angle || 0, state.captionPos === 'top');
  }

  if (bannerOn) drawBanner(ctx, W, H, state.banner.text);
}
