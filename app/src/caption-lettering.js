// caption-lettering.js — the poster's words and stickers.
//
// Three layers live here, all drawn on canvas in the bundled Anton face:
//   * the caption block — a big condensed main line with a gradient fill,
//     a thick dark stroke and a hard offset shadow, over a letterspaced
//     sub-line;
//   * the starburst badge — a spiky poster sticker with editable text and
//     a user-set rotation, parked in a top corner;
//   * the bottom banner — a full-width strip with its own editable line,
//     in the loud tradition of magazine cover furniture.
// Everything is original lettering; no game's logo or wordmark is imitated.

export const CAPTION_THEMES = [
  {
    id: 'sunset',
    name: 'Sunset',
    stops: [[0, '#ffffff'], [0.55, '#ffd166'], [1, '#ff8a3d']],
    stroke: '#2a0f2e',
    sub: '#ffe9c9',
  },
  {
    id: 'neon',
    name: 'Neon',
    stops: [[0, '#ffffff'], [0.5, '#ff71ce'], [1, '#01cdfe']],
    stroke: '#0b0620',
    sub: '#b8f7ff',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    stops: [[0, '#ffffff'], [0.45, '#dfe6ee'], [0.58, '#8fa3b8'], [1, '#f4f8fb']],
    stroke: '#10131a',
    sub: '#e8eef4',
  },
  {
    id: 'candy',
    name: 'Candy',
    stops: [[0, '#fff7fb'], [0.5, '#ffb3d9'], [1, '#ff5e8a']],
    stroke: '#3d0f2e',
    sub: '#ffe3f0',
  },
];

// Look a caption theme up by id, falling back to Sunset.
export function captionThemeById(id) {
  return CAPTION_THEMES.find((t) => t.id === id) || CAPTION_THEMES[0];
}

// Set the Anton face at a pixel size on a context.
function setAnton(ctx, px) {
  ctx.font = px + 'px Anton, "Arial Narrow Bold", sans-serif';
}

// The height the bottom banner occupies at a cover height, as a fraction.
export const BANNER_FRACTION = 0.075;

// ------------------------------------------------------------------ banner
// A full-width strip along the cover's foot: a loud fill, a keyline on its
// top edge, and centred condensed text that shrinks to fit.
export function drawBanner(ctx, W, H, text) {
  const label = String(text || '').toUpperCase();
  if (!label) return;
  const bh = Math.round(H * BANNER_FRACTION);
  const y = H - bh;
  ctx.save();
  const grad = ctx.createLinearGradient(0, y, 0, H);
  grad.addColorStop(0, '#ffcf3f');
  grad.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, W, bh);
  ctx.fillStyle = '#17102a';
  ctx.fillRect(0, y, W, Math.max(3, H * 0.006));
  let size = bh * 0.58;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setAnton(ctx, size);
  const w = ctx.measureText(label).width;
  if (w > W * 0.92) {
    size = Math.max(10, (size * (W * 0.92)) / w);
    setAnton(ctx, size);
  }
  try {
    ctx.letterSpacing = Math.round(size * 0.06) + 'px';
  } catch {
    // letterSpacing is a newer property; the strip reads fine without it.
  }
  ctx.fillStyle = '#17102a';
  ctx.fillText(label, W / 2, y + bh * 0.54);
  ctx.restore();
}

// ------------------------------------------------------------------- badge
// The starburst sticker: alternating long and short spikes around a disc,
// a dark outline, and the badge text fitted across its middle in up to two
// lines. `angleDeg` rotates the whole sticker (the spikes rotate with it;
// the text stays level with the sticker, poster-style).
export function drawStarburst(ctx, W, H, text, angleDeg, captionAtTop) {
  const label = String(text || '').toUpperCase();
  if (!label) return;
  const R = H * 0.115;
  const cx = captionAtTop ? W * 0.085 + R : W - W * 0.055 - R;
  const cy = captionAtTop ? H - H * 0.06 - R : H * 0.055 + R;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((angleDeg || 0) * Math.PI) / 180);
  ctx.shadowColor = 'rgba(10, 4, 16, 0.45)';
  ctx.shadowOffsetX = R * 0.05;
  ctx.shadowOffsetY = R * 0.08;

  // The burst itself: 16 spikes alternating outer and inner radius.
  const spikes = 16;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? R : R * 0.78;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  grad.addColorStop(0, '#ffe066');
  grad.addColorStop(0.75, '#ffcf3f');
  grad.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = R * 0.055;
  ctx.strokeStyle = '#17102a';
  ctx.lineJoin = 'round';
  ctx.stroke();
  // Inner disc the text sits on.
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.66, 0, Math.PI * 2);
  ctx.fillStyle = '#ff5e3d';
  ctx.fill();
  ctx.lineWidth = R * 0.04;
  ctx.stroke();

  // Fit the text: try one line, then two, shrinking until it sits inside
  // the disc's width.
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = R * 1.14;
  const words = label.split(/\s+/).filter(Boolean);
  let lines = [label];
  let size = R * 0.34;
  setAnton(ctx, size);
  if (ctx.measureText(label).width > maxW && words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    size = R * 0.30;
    setAnton(ctx, size);
  }
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  if (widest > maxW) {
    size = Math.max(9, (size * maxW) / widest);
    setAnton(ctx, size);
  }
  ctx.lineWidth = size * 0.14;
  ctx.strokeStyle = 'rgba(23, 16, 42, 0.85)';
  ctx.lineJoin = 'round';
  const lineH = size * 1.04;
  const y0 = -((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => {
    ctx.strokeText(line, 0, y0 + i * lineH);
    ctx.fillText(line, 0, y0 + i * lineH);
  });
  ctx.restore();
}

// ----------------------------------------------------------------- caption
// Draw the caption block. Options:
//   main, sub      the two lines of text (either may be empty)
//   theme          a CAPTION_THEMES entry
//   position       'bottom' or 'top'
//   scale          user size multiplier on the 13%-of-height default
//   skew           apply the -4 degree poster slant
//   bandTop        when the template has a caption band, its top edge as a
//                  fraction of the height; the block centres inside it
//   bottomInset    pixels reserved at the foot (the banner strip), so a
//                  bottom caption floats above it instead of under it
export function drawCaption(ctx, W, H, opts) {
  const theme = opts.theme;
  const main = (opts.main || '').toUpperCase();
  const sub = (opts.sub || '').toUpperCase();
  if (!main && !sub) return;
  const inset = opts.bottomInset || 0;

  let mainSize = H * 0.13 * (opts.scale || 1);
  if (main) {
    setAnton(ctx, mainSize);
    const w = ctx.measureText(main).width;
    const maxW = W * 0.94;
    if (w > maxW) mainSize = Math.max(H * 0.045, (mainSize * maxW) / w);
  }
  let subSize = mainSize * 0.30;
  let gap = mainSize * 0.30;
  let blockH = (sub ? subSize + gap : 0) + mainSize;

  // Inside a caption band the block must fit the band: shrink the
  // lettering rather than let the main line spill past the cover's edge.
  if (opts.bandTop != null && opts.position !== 'top') {
    const bandH = H - opts.bandTop * H;
    if (blockH > bandH * 0.94) {
      const f = (bandH * 0.94) / blockH;
      mainSize *= f;
      subSize *= f;
      gap *= f;
      blockH *= f;
    }
  }

  // Vertical anchor of the block's top edge.
  let blockTop;
  if (opts.bandTop != null && opts.position !== 'top') {
    const bandH = H - opts.bandTop * H;
    blockTop = opts.bandTop * H + Math.max(0, (bandH - blockH) / 2);
  } else if (opts.position === 'top') {
    blockTop = H * 0.045;
  } else {
    blockTop = H - inset - H * 0.05 - blockH;
  }

  ctx.save();
  if (opts.skew) {
    const cy = blockTop + blockH / 2;
    ctx.translate(W / 2, cy);
    ctx.transform(1, 0, Math.tan((-4 * Math.PI) / 180), 1, 0, 0);
    ctx.translate(-W / 2, -cy);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  let cursor = blockTop;
  if (sub) {
    setAnton(ctx, subSize);
    try {
      ctx.letterSpacing = Math.round(subSize * 0.34) + 'px';
    } catch {
      // Older engines have no letterSpacing; the line still reads fine.
    }
    ctx.lineWidth = subSize * 0.16;
    ctx.strokeStyle = theme.stroke;
    ctx.strokeText(sub, W / 2, cursor + subSize);
    ctx.fillStyle = theme.sub;
    ctx.fillText(sub, W / 2, cursor + subSize);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Nothing to reset where the property does not exist.
    }
    cursor += subSize + gap;
  }

  if (main) {
    setAnton(ctx, mainSize);
    const baseline = cursor + mainSize * 0.94;
    // Hard drop shadow: an offset copy in near-black under everything.
    ctx.fillStyle = 'rgba(12, 4, 20, 0.88)';
    ctx.fillText(main, W / 2 + mainSize * 0.055, baseline + mainSize * 0.075);
    // Thick dark stroke, then the gradient fill.
    ctx.lineWidth = mainSize * 0.15;
    ctx.strokeStyle = theme.stroke;
    ctx.strokeText(main, W / 2, baseline);
    const grad = ctx.createLinearGradient(0, baseline - mainSize, 0, baseline + mainSize * 0.1);
    for (const [at, color] of theme.stops) grad.addColorStop(at, color);
    ctx.fillStyle = grad;
    ctx.fillText(main, W / 2, baseline);
  }
  ctx.restore();
}
