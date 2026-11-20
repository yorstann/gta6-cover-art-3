// sample-scenes.js — five original illustrated scenes, painted procedurally.
//
// Game covers are illustrated, not photographed, so Vice Frame 3 ships
// poster scenes drawn with flat vector shapes on canvas: a sunset pier with
// a lowrider, a neon boulevard, a beach day, a downtown skyline at dusk and
// a palm-lined highway with a sports car. Each scene paints once onto its
// own offscreen canvas at 1920 x 1200 — poster resolution, so a panel stays
// sharp at full export size — and the picture system then treats the canvas
// exactly like a loaded photograph. A seeded random source keeps every
// scene identical on every machine and every load.

export const SCENE_WIDTH = 1920;
export const SCENE_HEIGHT = 1200;

// mulberry32: a small deterministic random generator.
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sceneCanvas() {
  const c = document.createElement('canvas');
  c.width = SCENE_WIDTH;
  c.height = SCENE_HEIGHT;
  return c;
}

function vGrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// A palm silhouette: segmented curving trunk, a crown of drooping fronds
// drawn as tapered quadratic strokes, and a pair of coconuts.
function palm(ctx, x, y, s, lean, color) {
  const topX = x + lean * s;
  const topY = y - s;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  let px = x;
  let py = y;
  const segs = 7;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = x + lean * s * t * t;
    const ny = y - s * t;
    ctx.lineWidth = Math.max(2, s * 0.07 * (1 - t * 0.5));
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    px = nx;
    py = ny;
  }
  const fronds = 9;
  for (let i = 0; i < fronds; i++) {
    const ang = Math.PI * (0.06 + (i / (fronds - 1)) * 0.88);
    const len = s * (0.5 + (i % 3) * 0.1);
    ctx.lineWidth = Math.max(2, s * 0.042);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(ang) * len * 0.5,
      topY - Math.sin(ang) * len * 0.66,
      topX + Math.cos(ang) * len,
      topY - Math.sin(ang) * len * 0.5 + len * 0.36,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - s * 0.04, topY + s * 0.03, s * 0.042, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.05, topY + s * 0.04, s * 0.036, 0, Math.PI * 2);
  ctx.fill();
}

// Small double-arc birds, the oldest trick in the poster book.
function birds(ctx, rand, count, x0, x1, y0, y1, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const bx = x0 + rand() * (x1 - x0);
    const by = y0 + rand() * (y1 - y0);
    const bs = 11 + rand() * 13;
    ctx.beginPath();
    ctx.arc(bx - bs, by, bs, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(bx + bs, by, bs, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
}

// Flat banded clouds: rounded bars laid across a sky.
function cloudBands(ctx, rand, count, w, yMax, colors, alpha) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = alpha * (0.6 + rand() * 0.4);
    const cw = 150 + rand() * 430;
    ctx.beginPath();
    ctx.roundRect(rand() * w - 120, rand() * yMax, cw, 10 + rand() * 15, 12);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// A lowrider silhouette in profile: long body, low stance, whitewall
// wheels, glasshouse, and a rim light tracing the roofline.
function lowrider(ctx, x, y, s, body, rim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8, 2, 16, 0.45)';
  ctx.beginPath();
  ctx.ellipse(308, 176, 318, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(10, 148);
  ctx.quadraticCurveTo(6, 118, 42, 108);
  ctx.lineTo(122, 100);
  ctx.quadraticCurveTo(152, 58, 216, 50);
  ctx.lineTo(358, 46);
  ctx.quadraticCurveTo(430, 48, 470, 92);
  ctx.lineTo(558, 104);
  ctx.quadraticCurveTo(604, 110, 602, 140);
  ctx.quadraticCurveTo(601, 158, 578, 160);
  ctx.lineTo(508, 160);
  ctx.arc(452, 160, 56, 0, Math.PI, true);
  ctx.lineTo(212, 160);
  ctx.arc(156, 160, 56, 0, Math.PI, true);
  ctx.lineTo(32, 160);
  ctx.quadraticCurveTo(12, 160, 10, 148);
  ctx.fill();
  // Glasshouse.
  ctx.fillStyle = 'rgba(150, 40, 80, 0.85)';
  ctx.beginPath();
  ctx.moveTo(170, 96);
  ctx.quadraticCurveTo(194, 64, 234, 58);
  ctx.lineTo(300, 55);
  ctx.lineTo(300, 96);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(314, 55);
  ctx.lineTo(356, 54);
  ctx.quadraticCurveTo(404, 56, 436, 94);
  ctx.lineTo(314, 96);
  ctx.closePath();
  ctx.fill();
  // Rim light.
  ctx.strokeStyle = rim;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(46, 106);
  ctx.lineTo(122, 98);
  ctx.quadraticCurveTo(152, 56, 216, 48);
  ctx.lineTo(358, 44);
  ctx.quadraticCurveTo(428, 46, 468, 90);
  ctx.stroke();
  // Wheels: tyre, whitewall, hub, glint.
  for (const wx of [156, 452]) {
    ctx.fillStyle = '#0a0512';
    ctx.beginPath();
    ctx.arc(wx, 160, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4ead8';
    ctx.beginPath();
    ctx.arc(wx, 160, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1030';
    ctx.beginPath();
    ctx.arc(wx, 160, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(wx, 160, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Scene A
// Sunset pier: banded dusk sky, a low sun over a streaked sea, a wooden
// pier with lamp globes and festoon lights, palms, and the lowrider.
function paintSunsetPier() {
  const c = sceneCanvas();
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const horizon = H * 0.62;
  const rand = rng(90210);

  ctx.fillStyle = vGrad(ctx, 0, horizon, [
    [0, '#2a1052'], [0.38, '#7a1e63'], [0.68, '#d63d63'], [0.9, '#ff7a45'], [1, '#ffb35c'],
  ]);
  ctx.fillRect(0, 0, W, horizon);
  cloudBands(ctx, rand, 26, W, horizon * 0.78, ['#2e1054', '#7a1e63', '#ff7a8c'], 0.5);

  // Sun and halo, clipped by the horizon.
  const sunX = W * 0.60;
  const sunY = horizon - H * 0.05;
  const halo = ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, 430);
  halo.addColorStop(0, 'rgba(255,205,110,0.85)');
  halo.addColorStop(0.5, 'rgba(255,140,80,0.32)');
  halo.addColorStop(1, 'rgba(255,140,80,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 450, sunY - 450, 900, 900);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe3a3';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 103, 0, Math.PI * 2);
  ctx.fill();

  // Sea with the sun's broken reflection.
  ctx.fillStyle = vGrad(ctx, horizon, H, [
    [0, '#ff8a5c'], [0.25, '#c94b6d'], [0.7, '#5c2158'], [1, '#2a1052'],
  ]);
  ctx.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 64; i++) {
    const t = i / 64;
    const ry = horizon + 12 + t * (H - horizon - 30);
    const rx = sunX + (rand() - 0.5) * (60 + t * 320);
    const rw = 40 + rand() * (90 + t * 170);
    ctx.fillStyle = `rgba(255, ${190 + Math.floor(rand() * 40)}, 110, ${0.5 - t * 0.3})`;
    ctx.fillRect(rx - rw / 2, ry, rw, 4 + t * 5);
  }
  ctx.strokeStyle = 'rgba(255,170,150,0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i++) {
    const ry = horizon + 20 + rand() * (H - horizon - 40);
    const rx = rand() * W;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 60 + rand() * 180, ry);
    ctx.stroke();
  }

  // Distant headland, left.
  ctx.fillStyle = '#3a1460';
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.quadraticCurveTo(180, horizon - 92, 430, horizon - 26);
  ctx.quadraticCurveTo(560, horizon - 6, 700, horizon);
  ctx.closePath();
  ctx.fill();

  // The pier deck, running from lower left toward the sun.
  ctx.fillStyle = '#1c0a33';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.86);
  ctx.lineTo(W * 0.52, horizon + 26);
  ctx.lineTo(W * 0.56, horizon + 40);
  ctx.lineTo(0, H * 0.97);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, H * 0.94, W, H * 0.06);
  ctx.fillStyle = '#12061f';
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const px = 60 + t * (W * 0.46);
    const py = H * 0.885 - t * (H * 0.885 - horizon - 30);
    ctx.fillRect(px, py, 16 - t * 7, H - py);
  }
  // Lamp posts with warm globes.
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const lx = 190 + t * (W * 0.34);
    const ly = H * 0.865 - t * (H * 0.865 - horizon - 34);
    const lh = 120 - t * 52;
    ctx.strokeStyle = '#1c0a33';
    ctx.lineWidth = 9 - t * 3;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly - lh);
    ctx.stroke();
    const glow = ctx.createRadialGradient(lx, ly - lh, 2, lx, ly - lh, 44 - t * 14);
    glow.addColorStop(0, 'rgba(255,220,150,0.95)');
    glow.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly - lh, 44 - t * 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(lx, ly - lh, 8 - t * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Festoon string lights sagging along the pier's far edge.
  ctx.strokeStyle = 'rgba(20, 6, 34, 0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(120, H * 0.80);
  ctx.quadraticCurveTo(W * 0.3, H * 0.76, W * 0.5, horizon + 44);
  ctx.stroke();
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const bx = (1 - t) * (1 - t) * 120 + 2 * (1 - t) * t * (W * 0.3) + t * t * (W * 0.5);
    const by = (1 - t) * (1 - t) * (H * 0.80) + 2 * (1 - t) * t * (H * 0.76) + t * t * (horizon + 44);
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(bx, by + 7, 5.5 - t * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boardwalk band and the lowrider parked on it.
  ctx.fillStyle = '#170829';
  ctx.fillRect(0, H * 0.955, W, H * 0.045);
  lowrider(ctx, W * 0.56, H * 0.70, 1.06, '#20093d', '#ff9a5c');

  palm(ctx, 96, H * 1.0, 560, 0.22, '#170829');
  palm(ctx, 214, H * 1.02, 430, 0.3, '#1e0a38');
  palm(ctx, W - 120, H * 1.0, 620, -0.2, '#170829');
  palm(ctx, W - 304, H * 1.03, 400, -0.34, '#1e0a38');
  birds(ctx, rand, 7, 240, W - 240, 90, 350, 'rgba(30,8,48,0.8)', 5);
  return c;
}

// A glowing neon sign: diamond, bolt, ring, or a palm disc with the palm
// knocked out in the night colour.
function neonSign(ctx, x, y, s, color, kind, night) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 34;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  if (kind === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.72, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.72, 0);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(s * 0.18, -s);
    ctx.lineTo(-s * 0.42, s * 0.18);
    ctx.lineTo(-s * 0.02, s * 0.18);
    ctx.lineTo(-s * 0.18, s);
    ctx.lineTo(s * 0.42, -s * 0.18);
    ctx.lineTo(s * 0.02, -s * 0.18);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'ring') {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    palm(ctx, -s * 0.06, s * 0.62, s * 1.05, 0.16, night);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Scene B
// Neon boulevard: star sky, two walls of lit towers, glowing signs, a taxi
// silhouette, and a wet street smeared with their reflections.
function paintNeonBoulevard() {
  const c = sceneCanvas();
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const ground = H * 0.72;
  const rand = rng(31337);

  ctx.fillStyle = vGrad(ctx, 0, ground, [[0, '#04040f'], [0.6, '#0a1030'], [1, '#1a0f38']]);
  ctx.fillRect(0, 0, W, ground);
  for (let i = 0; i < 130; i++) {
    ctx.fillStyle = `rgba(220,230,255,${0.25 + rand() * 0.6})`;
    const r = rand() * 2.1 + 0.5;
    ctx.fillRect(rand() * W, rand() * ground * 0.5, r, r);
  }
  // Crescent moon.
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath();
  ctx.arc(W * 0.86, H * 0.13, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1030';
  ctx.beginPath();
  ctx.arc(W * 0.875, H * 0.115, 40, 0, Math.PI * 2);
  ctx.fill();

  const winCols = ['#ffd98a', '#9be8ff', '#ff9be0', '#fff3c9'];
  function building(x, w, top, tone) {
    ctx.fillStyle = tone;
    ctx.fillRect(x, top, w, ground - top);
    const cols = Math.max(2, Math.floor(w / 44));
    const rows = Math.max(3, Math.floor((ground - top) / 52));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rand() < 0.42) continue;
        ctx.fillStyle = winCols[Math.floor(rand() * winCols.length)];
        ctx.globalAlpha = 0.5 + rand() * 0.5;
        ctx.fillRect(x + 10 + i * ((w - 20) / cols), top + 14 + j * ((ground - top - 24) / rows), 15, 20);
      }
    }
    ctx.globalAlpha = 1;
  }
  building(0, 300, 150, '#0a0a22');
  building(316, 240, 260, '#0d0d2a');
  building(572, 200, 350, '#0a0a22');
  building(1150, 200, 330, '#0d0d2a');
  building(1366, 240, 240, '#0a0a22');
  building(1622, 298, 140, '#0d0d2a');
  building(792, 336, 190, '#101034');
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(792, 176, 336, 10);

  // Wet street.
  ctx.fillStyle = vGrad(ctx, ground, H, [[0, '#131338'], [0.4, '#0b0b26'], [1, '#05050f']]);
  ctx.fillRect(0, ground, W, H - ground);
  ctx.fillStyle = 'rgba(255,240,190,0.75)';
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const dy = ground + 26 + t * (H - ground - 40);
    const dw = 6 + t * 26;
    ctx.fillRect(W / 2 - dw / 2, dy, dw, 8 + t * 30);
  }

  const signs = [
    { x: 150, y: 300, s: 74, color: '#ff2e88', kind: 'palm' },
    { x: 436, y: 420, s: 56, color: '#22d3ee', kind: 'diamond' },
    { x: 660, y: 330, s: 48, color: '#facc15', kind: 'bolt' },
    { x: 960, y: 300, s: 66, color: '#ff2e88', kind: 'ring' },
    { x: 1252, y: 430, s: 52, color: '#a78bfa', kind: 'diamond' },
    { x: 1490, y: 320, s: 62, color: '#22d3ee', kind: 'palm' },
    { x: 1760, y: 450, s: 54, color: '#ff9a3d', kind: 'bolt' },
  ];
  for (const s of signs) neonSign(ctx, s.x, s.y, s.s, s.color, s.kind, '#0a0618');
  // Reflections smeared down the wet street.
  for (const s of signs) {
    const g = ctx.createLinearGradient(0, ground, 0, H);
    g.addColorStop(0, s.color + 'aa');
    g.addColorStop(1, s.color + '00');
    ctx.fillStyle = g;
    const wob = 10 + rand() * 16;
    ctx.beginPath();
    ctx.moveTo(s.x - s.s * 0.5, ground);
    ctx.lineTo(s.x + s.s * 0.5, ground);
    ctx.lineTo(s.x + s.s * 0.5 + wob, H);
    ctx.lineTo(s.x - s.s * 0.5 - wob, H);
    ctx.closePath();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = winCols[Math.floor(rand() * winCols.length)];
    ctx.globalAlpha = 0.05 + rand() * 0.12;
    ctx.fillRect(rand() * W, ground + rand() * (H - ground), 30 + rand() * 130, 3 + rand() * 4);
  }
  ctx.globalAlpha = 1;

  // A taxi waiting at the kerb, headlights pooling on the wet asphalt.
  ctx.save();
  ctx.translate(W * 0.66, ground + 96);
  ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
  ctx.beginPath();
  ctx.ellipse(330, 118, 300, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d0d24';
  ctx.beginPath();
  ctx.moveTo(0, 92);
  ctx.quadraticCurveTo(2, 66, 34, 60);
  ctx.lineTo(96, 54);
  ctx.quadraticCurveTo(118, 26, 168, 22);
  ctx.lineTo(268, 20);
  ctx.quadraticCurveTo(312, 22, 336, 52);
  ctx.lineTo(404, 60);
  ctx.quadraticCurveTo(430, 64, 428, 88);
  ctx.lineTo(392, 92);
  ctx.arc(356, 92, 36, 0, Math.PI, true);
  ctx.lineTo(108, 92);
  ctx.arc(72, 92, 36, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(416, 74, 9, 0, Math.PI * 2);
  ctx.arc(14, 74, 7, 0, Math.PI * 2);
  ctx.fill();
  for (const wx of [72, 356]) {
    ctx.fillStyle = '#05050f';
    ctx.beginPath();
    ctx.arc(wx, 92, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  palm(ctx, 60, ground + 66, 330, 0.18, '#06061a');
  palm(ctx, W - 66, ground + 60, 360, -0.16, '#06061a');
  return c;
}

// ---------------------------------------------------------------- Scene C
// Beach day: bright sky, turquoise sea, a speedboat with a foam wake, a
// lifeguard tower, a striped umbrella and soft speckled sand.
function paintBeachDay() {
  const c = sceneCanvas();
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const seaTop = H * 0.34;
  const sandTop = H * 0.74;
  const rand = rng(5150);

  ctx.fillStyle = vGrad(ctx, 0, seaTop, [[0, '#1d7fd1'], [0.7, '#63b8ec'], [1, '#bfe8ff']]);
  ctx.fillRect(0, 0, W, seaTop);
  // Sun with short rays, upper right.
  const sunX = W * 0.82;
  const sunY = H * 0.14;
  ctx.strokeStyle = 'rgba(255,224,130,0.85)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(a) * 92, sunY + Math.sin(a) * 92);
    ctx.lineTo(sunX + Math.cos(a) * 128, sunY + Math.sin(a) * 128);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe98a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
  ctx.fill();
  // Puffy clouds from ellipse clusters.
  function cloud(x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for (const [dx, dy, r] of [[0, 0, 46], [52, 8, 36], [-54, 10, 34], [8, -20, 38], [96, 16, 26]]) {
      ctx.beginPath();
      ctx.ellipse(x + dx * s, y + dy * s, r * s, r * 0.62 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  cloud(300, 130, 1.15);
  cloud(760, 84, 0.8);
  cloud(1240, 170, 0.95);
  cloud(1640, 250, 0.66);

  // Sea.
  ctx.fillStyle = vGrad(ctx, seaTop, sandTop, [[0, '#37b6d9'], [0.55, '#1f9ec4'], [1, '#57c9dd']]);
  ctx.fillRect(0, seaTop, W, sandTop - seaTop);
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.12 + rand() * 0.3})`;
    ctx.lineWidth = 3 + rand() * 3;
    const ry = seaTop + 16 + rand() * (sandTop - seaTop - 30);
    const rx = rand() * W;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 30 + rand() * 110, ry);
    ctx.stroke();
  }

  // Speedboat with a fan of foam wake.
  const boatX = W * 0.56;
  const boatY = seaTop + (sandTop - seaTop) * 0.42;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(boatX - 330, boatY + 66);
  ctx.quadraticCurveTo(boatX - 120, boatY + 26, boatX + 30, boatY + 52);
  ctx.quadraticCurveTo(boatX - 90, boatY + 84, boatX - 330, boatY + 88);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(boatX - 60, boatY + 30);
  ctx.lineTo(boatX + 250, boatY + 22);
  ctx.quadraticCurveTo(boatX + 330, boatY + 24, boatX + 322, boatY + 52);
  ctx.quadraticCurveTo(boatX + 200, boatY + 78, boatX + 40, boatY + 74);
  ctx.lineTo(boatX - 60, boatY + 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e3352b';
  ctx.fillRect(boatX - 58, boatY + 44, 372, 13);
  ctx.fillStyle = '#173a5e';
  ctx.beginPath();
  ctx.moveTo(boatX + 120, boatY + 22);
  ctx.lineTo(boatX + 168, boatY - 16);
  ctx.lineTo(boatX + 226, boatY - 14);
  ctx.lineTo(boatX + 252, boatY + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2f5f7';
  ctx.fillRect(boatX + 60, boatY + 2, 210, 12);

  // Sand, its foam edge, and speckle.
  ctx.fillStyle = vGrad(ctx, sandTop, H, [[0, '#ffe3a1'], [1, '#f7c873']]);
  ctx.fillRect(0, sandTop, W, H - sandTop);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(0, sandTop);
  for (let x = 0; x <= W; x += 80) {
    ctx.quadraticCurveTo(x + 40, sandTop + 14 + rand() * 10, x + 80, sandTop + 2);
  }
  ctx.lineTo(W, sandTop + 26);
  ctx.lineTo(0, sandTop + 26);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(190,130,50,${0.12 + rand() * 0.2})`;
    ctx.fillRect(rand() * W, sandTop + 40 + rand() * (H - sandTop - 50), 4, 3);
  }

  // Lifeguard tower: legs, braces, ramp, cabin, roof.
  const tx = 300;
  const tBase = H * 0.985;
  const tTop = H * 0.52;
  ctx.strokeStyle = '#8c4a21';
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx - 92, tBase);
  ctx.lineTo(tx - 44, tTop + 130);
  ctx.moveTo(tx + 92, tBase);
  ctx.lineTo(tx + 44, tTop + 130);
  ctx.moveTo(tx - 78, tBase - 120);
  ctx.lineTo(tx + 66, tTop + 190);
  ctx.moveTo(tx + 78, tBase - 120);
  ctx.lineTo(tx - 66, tTop + 190);
  ctx.stroke();
  ctx.strokeStyle = '#a35c28';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(tx + 40, tTop + 150);
  ctx.lineTo(tx + 250, tBase - 6);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tx - 118, tTop, 236, 138);
  ctx.fillStyle = '#e3352b';
  ctx.fillRect(tx - 118, tTop + 100, 236, 38);
  ctx.fillStyle = '#173a5e';
  ctx.fillRect(tx - 84, tTop + 26, 168, 52);
  ctx.fillStyle = '#e3352b';
  ctx.beginPath();
  ctx.moveTo(tx - 142, tTop + 6);
  ctx.lineTo(tx, tTop - 66);
  ctx.lineTo(tx + 142, tTop + 6);
  ctx.closePath();
  ctx.fill();

  // Striped beach umbrella on a tilted pole.
  const ux = W * 0.8;
  const uy = H * 0.8;
  ctx.strokeStyle = '#8c4a21';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(ux + 26, uy + 190);
  ctx.lineTo(ux - 10, uy);
  ctx.stroke();
  const stripes = ['#e3352b', '#ffffff'];
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI * (1 + i / 6);
    const a1 = Math.PI * (1 + (i + 1) / 6);
    ctx.fillStyle = stripes[i % 2];
    ctx.beginPath();
    ctx.moveTo(ux - 10, uy);
    ctx.arc(ux - 10, uy, 190, a0, a1);
    ctx.closePath();
    ctx.fill();
  }

  palm(ctx, W - 40, H * 1.01, 470, -0.42, '#2e7d46');
  return c;
}

// ---------------------------------------------------------------- Scene D
// Downtown dusk skyline (new in v3): a low sun sinking between towers,
// three depth layers of buildings with lit windows, rooftop clutter, a
// helicopter crossing the sun, and a foreground avenue of streetlights.
function paintDowntownDusk() {
  const c = sceneCanvas();
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const base = H * 0.88;
  const rand = rng(60221);

  // Dusk sky: indigo up top melting through violet to a tangerine band.
  ctx.fillStyle = vGrad(ctx, 0, base, [
    [0, '#160a33'], [0.34, '#3d1663'], [0.58, '#8c2a6d'], [0.78, '#e85d75'], [0.93, '#ff9a52'], [1, '#ffc46b'],
  ]);
  ctx.fillRect(0, 0, W, base);
  cloudBands(ctx, rand, 20, W, base * 0.5, ['#2a1052', '#6d2066', '#ff8a7a'], 0.42);

  // The sun: a huge disc low on the centre line, half sunk behind towers.
  const sunX = W * 0.52;
  const sunY = base - H * 0.10;
  const halo = ctx.createRadialGradient(sunX, sunY, 60, sunX, sunY, 560);
  halo.addColorStop(0, 'rgba(255,190,100,0.8)');
  halo.addColorStop(0.55, 'rgba(255,130,90,0.28)');
  halo.addColorStop(1, 'rgba(255,130,90,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 580, sunY - 580, 1160, 1160);
  ctx.fillStyle = '#ffcf7d';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 185, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe3a3';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 152, 0, Math.PI * 2);
  ctx.fill();

  // Window light colours, warm and cool.
  const winCols = ['#ffd98a', '#ffe9b0', '#9be8ff', '#ffb37a'];

  // One tower: a silhouette slab with a lit-window grid and, optionally,
  // rooftop clutter (water tank, antenna, beacon). `tone` is its body
  // colour; nearer layers pass darker tones and denser windows.
  function tower(x, w, top, tone, density, clutter) {
    ctx.fillStyle = tone;
    ctx.fillRect(x, top, w, base - top);
    const cols = Math.max(2, Math.floor(w / 40));
    const rows = Math.max(4, Math.floor((base - top) / 46));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rand() > density) continue;
        ctx.fillStyle = winCols[Math.floor(rand() * winCols.length)];
        ctx.globalAlpha = 0.45 + rand() * 0.55;
        ctx.fillRect(x + 8 + i * ((w - 16) / cols), top + 12 + j * ((base - top - 20) / rows), 13, 18);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = tone;
    if (clutter === 'tank') {
      const cx = x + w * 0.5;
      ctx.fillRect(cx - 26, top - 44, 52, 44);
      ctx.beginPath();
      ctx.moveTo(cx - 32, top - 44);
      ctx.lineTo(cx, top - 62);
      ctx.lineTo(cx + 32, top - 44);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - 20, top - 6, 6, 8);
      ctx.fillRect(cx + 14, top - 6, 6, 8);
    } else if (clutter === 'antenna') {
      const cx = x + w * 0.5;
      ctx.fillRect(cx - 3, top - 74, 6, 74);
      ctx.fillRect(cx - 18, top - 58, 36, 5);
      ctx.fillStyle = '#ff4d5e';
      ctx.beginPath();
      ctx.arc(cx, top - 78, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (clutter === 'spire') {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.28, top);
      ctx.lineTo(x + w * 0.5, top - 56);
      ctx.lineTo(x + w * 0.72, top);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Far layer: hazy violet slabs.
  tower(40, 210, 300, '#4a2060', 0.30, 'antenna');
  tower(300, 170, 380, '#4a2060', 0.26, null);
  tower(1180, 190, 340, '#4a2060', 0.30, 'tank');
  tower(1420, 230, 280, '#4a2060', 0.28, 'antenna');
  tower(1700, 180, 400, '#4a2060', 0.24, null);
  // Haze band softening the far layer's feet.
  const haze = ctx.createLinearGradient(0, base - 190, 0, base);
  haze.addColorStop(0, 'rgba(255,150,110,0)');
  haze.addColorStop(1, 'rgba(255,150,110,0.30)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, base - 190, W, 190);

  // Mid layer: deeper purple, busier windows.
  tower(120, 250, 210, '#2e1247', 0.44, 'spire');
  tower(430, 200, 300, '#2e1247', 0.4, 'tank');
  tower(1290, 260, 190, '#2e1247', 0.46, 'antenna');
  tower(1590, 210, 260, '#2e1247', 0.42, null);

  // A helicopter crossing the sun, tiny and black.
  ctx.fillStyle = '#1c0a33';
  const hx = sunX - 60;
  const hy = sunY - 40;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 44, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx + 36, hy - 4, 58, 7);
  ctx.fillRect(hx + 88, hy - 14, 7, 22);
  ctx.fillRect(hx - 74, hy - 24, 148, 5);
  ctx.fillRect(hx - 20, hy + 15, 44, 5);

  // Near layer: near-black towers framing the avenue.
  tower(-30, 300, 130, '#150826', 0.55, 'tank');
  tower(660, 170, 330, '#150826', 0.5, null);
  tower(1010, 180, 280, '#150826', 0.52, 'antenna');
  tower(1660, 300, 90, '#150826', 0.58, 'spire');

  // The avenue: a dark foreground strip with a centre line of streetlight
  // pools shrinking toward the sun, and two streams of car lights.
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, base, W, H - base);
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    const ly = base + 14 + t * (H - base - 24);
    const spread = 60 + t * 620;
    const r = 4 + t * 17;
    for (const side of [-1, 1]) {
      const lx = W / 2 + side * spread;
      const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, r * 2.6);
      glow.addColorStop(0, 'rgba(255,205,120,0.9)');
      glow.addColorStop(1, 'rgba(255,180,100,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, r * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe9b0';
      ctx.beginPath();
      ctx.arc(lx, ly, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Car lights: white dots streaming left, red dots streaming right.
  for (let i = 0; i < 26; i++) {
    const t = rand();
    const ly = base + 20 + t * (H - base - 30);
    const lx = W / 2 - 30 - t * 700 + (rand() - 0.5) * 60;
    ctx.fillStyle = 'rgba(255,246,220,0.9)';
    ctx.beginPath();
    ctx.arc(lx, ly, 2 + t * 5, 0, Math.PI * 2);
    ctx.fill();
    const rx = W / 2 + 30 + t * 700 + (rand() - 0.5) * 60;
    ctx.fillStyle = 'rgba(255,70,80,0.9)';
    ctx.beginPath();
    ctx.arc(rx, ly, 2 + t * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  birds(ctx, rand, 5, 200, 700, 80, 220, 'rgba(22,8,40,0.75)', 5);
  return c;
}

// ---------------------------------------------------------------- Scene E
// Palm highway (new in v3): a two-lane road falling away to a sunset
// horizon, palm rows receding on both verges, and a sports car seen from
// behind — wide haunches, a spoiler, and a full-width tail-light bar.
function paintPalmHighway() {
  const c = sceneCanvas();
  const ctx = c.getContext('2d');
  const W = SCENE_WIDTH;
  const H = SCENE_HEIGHT;
  const horizon = H * 0.58;
  const vx = W * 0.52; // the road's vanishing point
  const rand = rng(24601);

  // Late-afternoon sky, teal up top warming to peach at the horizon.
  ctx.fillStyle = vGrad(ctx, 0, horizon, [
    [0, '#1b5f7a'], [0.45, '#4aa3a2'], [0.75, '#f2b879'], [1, '#ffd9a0'],
  ]);
  ctx.fillRect(0, 0, W, horizon);
  cloudBands(ctx, rand, 16, W, horizon * 0.55, ['#155e75', '#f7c489', '#fff1d6'], 0.4);
  // Low sun just left of the vanishing point.
  const sunX = vx - 190;
  const sunY = horizon - 66;
  const halo = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 300);
  halo.addColorStop(0, 'rgba(255,220,150,0.9)');
  halo.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 320, sunY - 320, 640, 640);
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();

  // Distant ridge behind the road's end.
  ctx.fillStyle = '#7a4a63';
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.quadraticCurveTo(W * 0.22, horizon - 88, W * 0.44, horizon - 18);
  ctx.quadraticCurveTo(W * 0.62, horizon + 6, W * 0.8, horizon - 40);
  ctx.quadraticCurveTo(W * 0.92, horizon - 58, W, horizon - 22);
  ctx.lineTo(W, horizon);
  ctx.closePath();
  ctx.fill();

  // Verges: warm scrub ground either side of the asphalt.
  ctx.fillStyle = vGrad(ctx, horizon, H, [[0, '#c98a54'], [0.5, '#a5663a'], [1, '#7c4526']]);
  ctx.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(90,50,20,${0.10 + rand() * 0.18})`;
    const gy = horizon + rand() * (H - horizon);
    ctx.fillRect(rand() * W, gy, 5 + rand() * 16, 3);
  }

  // The road: a trapezoid from the vanishing point to the full bottom edge.
  const roadTopHalf = 66;
  const roadBotHalf = 760;
  ctx.fillStyle = vGrad(ctx, horizon, H, [[0, '#4c4a58'], [0.4, '#3a3844'], [1, '#2b2933']]);
  ctx.beginPath();
  ctx.moveTo(vx - roadTopHalf, horizon);
  ctx.lineTo(vx + roadTopHalf, horizon);
  ctx.lineTo(vx + roadBotHalf, H);
  ctx.lineTo(vx - roadBotHalf, H);
  ctx.closePath();
  ctx.fill();
  // Edge lines converging on the vanishing point.
  ctx.strokeStyle = 'rgba(255,244,214,0.92)';
  ctx.lineCap = 'round';
  for (const [topOff, botOff, wTop, wBot] of [[-58, -690, 3, 15], [58, 690, 3, 15]]) {
    ctx.lineWidth = wBot;
    ctx.beginPath();
    ctx.moveTo(vx + topOff, horizon);
    ctx.lineTo(vx + botOff, H);
    ctx.stroke();
  }
  // Centre dashes, swelling as they approach.
  ctx.fillStyle = '#ffd94d';
  for (let i = 0; i < 7; i++) {
    const t = Math.pow(i / 7, 1.6);
    const t2 = Math.pow((i + 0.45) / 7, 1.6);
    const y1 = horizon + t * (H - horizon);
    const y2 = horizon + t2 * (H - horizon);
    const w1 = 3 + t * 20;
    const w2 = 3 + t2 * 20;
    ctx.beginPath();
    ctx.moveTo(vx - w1 / 2, y1);
    ctx.lineTo(vx + w1 / 2, y1);
    ctx.lineTo(vx + w2 / 2, y2);
    ctx.lineTo(vx - w2 / 2, y2);
    ctx.closePath();
    ctx.fill();
  }

  // Palm rows on both verges, receding: each is planted on the road's edge
  // line and scaled by its depth, so the rows converge with the road.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const gy = horizon + Math.pow(t, 1.5) * (H - horizon) * 0.94;
      const gx = vx + side * (110 + Math.pow(t, 1.35) * 800);
      const s = 60 + Math.pow(t, 1.4) * 430;
      palm(ctx, gx, gy, s, side * -0.14, t < 0.4 ? '#5c3a2e' : '#40231c');
    }
  }

  // A road sign on the right verge: green board, white arrow chevron.
  const sgx = vx + 470;
  const sgy = horizon + 120;
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(sgx - 6, sgy, 12, 120);
  ctx.fillStyle = '#177a4c';
  ctx.beginPath();
  ctx.roundRect(sgx - 92, sgy - 104, 184, 96, 10);
  ctx.fill();
  ctx.strokeStyle = '#f4f8f2';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sgx - 44, sgy - 82);
  ctx.lineTo(sgx + 30, sgy - 56);
  ctx.lineTo(sgx - 44, sgy - 30);
  ctx.stroke();

  // The sports car, from behind, low and wide in the right lane: shadow,
  // haunches, cabin glass, a blade spoiler, and the tail-light bar glowing.
  ctx.save();
  ctx.translate(W * 0.60, H * 0.865);
  ctx.fillStyle = 'rgba(12, 4, 10, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 118, 400, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rear body.
  const bodyGrad = ctx.createLinearGradient(0, -40, 0, 118);
  bodyGrad.addColorStop(0, '#3d0f2e');
  bodyGrad.addColorStop(0.55, '#24081d');
  bodyGrad.addColorStop(1, '#15040f');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-360, 108);
  ctx.quadraticCurveTo(-372, 40, -330, 8);
  ctx.quadraticCurveTo(-300, -14, -210, -20);
  ctx.lineTo(210, -20);
  ctx.quadraticCurveTo(300, -14, 330, 8);
  ctx.quadraticCurveTo(372, 40, 360, 108);
  ctx.quadraticCurveTo(300, 122, 200, 118);
  ctx.lineTo(-200, 118);
  ctx.quadraticCurveTo(-300, 122, -360, 108);
  ctx.closePath();
  ctx.fill();
  // Cabin glass, a dark canopy inset.
  ctx.fillStyle = '#0d1626';
  ctx.beginPath();
  ctx.moveTo(-190, -18);
  ctx.quadraticCurveTo(-160, -86, -84, -96);
  ctx.lineTo(96, -96);
  ctx.quadraticCurveTo(168, -84, 192, -18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(140, 200, 235, 0.35)';
  ctx.beginPath();
  ctx.moveTo(-150, -30);
  ctx.quadraticCurveTo(-128, -76, -70, -84);
  ctx.lineTo(30, -84);
  ctx.quadraticCurveTo(-40, -60, -60, -30);
  ctx.closePath();
  ctx.fill();
  // Spoiler blade on two uprights.
  ctx.fillStyle = '#12030d';
  ctx.fillRect(-52, -104, 14, 44);
  ctx.fillRect(38, -104, 14, 44);
  ctx.beginPath();
  ctx.moveTo(-238, -118);
  ctx.lineTo(238, -118);
  ctx.quadraticCurveTo(258, -116, 254, -102);
  ctx.lineTo(-254, -102);
  ctx.quadraticCurveTo(-258, -116, -238, -118);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff9a5c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-252, -104);
  ctx.lineTo(252, -104);
  ctx.stroke();
  // Tail-light bar: a full-width red glow with a brighter core.
  ctx.save();
  ctx.shadowColor = '#ff2e4d';
  ctx.shadowBlur = 42;
  ctx.fillStyle = '#ff2e4d';
  ctx.beginPath();
  ctx.roundRect(-318, 22, 636, 17, 8);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffc2cc';
  ctx.beginPath();
  ctx.roundRect(-318, 27, 636, 6, 3);
  ctx.fill();
  // Its reflection pooled on the asphalt.
  ctx.fillStyle = 'rgba(255,46,77,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 138, 330, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Diffuser and twin exhausts.
  ctx.fillStyle = '#08040a';
  ctx.fillRect(-210, 92, 420, 22);
  for (const ex of [-268, 268]) {
    ctx.fillStyle = '#0a0a10';
    ctx.beginPath();
    ctx.ellipse(ex, 96, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8fa3b8';
    ctx.beginPath();
    ctx.ellipse(ex, 96, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1b24';
    ctx.beginPath();
    ctx.ellipse(ex, 96, 15, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Rear tyres, wider than the body at the haunches.
  for (const tx of [-352, 352]) {
    ctx.fillStyle = '#07050a';
    ctx.beginPath();
    ctx.roundRect(tx - 42, 30, 84, 92, 16);
    ctx.fill();
  }
  // A sunset rim along the roofline and spoiler.
  ctx.strokeStyle = 'rgba(255,170,100,0.85)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-186, -20);
  ctx.quadraticCurveTo(-158, -88, -82, -98);
  ctx.lineTo(98, -98);
  ctx.quadraticCurveTo(170, -86, 194, -20);
  ctx.stroke();
  ctx.restore();

  birds(ctx, rand, 6, 120, W * 0.4, 70, 240, 'rgba(20,40,50,0.7)', 5);
  return c;
}

// The scene catalogue: id, display name and painter for each illustrated
// sample, in the order the editor deals them.
export const SCENE_DEFS = [
  { id: 'scene-pier', name: 'Sunset Pier (illustrated)', paint: paintSunsetPier },
  { id: 'scene-skyline', name: 'Downtown Dusk (illustrated)', paint: paintDowntownDusk },
  { id: 'scene-neon', name: 'Neon Boulevard (illustrated)', paint: paintNeonBoulevard },
  { id: 'scene-highway', name: 'Palm Highway (illustrated)', paint: paintPalmHighway },
  { id: 'scene-beach', name: 'Beach Day (illustrated)', paint: paintBeachDay },
];

// Paint every scene once and return them as picture entries whose `source`
// is a canvas the rest of the app draws from like any loaded photograph.
export function buildScenes() {
  return SCENE_DEFS.map((def) => {
    const canvas = def.paint();
    return { id: def.id, name: def.name, source: canvas, width: canvas.width, height: canvas.height, kind: 'scene' };
  });
}
