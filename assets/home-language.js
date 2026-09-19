/* Each homepage URL contains one language, including when JavaScript is disabled. */
(() => {
  const lang = document.documentElement.lang;
  try { localStorage.setItem('intrvl_lang', lang); } catch {}
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-copyright-year]').forEach(el => {
    el.textContent = year > 2025 ? `2025–${year}` : '2025';
  });
  document.querySelectorAll('.lang-toggle a').forEach(link => {
    if (link.hreflang === lang) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', () => {
      link.hash = location.hash;
      try { localStorage.setItem('intrvl_lang', link.hreflang); } catch {}
    });
  });
})();
