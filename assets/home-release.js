/* Home works card for Be My Portfolio: shows the teaser until its release time, then the cover.
   Release time is the same 2026-10-10 22:00 (Taiwan) used by stories.json and the works list. */
(() => {
  const cards = [...document.querySelectorAll('.works .work[data-release-at]')];
  let timer;
  function refresh() {
    clearTimeout(timer);
    for (let i = cards.length - 1; i >= 0; i--) {
      const card = cards[i], at = Date.parse(card.dataset.releaseAt);
      if (Date.now() < at) continue;
      const img = card.querySelector('[data-release-src]');
      img.src = img.dataset.releaseSrc; img.hidden = false;
      card.querySelector('.work-teaser').hidden = true;
      const note = card.querySelector('[data-release-after]');
      note.textContent = note.dataset.releaseAfter;
      card.setAttribute('aria-label', card.dataset.releaseLabel);
      cards.splice(i, 1);
    }
    if (cards.length) timer = setTimeout(refresh, Math.min(60000, Math.max(250, Math.min(...cards.map(c => Date.parse(c.dataset.releaseAt))) - Date.now())));
  }
  refresh();
  document.addEventListener('visibilitychange', refresh);
})();
