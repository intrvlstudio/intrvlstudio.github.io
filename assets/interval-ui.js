(() => {
  const buttons = [...document.querySelectorAll('[data-lang]')];
  function setLanguage(lang) {
    if (!['zh-TW', 'en', 'ko'].includes(lang)) return;
    document.documentElement.lang = lang;
    buttons.forEach(button => {
      const active = button.dataset.lang === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('intrvl_lang', lang); } catch {}
  }
  let language = 'zh-TW';
  try { language = localStorage.getItem('intrvl_lang') || language; } catch {}
  setLanguage(language);
  buttons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  const top = document.getElementById('scrollTop');
  const syncTop = () => top.classList.toggle('visible', scrollY > 600);
  addEventListener('scroll', syncTop, { passive: true });
  syncTop();
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));

  let posts = [], category = 'all';
  const board = document.querySelector('.board-items');
  const empty = board.innerHTML;
  function render() {
    board.replaceChildren();
    posts.filter(post => category === 'all' || post.category === category).forEach(post => {
      let url;
      try { url = new URL(post.url); } catch { return; }
      if (url.protocol !== 'https:' || url.hostname !== 'www.instagram.com' || !/^\/(p|reel)\/[^/]+\/?$/.test(url.pathname)) return;
      const link = document.createElement('a');
      link.className = 'announcement';
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = (post.title || 'Instagram') + ' ↗';
      board.append(link);
    });
    if (!board.childElementCount) board.innerHTML = empty;
  }
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  }));
  async function refresh() {
    try {
      const response = await fetch('assets/announcements.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      posts = Array.isArray(data.posts) ? data.posts : [];
      render();
    } catch { /* Keep the official account link usable when offline. */ }
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
