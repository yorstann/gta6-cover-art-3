// cover-templates.js — the six panel layouts a cover can be built from.
//
// Every template is a set of polygons in unit cover space (0..1 on both
// axes), so one layout adapts unchanged to the square, portrait and
// landscape export aspects. The first panel of each template is its hero:
// it takes the sunburst finish and the first picture dealt. Two panels are
// special: an `ink` panel paints solid colour (the Triptych caption band),
// and a `lines` panel (Cover Lines) paints the magazine headline strips
// the editor keeps in state.headlines.

// A plain rectangle panel from unit-space edges.
function rect(x0, y0, x1, y1, flags) {
  return { points: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], ...(flags || {}) };
}

export const TEMPLATES = [
  {
    id: 'vice-grid',
    name: 'Vice Grid',
    blurb: 'Hero panel, two stacked, one wide',
    panels() {
      return [
        rect(0, 0, 0.62, 0.66, { hero: true }),
        rect(0.62, 0, 1, 0.33),
        rect(0.62, 0.33, 1, 0.66),
        rect(0, 0.66, 1, 1),
      ];
    },
  },
  {
    id: 'slash',
    name: 'Slash',
    blurb: 'Three diagonal bands',
    panels() {
      return [
        { points: [[0, 0], [1, 0], [1, 0.26], [0, 0.5]], hero: true },
        { points: [[0, 0.5], [1, 0.26], [1, 0.58], [0, 0.82]] },
        { points: [[0, 0.82], [1, 0.58], [1, 1], [0, 1]] },
      ];
    },
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three verticals over a caption band',
    panels() {
      return [
        rect(0, 0, 0.3333, 0.8, { hero: true }),
        rect(0.3333, 0, 0.6667, 0.8),
        rect(0.6667, 0, 1, 0.8),
        // The caption band: a solid ink panel the lettering sits on.
        rect(0, 0.8, 1, 1, { ink: true }),
      ];
    },
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    blurb: 'One hero and five small panels',
    panels() {
      return [
        rect(0, 0, 0.62, 0.64, { hero: true }),
        rect(0.62, 0, 1, 0.32),
        rect(0.62, 0.32, 1, 0.64),
        rect(0, 0.64, 0.34, 1),
        rect(0.34, 0.64, 0.67, 1),
        rect(0.67, 0.64, 1, 1),
      ];
    },
  },
  {
    id: 'poster',
    name: 'Poster',
    blurb: 'Full-bleed hero, strip of three below',
    panels() {
      return [
        rect(0, 0, 1, 0.76, { hero: true }),
        rect(0, 0.76, 0.3333, 1),
        rect(0.3333, 0.76, 0.6667, 1),
        rect(0.6667, 0.76, 1, 1),
      ];
    },
  },
  {
    id: 'cover-lines',
    name: 'Cover Lines',
    blurb: 'Magazine style: hero with headline strips beside it',
    panels() {
      return [
        // The hero fills the right two-thirds, full height.
        rect(0.36, 0, 1, 1, { hero: true }),
        // The side rail: a picture up top…
        rect(0, 0, 0.36, 0.4),
        // …the headline strips in the middle (painted from state.headlines)…
        rect(0, 0.4, 0.36, 0.74, { lines: true }),
        // …and a second picture at the foot of the rail.
        rect(0, 0.74, 0.36, 1),
      ];
    },
  },
];

// Look a template up by id, falling back to the first (Vice Grid).
export function templateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
