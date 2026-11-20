// sample-photos.js — the two photographic samples bundled with the app.
//
// They ship inside app/samples/ and were made for make.fun entrants to use
// freely. This module names them and loads them as HTMLImageElements; the
// illustrated scenes from sample-scenes.js join the same picture list, and
// so do the user's own uploads.

export const SAMPLE_PHOTOS = [
  { id: 'photo-pier', name: 'Pier at Dusk (photo)', src: './samples/pier.jpg' },
  { id: 'photo-boulevard', name: 'Boulevard (photo)', src: './samples/boulevard.jpg' },
];

// Load one bundled sample photo; resolves to a picture entry shaped like
// the scene entries ({ id, name, source, width, height, kind }).
export function loadSamplePhoto(def) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      id: def.id,
      name: def.name,
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      kind: 'photo',
    });
    img.onerror = () => reject(new Error('Could not load sample ' + def.src));
    img.src = def.src;
  });
}

// Load every bundled photographic sample, in catalogue order.
export function loadSamplePhotos() {
  return Promise.all(SAMPLE_PHOTOS.map(loadSamplePhoto));
}

// Read a user-picked file into a picture entry. The file never leaves the
// machine: it is decoded from a local object URL, and that URL is revoked
// as soon as the image has loaded.
export function loadUploadedPhoto(file, index) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        id: 'upload-' + Date.now() + '-' + index,
        name: file.name.replace(/\.[^.]+$/, '') || 'Your photo',
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        kind: 'upload',
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read ' + file.name));
    };
    img.src = url;
  });
}
