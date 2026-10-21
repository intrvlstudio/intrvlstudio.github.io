/* Homepage images the staff portal can replace.
   The portal publishes /assets/site/home.json ({ "version": 1, "slots": { "<slot>": "/assets/site/img/<hash>.webp" } }).
   This file only reads it. A missing file, bad JSON, an unknown slot or any path outside /assets/site/img/ is ignored,
   so the page falls back to its built-in image and looks exactly as it did before anything was published. */
(() => {
  'use strict';
  const SLOT = /^[a-z]+(\.[a-z-]+)?$/;
  const SAFE_IMG = /^\/assets\/site\/img\/[a-f0-9]{16}\.webp$/;
  const slots = Object.create(null);
  const ready = fetch('/assets/site/home.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : null))
    .then(doc => {
      const list = doc && typeof doc === 'object' && doc.slots && typeof doc.slots === 'object' ? doc.slots : {};
      for (const id of Object.keys(list)) if (SLOT.test(id) && typeof list[id] === 'string' && SAFE_IMG.test(list[id])) slots[id] = list[id];
    })
    .catch(() => {});
  window.INTRVLSlots = { ready, get: (id, fallback) => slots[id] || fallback };
})();
