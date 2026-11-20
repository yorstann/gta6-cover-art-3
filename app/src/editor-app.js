// editor-app.js — the Vice Frame 3 editor: state, controls, live preview,
// history, and boot.
//
// Everything the user touches lives here; the drawing is delegated to
// render-cover.js (preview and export share it), export-cover.js (PNG
// downloads), caption-lettering.js, color-grades.js and cover-templates.js.
// New in this version: per-panel grades in the panel list, a rotatable
// starburst badge, a bottom banner strip, Cover Lines headlines, undo/redo
// history, and a "Surprise me" randomiser that deals from curated looks
// instead of rolling dice blindly.
//
// The app also answers the ?shot= deep links described in shots.json,
// which set up a named picture, caption, size, template, grades and
// furniture and (for shot=cover) present the cover full-bleed so it can be
// captured exactly as exported.

import { TEMPLATES, templateById } from './cover-templates.js';
import { GRADES, GRADE_HARMONIES } from './color-grades.js';
import { CAPTION_THEMES } from './caption-lettering.js';
import { EXPORT_SIZES, renderCover } from './render-cover.js';
import { exportPNG, renderExportCanvas } from './export-cover.js';
import { loadSamplePhotos, loadUploadedPhoto } from './sample-photos.js';
import { buildScenes } from './sample-scenes.js';
import {
  DEFAULT_DEAL_ORDER,
  dealPlacements,
  resizePlacements,
  fillAllPanels,
  panelAtPoint,
  polygonBox,
  clamp,
} from './photo-panels.js';

const $ = (id) => document.getElementById(id);

// The editor's single state object; renderCover reads exactly this shape.
const state = {
  template: 'vice-grid',
  grade: 'sunset',
  size: 'landscape',
  caption: 'PALMERA HEAT',
  subcaption: 'ONE CITY • NO BRAKES',
  captionTheme: 'sunset',
  captionPos: 'bottom',
  captionScale: 1,
  skew: true,
  badge: { on: true, text: 'PALMERA CITY', angle: -10 },
  banner: { on: false, text: 'THE HEAT ISSUE — OUT NOW' },
  headlines: ['VICE CITY HEAT WAVE', 'THE GETAWAY ISSUE', 'PALMS, NEON & HORSEPOWER'],
  sunburst: true,
  halftone: true,
  placements: [],
  activePanel: 0,
};

let photos = [];
let photosById = new Map();
let shotMode = null;

function currentPanels() {
  return templateById(state.template).panels();
}

// ---------------------------------------------------------------- history
// Undo/redo: snapshots of the whole editable state (minus the panel
// selection), pushed on committed changes. Text inputs push debounced, so
// a burst of typing is one undo step.
let undoStack = [];
let redoStack = [];
let historyTimer = null;
let restoring = false;

function snapshot() {
  return JSON.stringify({
    template: state.template,
    grade: state.grade,
    caption: state.caption,
    subcaption: state.subcaption,
    captionTheme: state.captionTheme,
    captionPos: state.captionPos,
    captionScale: state.captionScale,
    skew: state.skew,
    badge: state.badge,
    banner: state.banner,
    headlines: state.headlines,
    sunburst: state.sunburst,
    halftone: state.halftone,
    placements: state.placements,
  });
}

function pushHistory(immediate) {
  if (restoring) return;
  const commit = () => {
    historyTimer = null;
    const snap = snapshot();
    if (undoStack[undoStack.length - 1] === snap) return;
    undoStack.push(snap);
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    syncHistoryButtons();
  };
  if (immediate) {
    if (historyTimer) clearTimeout(historyTimer);
    commit();
  } else {
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(commit, 350);
  }
}

function restore(snap) {
  const data = JSON.parse(snap);
  restoring = true;
  Object.assign(state, data);
  state.activePanel = Math.min(state.activePanel, currentPanels().length - 1);
  syncAllControls();
  restoring = false;
  requestPaint();
}

function undo() {
  if (historyTimer) {
    clearTimeout(historyTimer);
    historyTimer = null;
    pushHistory(true);
  }
  if (undoStack.length < 2) return;
  redoStack.push(undoStack.pop());
  restore(undoStack[undoStack.length - 1]);
  syncHistoryButtons();
  setStatus('Undone.');
}

function redo() {
  if (redoStack.length === 0) return;
  const snap = redoStack.pop();
  undoStack.push(snap);
  restore(snap);
  syncHistoryButtons();
  setStatus('Redone.');
}

function syncHistoryButtons() {
  $('undoBtn').disabled = undoStack.length < 2;
  $('redoBtn').disabled = redoStack.length === 0;
}

// ------------------------------------------------------------ picture deal
// Deal placements for the active template starting the deal at a given
// picture (the ?photo= deep link and the default first paint both use it).
function dealFrom(startPhotoId) {
  const count = currentPanels().length;
  if (!startPhotoId || !photosById.has(startPhotoId)) {
    state.placements = dealPlacements(count, photos);
    return;
  }
  const order = DEFAULT_DEAL_ORDER.filter((id) => photosById.has(id));
  const start = order.indexOf(startPhotoId);
  const rotated = start > 0 ? order.slice(start).concat(order.slice(0, start)) : order;
  const rest = photos.map((p) => p.id).filter((id) => !rotated.includes(id));
  const full = rotated.concat(rest);
  state.placements = Array.from({ length: count }, (_, i) => ({
    photoId: full.length ? full[i % full.length] : null,
    panX: 0,
    panY: 0,
    zoom: 1,
    gradeId: null,
  }));
}

// Preview resolution: the export aspect, capped so dragging stays fluid.
function previewDims() {
  const size = EXPORT_SIZES[state.size];
  const cap = state.size === 'portrait' ? 880 : 1152;
  const scale = Math.min(1, cap / size.w);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

const preview = $('preview');
const pctx = preview.getContext('2d');

// Paint the preview canvas from state, then (in the editor) outline the
// active panel so it is clear which panel the controls below are editing.
// In shot=cover mode the canvas already carries the export size and the
// cover is painted full-bleed at that size instead.
function paint() {
  if (shotMode === 'cover') {
    renderCover(pctx, state, photosById, preview.width, preview.height);
    return;
  }
  const { w, h } = previewDims();
  if (preview.width !== w) preview.width = w;
  if (preview.height !== h) preview.height = h;
  renderCover(pctx, state, photosById, w, h);
  const panels = currentPanels();
  const panel = panels[state.activePanel];
  if (panel) {
    pctx.save();
    pctx.strokeStyle = 'rgba(255, 207, 63, 0.95)';
    pctx.lineWidth = 3;
    pctx.setLineDash([12, 8]);
    pctx.beginPath();
    panel.points.forEach(([x, y], i) => {
      if (i === 0) pctx.moveTo(x * w, y * h);
      else pctx.lineTo(x * w, y * h);
    });
    pctx.closePath();
    pctx.stroke();
    pctx.restore();
  }
}

let paintQueued = false;
function requestPaint() {
  if (paintQueued) return;
  paintQueued = true;
  requestAnimationFrame(() => {
    paintQueued = false;
    paint();
  });
}

function setStatus(text) {
  $('status').textContent = text;
}

// ------------------------------------------------------------ photo strip
function buildStrip() {
  const strip = $('strip');
  strip.textContent = '';
  for (const photo of photos) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = photo.name + ' — click to put it in the selected panel';
    const thumb = document.createElement('canvas');
    thumb.width = 120;
    thumb.height = 84;
    const tctx = thumb.getContext('2d');
    const s = Math.max(120 / photo.width, 84 / photo.height);
    tctx.drawImage(photo.source, (120 - photo.width * s) / 2, (84 - photo.height * s) / 2, photo.width * s, photo.height * s);
    btn.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = photo.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      const placement = state.placements[state.activePanel];
      if (placement) {
        placement.photoId = photo.id;
        pushHistory(true);
        buildPanelList();
        requestPaint();
        setStatus(photo.name + ' is now in panel ' + (state.activePanel + 1) + '.');
      }
    });
    strip.appendChild(btn);
  }
}

// ------------------------------------------------------------- panel list
// One row per panel: a select for its picture, a select for its own grade
// ("Cover grade" leaves the panel on the cover-wide choice), and a zoom
// slider. Ink and headline panels say what they are instead of offering a
// picture they cannot show.
function buildPanelList() {
  const list = $('panels');
  list.textContent = '';
  const panels = currentPanels();
  state.placements.forEach((placement, i) => {
    const panel = panels[i];
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.activePanel ? ' active' : '');

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'panel-head';
    head.textContent =
      'Panel ' + (i + 1) +
      (panel && panel.hero ? ' · hero' : '') +
      (panel && panel.ink ? ' · caption band' : '') +
      (panel && panel.lines ? ' · cover lines' : '');
    head.addEventListener('click', () => {
      state.activePanel = i;
      buildPanelList();
      requestPaint();
    });
    row.appendChild(head);

    if (panel && panel.lines) {
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = 'Headline strips — edit them under “Cover lines”.';
      row.appendChild(note);
      list.appendChild(row);
      return;
    }

    const photoLabel = document.createElement('label');
    photoLabel.appendChild(Object.assign(document.createElement('span'), { textContent: 'Picture' }));
    const select = document.createElement('select');
    select.className = 'panel-photo';
    const inkOption = document.createElement('option');
    inkOption.value = '';
    inkOption.textContent = 'Solid ink';
    select.appendChild(inkOption);
    for (const photo of photos) {
      const opt = document.createElement('option');
      opt.value = photo.id;
      opt.textContent = photo.name;
      select.appendChild(opt);
    }
    select.value = placement.photoId || '';
    select.addEventListener('change', () => {
      placement.photoId = select.value || null;
      pushHistory(true);
      requestPaint();
    });
    photoLabel.appendChild(select);
    row.appendChild(photoLabel);

    const gradeLabel = document.createElement('label');
    gradeLabel.appendChild(Object.assign(document.createElement('span'), { textContent: 'Grade' }));
    const gradeSelect = document.createElement('select');
    gradeSelect.className = 'panel-grade';
    const coverOption = document.createElement('option');
    coverOption.value = '';
    coverOption.textContent = 'Cover grade';
    gradeSelect.appendChild(coverOption);
    for (const grade of GRADES) {
      const opt = document.createElement('option');
      opt.value = grade.id;
      opt.textContent = grade.name;
      gradeSelect.appendChild(opt);
    }
    gradeSelect.value = placement.gradeId || '';
    gradeSelect.addEventListener('change', () => {
      placement.gradeId = gradeSelect.value || null;
      pushHistory(true);
      requestPaint();
      setStatus('Panel ' + (i + 1) + ' now wears ' + (gradeSelect.value ? gradeSelect.selectedOptions[0].textContent : 'the cover grade') + '.');
    });
    gradeLabel.appendChild(gradeSelect);
    row.appendChild(gradeLabel);

    const zoomLabel = document.createElement('label');
    zoomLabel.appendChild(Object.assign(document.createElement('span'), { textContent: 'Zoom' }));
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.6';
    zoom.step = '0.02';
    zoom.value = String(placement.zoom);
    zoom.addEventListener('input', () => {
      placement.zoom = Number(zoom.value);
      pushHistory(false);
      requestPaint();
    });
    zoomLabel.appendChild(zoom);
    row.appendChild(zoomLabel);

    list.appendChild(row);
  });
}

// ----------------------------------------------------------- swatch groups
function buildSwatches(containerId, items, currentId, onPick) {
  const box = $(containerId);
  box.textContent = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch' + (item.id === currentId ? ' active' : '');
    btn.textContent = item.name;
    btn.title = item.blurb || item.name;
    btn.addEventListener('click', () => onPick(item.id));
    box.appendChild(btn);
  }
}

function buildTemplateSwatches() {
  buildSwatches('templates', TEMPLATES, state.template, (id) => {
    state.template = id;
    state.placements = resizePlacements(state.placements, currentPanels().length, photos);
    state.activePanel = Math.min(state.activePanel, currentPanels().length - 1);
    pushHistory(true);
    buildTemplateSwatches();
    buildPanelList();
    requestPaint();
  });
}

function buildGradeSwatches() {
  buildSwatches('grades', GRADES, state.grade, (id) => {
    state.grade = id;
    pushHistory(true);
    buildGradeSwatches();
    requestPaint();
  });
}

function buildThemeSwatches() {
  buildSwatches('themes', CAPTION_THEMES, state.captionTheme, (id) => {
    state.captionTheme = id;
    pushHistory(true);
    buildThemeSwatches();
    requestPaint();
  });
}

// ------------------------------------------------- preview pointer handling
let drag = null;

function previewPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
    px: event.clientX - rect.left,
    py: event.clientY - rect.top,
    w: rect.width,
    h: rect.height,
  };
}

preview.addEventListener('pointerdown', (event) => {
  const pt = previewPoint(event);
  const hit = panelAtPoint(currentPanels(), pt.x, pt.y);
  if (hit >= 0) {
    state.activePanel = hit;
    buildPanelList();
    requestPaint();
  }
  drag = { x: pt.px, y: pt.py };
  preview.setPointerCapture(event.pointerId);
});

preview.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const pt = previewPoint(event);
  const placement = state.placements[state.activePanel];
  const panel = currentPanels()[state.activePanel];
  if (!placement || !panel || panel.ink || panel.lines || !placement.photoId) return;
  const box = polygonBox(panel.points);
  const dx = pt.px - drag.x;
  const dy = pt.py - drag.y;
  placement.panX = clamp(placement.panX - (dx / (box.w * pt.w)) * 1.6, -1, 1);
  placement.panY = clamp(placement.panY - (dy / (box.h * pt.h)) * 1.6, -1, 1);
  drag = { x: pt.px, y: pt.py };
  requestPaint();
});

preview.addEventListener('pointerup', () => {
  if (drag) pushHistory(true);
  drag = null;
});

preview.addEventListener('wheel', (event) => {
  const placement = state.placements[state.activePanel];
  if (!placement) return;
  event.preventDefault();
  placement.zoom = clamp(placement.zoom * (event.deltaY < 0 ? 1.07 : 0.94), 1, 2.6);
  pushHistory(false);
  buildPanelList();
  requestPaint();
}, { passive: false });

// ----------------------------------------------------------------- uploads
async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) return;
  let added = 0;
  for (const file of images) {
    try {
      const photo = await loadUploadedPhoto(file, photos.length);
      photos.push(photo);
      photosById.set(photo.id, photo);
      added++;
      const placement = state.placements[state.activePanel];
      if (placement && added === 1) placement.photoId = photo.id;
    } catch {
      setStatus('One of those files could not be read as an image.');
    }
  }
  if (added > 0) {
    pushHistory(true);
    buildStrip();
    buildPanelList();
    requestPaint();
    setStatus(added + ' photo' + (added > 1 ? 's' : '') + ' added — your pictures never leave this machine.');
  }
}

$('upload').addEventListener('change', (event) => {
  addFiles(event.target.files);
  event.target.value = '';
});

for (const target of [preview, document.body]) {
  target.addEventListener('dragover', (event) => event.preventDefault());
  target.addEventListener('drop', (event) => {
    event.preventDefault();
    if (event.dataTransfer) addFiles(event.dataTransfer.files);
  });
}

// -------------------------------------------------------------- surprise me
// Curated looks: a template, a hero grade the panels harmonise with, a
// lettering theme and the furniture that suits them. "Surprise me" picks a
// look, deals the scenes through it, and lets supporting panels pick up
// harmonising grades — random, but never a combination that clashes.
const SURPRISE_LOOKS = [
  { template: 'vice-grid', grade: 'sunset', theme: 'sunset', badge: true, banner: false },
  { template: 'cover-lines', grade: 'neon', theme: 'neon', badge: true, banner: true },
  { template: 'slash', grade: 'neon', theme: 'neon', badge: true, banner: false },
  { template: 'poster', grade: 'golden', theme: 'sunset', badge: true, banner: true },
  { template: 'mosaic', grade: 'miami', theme: 'candy', badge: true, banner: false },
  { template: 'triptych', grade: 'golden', theme: 'chrome', badge: false, banner: false },
  { template: 'vice-grid', grade: 'noir', theme: 'chrome', badge: true, banner: true },
  { template: 'cover-lines', grade: 'sunset', theme: 'sunset', badge: true, banner: false },
  { template: 'poster', grade: 'miami', theme: 'candy', badge: true, banner: false },
  { template: 'slash', grade: 'sunset', theme: 'sunset', badge: false, banner: true },
];

function surpriseMe() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const look = pick(SURPRISE_LOOKS);
  state.template = look.template;
  state.grade = look.grade;
  state.captionTheme = look.theme;
  state.badge.on = look.badge;
  state.badge.angle = -30 + Math.floor(Math.random() * 61);
  state.banner.on = look.banner;
  // Deal the pictures in a shuffled order, scenes first so the hero is art.
  const scenes = photos.filter((p) => p.kind === 'scene');
  const rest = photos.filter((p) => p.kind !== 'scene');
  const shuffled = [...scenes].sort(() => Math.random() - 0.5).concat(rest);
  const harmony = GRADE_HARMONIES[look.grade] || [look.grade];
  const panels = currentPanels();
  state.placements = panels.map((panel, i) => {
    if (panel.ink || panel.lines) {
      return { photoId: null, panX: 0, panY: 0, zoom: 1, gradeId: null };
    }
    return {
      photoId: shuffled.length ? shuffled[i % shuffled.length].id : null,
      panX: (Math.random() - 0.5) * 0.4,
      panY: (Math.random() - 0.5) * 0.4,
      zoom: 1 + Math.random() * 0.35,
      // The hero keeps the look's grade; supporting panels may harmonise.
      gradeId: i === 0 || Math.random() < 0.45 ? null : pick(harmony),
    };
  });
  state.activePanel = 0;
  pushHistory(true);
  syncAllControls();
  requestPaint();
  setStatus('Surprise served: ' + templateById(state.template).name + ' in ' + look.grade + '. Roll again or fine-tune.');
}

// ----------------------------------------------------------------- controls
function syncAllControls() {
  $('caption').value = state.caption;
  $('subcaption').value = state.subcaption;
  $('captionPos').value = state.captionPos;
  $('captionScale').value = String(state.captionScale);
  $('skew').checked = state.skew;
  $('badgeOn').checked = state.badge.on;
  $('badgeText').value = state.badge.text;
  $('badgeAngle').value = String(state.badge.angle);
  $('bannerOn').checked = state.banner.on;
  $('bannerText').value = state.banner.text;
  $('sunburst').checked = state.sunburst;
  $('halftone').checked = state.halftone;
  document.querySelectorAll('.headline-input').forEach((input, i) => {
    input.value = state.headlines[i] || '';
  });
  buildTemplateSwatches();
  buildGradeSwatches();
  buildThemeSwatches();
  buildPanelList();
}

function bindControls() {
  $('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    pushHistory(false);
    requestPaint();
  });
  $('subcaption').addEventListener('input', (e) => {
    state.subcaption = e.target.value;
    pushHistory(false);
    requestPaint();
  });
  $('captionPos').addEventListener('change', (e) => {
    state.captionPos = e.target.value;
    pushHistory(true);
    requestPaint();
  });
  $('captionScale').addEventListener('input', (e) => {
    state.captionScale = Number(e.target.value);
    pushHistory(false);
    requestPaint();
  });
  $('skew').addEventListener('change', (e) => {
    state.skew = e.target.checked;
    pushHistory(true);
    requestPaint();
  });
  $('badgeOn').addEventListener('change', (e) => {
    state.badge.on = e.target.checked;
    pushHistory(true);
    requestPaint();
  });
  $('badgeText').addEventListener('input', (e) => {
    state.badge.text = e.target.value;
    pushHistory(false);
    requestPaint();
  });
  $('badgeAngle').addEventListener('input', (e) => {
    state.badge.angle = Number(e.target.value);
    pushHistory(false);
    requestPaint();
  });
  $('bannerOn').addEventListener('change', (e) => {
    state.banner.on = e.target.checked;
    pushHistory(true);
    requestPaint();
  });
  $('bannerText').addEventListener('input', (e) => {
    state.banner.text = e.target.value;
    pushHistory(false);
    requestPaint();
  });
  document.querySelectorAll('.headline-input').forEach((input, i) => {
    input.addEventListener('input', (e) => {
      state.headlines[i] = e.target.value;
      pushHistory(false);
      requestPaint();
    });
  });
  $('sunburst').addEventListener('change', (e) => {
    state.sunburst = e.target.checked;
    pushHistory(true);
    requestPaint();
  });
  $('halftone').addEventListener('change', (e) => {
    state.halftone = e.target.checked;
    pushHistory(true);
    requestPaint();
  });
  $('size').addEventListener('change', (e) => {
    state.size = e.target.value;
    requestPaint();
  });
  $('fillAll').addEventListener('click', () => {
    const placement = state.placements[state.activePanel];
    if (placement && placement.photoId) {
      state.placements = fillAllPanels(state.placements, placement.photoId);
      pushHistory(true);
      buildPanelList();
      requestPaint();
      setStatus('Every panel now shows the same picture, cropped by the layout.');
    }
  });
  $('surprise').addEventListener('click', surpriseMe);
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (event) => {
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const tag = (event.target && event.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if ((event.key.toLowerCase() === 'z' && event.shiftKey) || event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
    }
  });
  $('exportBtn').addEventListener('click', async () => {
    try {
      const name = await exportPNG(state, photosById, state.size);
      setStatus('Exported ' + name + ' — ready to post.');
    } catch (err) {
      setStatus(err.message);
    }
  });
}

// ------------------------------------------------------- deep links (?shot=)
function applyDeepLink() {
  const params = new URLSearchParams(location.search);
  shotMode = params.get('shot');
  if (params.get('caption')) state.caption = params.get('caption');
  if (params.get('sub')) state.subcaption = params.get('sub');
  if (params.get('size') && EXPORT_SIZES[params.get('size')]) {
    state.size = params.get('size');
    $('size').value = state.size;
  }
  if (params.get('template') && TEMPLATES.some((t) => t.id === params.get('template'))) {
    state.template = params.get('template');
  }
  if (params.get('grade') && GRADES.some((g) => g.id === params.get('grade'))) {
    state.grade = params.get('grade');
  }
  if (params.get('theme') && CAPTION_THEMES.some((t) => t.id === params.get('theme'))) {
    state.captionTheme = params.get('theme');
  }
  dealFrom(params.get('photo'));
  // Per-panel grades, comma-separated by panel index: ?pgrades=neon,,golden
  if (params.get('pgrades')) {
    params.get('pgrades').split(',').forEach((g, i) => {
      if (state.placements[i] && GRADES.some((gr) => gr.id === g)) state.placements[i].gradeId = g;
    });
  }
  if (params.get('badge') === '0') state.badge.on = false;
  if (params.get('badge') === '1') state.badge.on = true;
  if (params.get('badgetext')) state.badge.text = params.get('badgetext');
  if (params.get('angle') && Number.isFinite(Number(params.get('angle')))) {
    state.badge.angle = clamp(Number(params.get('angle')), -40, 40);
  }
  if (params.get('banner') === '1') state.banner.on = true;
  if (params.get('banner') === '0') state.banner.on = false;
  if (params.get('bannertext')) state.banner.text = params.get('bannertext');
  if (params.get('lines')) {
    state.headlines = params.get('lines').split('|').slice(0, 3);
    while (state.headlines.length < 3) state.headlines.push('');
  }
  if (shotMode === 'cover') {
    document.body.classList.add('shot-cover');
    // In cover mode the canvas is the whole page at export resolution.
    const size = EXPORT_SIZES[state.size];
    preview.width = size.w;
    preview.height = size.h;
  }
}

// --------------------------------------------------------------------- boot
async function boot() {
  bindControls();
  const samplePhotos = await loadSamplePhotos();
  photos = [...buildScenes(), ...samplePhotos];
  photosById = new Map(photos.map((p) => [p.id, p]));
  applyDeepLink();
  if (state.placements.length === 0) dealFrom(null);
  buildStrip();
  syncAllControls();
  paint();
  // Anton may land after the first paint; repaint once fonts are in.
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
    paint();
  }
  pushHistory(true);
  syncHistoryButtons();
  window.__viceFrame3 = {
    state,
    photos,
    photosById,
    addFiles,
    surpriseMe,
    undo,
    redo,
    exportPNG: (sizeId) => exportPNG(state, photosById, sizeId || state.size),
    renderExportCanvas: (sizeId) => renderExportCanvas(state, photosById, sizeId || state.size),
  };
  window.__viceFrameReady = true;
  if (shotMode) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    }));
  }
}

boot().catch((err) => {
  setStatus(err.message);
  window.__viceFrameReady = true;
  window.__shotReady = true;
});
