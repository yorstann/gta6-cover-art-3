// color-grades.js — the colour grades a panel can wear.
//
// In Vice Frame 3 a grade is no longer only a cover-wide choice: every panel
// placement can name its own grade, and the renderer falls back to the
// cover's grade for panels that do not. A grade is a canvas filter string
// (applied while the picture is drawn) plus a stack of gradient overlays in
// blend modes, painted over the drawn picture on the panel's own canvas.
//
// Neon Nights is the signature grade: a real split-tone. A teal multiply
// gradient bites hardest into the shadows while a magenta screen gradient
// lifts the highlights, so a warm photograph and a cool one both come out
// reading as neon night. Each grade also names an `ink`: the deep colour
// used for solid panels, headline strips and the cover's base coat.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    blurb: 'Warm dusk wash, magenta depths',
    filter: 'saturate(1.3) contrast(1.08) brightness(1.03)',
    ink: '#2b1030',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255,176,84,0.9)'], [0.55, 'rgba(255,94,116,0.55)'], [1, 'rgba(94,22,96,0.9)']] },
      { mode: 'screen', stops: [[0, 'rgba(255,150,70,0.20)'], [0.5, 'rgba(255,150,70,0)']] },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    blurb: 'Split-tone: teal shadows, magenta highlights',
    filter: 'saturate(1.55) contrast(1.16) brightness(1.03)',
    ink: '#070418',
    overlays: [
      // Split-tone part one — multiply teal. Multiply darkens in proportion
      // to luminance, so shadow areas drink the teal while lit areas keep
      // their colour; the gradient deepens toward the foot of the frame.
      { mode: 'multiply', stops: [[0, 'rgba(228,252,255,1)'], [0.55, 'rgba(122,226,234,1)'], [1, 'rgba(28,128,150,1)']] },
      // Split-tone part two — screen magenta, strongest at the top, pushing
      // highlights toward hot pink without touching the teal shadows.
      { mode: 'screen', stops: [[0, 'rgba(255,45,150,0.55)'], [0.45, 'rgba(255,45,150,0.10)'], [1, 'rgba(20,0,60,0)']] },
      // A soft-light clash pass so the midtones keep the pink/cyan fight.
      { mode: 'soft-light', stops: [[0, 'rgba(255,60,200,0.85)'], [1, 'rgba(0,220,230,0.85)']] },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    blurb: 'Honeyed light, gentle sepia',
    filter: 'saturate(1.18) contrast(1.05) brightness(1.08) sepia(0.22)',
    ink: '#33200d',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255,206,110,0.95)'], [1, 'rgba(158,88,28,0.9)']] },
      { mode: 'screen', stops: [[0, 'rgba(255,190,90,0.16)'], [0.6, 'rgba(255,190,90,0)']] },
    ],
  },
  {
    id: 'miami',
    name: 'Miami Pastel',
    blurb: 'Powder pink over aqua, soft and bright',
    filter: 'saturate(1.12) contrast(0.98) brightness(1.10)',
    ink: '#123a4a',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255,170,215,0.95)'], [1, 'rgba(90,220,215,0.9)']] },
      { mode: 'screen', stops: [[0, 'rgba(255,205,230,0.14)'], [1, 'rgba(120,235,225,0.10)']] },
    ],
  },
  {
    id: 'noir',
    name: 'Noir',
    blurb: 'Hard black and white, crushed blacks',
    filter: 'grayscale(1) contrast(1.3) brightness(1.05)',
    ink: '#0b0b0f',
    overlays: [
      { mode: 'soft-light', stops: [[0, 'rgba(255,255,255,0.7)'], [1, 'rgba(0,0,0,0.92)']] },
    ],
  },
  {
    id: 'raw',
    name: 'Raw',
    blurb: 'Nearly untouched, a touch of punch',
    filter: 'saturate(1.06) contrast(1.03)',
    ink: '#14161c',
    overlays: [],
  },
];

// Curated grade pairings the "Surprise me" randomiser draws from: a hero
// grade plus the grades its supporting panels may wear alongside it.
export const GRADE_HARMONIES = {
  sunset: ['sunset', 'golden', 'raw'],
  neon: ['neon', 'noir', 'raw'],
  golden: ['golden', 'sunset', 'raw'],
  miami: ['miami', 'sunset', 'raw'],
  noir: ['noir', 'raw', 'neon'],
  raw: ['raw', 'sunset', 'golden', 'neon'],
};

// Look a grade up by id, falling back to the first grade (Sunset).
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Paint a grade's overlay stack over a w x h context whose picture has
// already been drawn. Overlays are vertical gradients; the blend modes do
// the tonal work (multiply darkens, screen lightens, soft-light nudges).
export function applyGradeOverlays(ctx, grade, w, h) {
  for (const overlay of grade.overlays) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    for (const [at, color] of overlay.stops) grad.addColorStop(at, color);
    ctx.save();
    ctx.globalCompositeOperation = overlay.mode;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
