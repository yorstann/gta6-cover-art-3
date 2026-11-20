// export-cover.js — full-size PNG export through the same render pipeline
// the preview uses, so the file a user downloads is the cover they saw,
// only bigger: 1080 x 1080, 1080 x 1350 or 1920 x 1080.

import { renderCover, exportSize } from './render-cover.js';

// Render the current state at an export size onto a fresh canvas and hand
// it back; used by the download path and by screenshot tooling alike.
export function renderExportCanvas(state, photosById, sizeId) {
  const size = exportSize(sizeId);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), state, photosById, size.w, size.h);
  return canvas;
}

// A filesystem-friendly file name from the caption: "PALMERA HEAT" becomes
// "palmera-heat-cover.png". Falls back to a plain name for empty captions.
export function exportFileName(state, sizeId) {
  const slug = String(state.caption || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (slug || 'vice-frame') + '-cover-' + sizeId + '.png';
}

// Render and download the cover as a PNG in the chosen size.
export function exportPNG(state, photosById, sizeId) {
  const canvas = renderExportCanvas(state, photosById, sizeId);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The browser could not encode the PNG.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName(state, sizeId);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(a.download);
    }, 'image/png');
  });
}
