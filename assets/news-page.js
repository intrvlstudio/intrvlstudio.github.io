/* /news/ — paginated, lazily loaded news list (zh / en / ko). Data: window.INTRVLNewsFeed (assets/news-feed.js).
   Page and filter live in the URL hash (#p=2&c=event) so the browser back button and shared links work. */
(() => {
  'use strict';
  const D = document, R = D.documentElement;
  const LANG = /^en/i.test(R.lang) ? 'en' : /^ko/i.test(R.lang) ? 'ko' : 'zh';
  const L = (zh, en, ko) => (LANG === 'zh' ? zh : LANG === 'en' ? en : ko);
  const $ = s => D.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAGE = 6;
  const CATS = { event: L('活動', 'Events', '행사'), work: L('作品', 'Stories', '작품'), game: L('遊戲', 'Game', '게임'), studio: L('工作室', 'Studio', '스튜디오') };
  const V = '<svg viewBox="0 0 85.205 73" aria-hidden="true"><path d="M 42.702 73 L 15.561 26.626 L 34.93 26.626 L 42.702 39.914 L 57.312 14.985 L 85.205 0.479 Z" fill="#fff"/><path d="M 10.765 18.403 L 0 0 L 57.312 0 Z" fill="#fff"/></svg>';
  const grid = $('#npGrid'), chipsEl = $('#npChips'), pager = $('#npPager'), count = $('#npCount'), countM = $('#npCountM'), bar = $('.np-bar');
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  let all = [], st = { p: 1, c: 'all' };

  const readHash = () => {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const p = parseInt(h.get('p'), 10);
    return { p: p > 0 ? p : 1, c: h.get('c') || 'all' };
  };
  const writeHash = () => {
    const h = new URLSearchParams();
    if (st.c !== 'all') h.set('c', st.c);
    if (st.p > 1) h.set('p', st.p);
    const s = h.toString();
    history.pushState(null, '', location.pathname + (s ? '#' + s : ''));
  };

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.05 })
    : null;

  function media(p) {
    if (!p.image) {
      const md = (p.date || '').slice(5).replace('-', '.');
      return `<div class="np-media done"><div class="np-tile">${V}<b>${esc(md || '··')}</b><small>${esc(CATS[p.cat] || '')}</small></div></div>`;
    }
    return `<div class="np-media"><img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" width="800" height="600"></div>`;
  }
  function card(p, i) {
    const ext = /^https?:/.test(p.url);
    const li = D.createElement('li');
    li.className = 'np-item';
    const go = p.url ? `<span class="np-go" aria-hidden="true">${ext ? 'Instagram ↗' : L('了解更多', 'Read more', '자세히 보기') + ' →'}</span>` : '';
    const title = p.url
      ? `<a class="np-link" href="${esc(p.url)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(p.title)}</a>`
      : esc(p.title);
    li.innerHTML = `<article class="np-card">${media(p)}<div class="np-body">
      <div class="np-meta"><time datetime="${esc(p.date)}">${esc(p.date)}</time>${CATS[p.cat] ? `<span class="np-tag">${esc(CATS[p.cat])}</span>` : ''}</div>
      <h2>${title}</h2>${p.body ? `<p>${esc(p.body)}</p>` : ''}${go}</div></article>`;
    const art = li.firstElementChild;
    art.style.transitionDelay = Math.min(i, 5) * 60 + 'ms';
    const img = li.querySelector('img');
    if (img) {
      const done = ok => { img.classList.toggle('ld', ok); img.parentElement.classList.add('done'); if (!ok) img.parentElement.innerHTML = `<div class="np-tile">${V}<b>${esc((p.date || '').slice(5).replace('-', '.'))}</b><small>${esc(CATS[p.cat] || '')}</small></div>`; };
      if (img.complete && img.naturalWidth) done(true);
      img.addEventListener('load', () => done(true), { once: true });
      img.addEventListener('error', () => done(false), { once: true });
    }
    return li;
  }

  function renderChips() {
    const cats = [...new Set(all.map(p => p.cat))].filter(c => CATS[c]);
    const n = c => (c === 'all' ? all.length : all.filter(p => p.cat === c).length);
    chipsEl.innerHTML = [['all', L('全部', 'All', '전체')], ...cats.map(c => [c, CATS[c]])]
      .map(([k, v]) => `<button type="button" class="np-chip" data-c="${k}" aria-pressed="${st.c === k}">${esc(v)}<em>${n(k)}</em></button>`).join('');
  }
  function renderPager(pages) {
    pager.hidden = pages <= 1;
    if (pages <= 1) { pager.innerHTML = ''; return; }
    const nums = [];
    if (pages <= 7) for (let i = 1; i <= pages; i++) nums.push(i);
    else {
      nums.push(1);
      if (st.p > 3) nums.push('…');
      for (let i = Math.max(2, st.p - 1); i <= Math.min(pages - 1, st.p + 1); i++) nums.push(i);
      if (st.p < pages - 2) nums.push('…');
      nums.push(pages);
    }
    pager.innerHTML = `<button type="button" data-go="${st.p - 1}" ${st.p <= 1 ? 'disabled' : ''} aria-label="${L('上一頁', 'Previous page', '이전 페이지')}">←<span class="arr">${L('上一頁', 'Prev', '이전')}</span></button>`
      + nums.map(n => (n === '…' ? '<span class="gap num" aria-hidden="true">…</span>' : `<button type="button" class="num" data-go="${n}" ${n === st.p ? 'aria-current="page"' : ''} aria-label="${L('第 ' + n + ' 頁', 'Page ' + n, n + ' 페이지')}">${n}</button>`)).join('')
      + `<span class="cur"><b>${st.p}</b>&nbsp;/ ${pages}</span>`
      + `<button type="button" data-go="${st.p + 1}" ${st.p >= pages ? 'disabled' : ''} aria-label="${L('下一頁', 'Next page', '다음 페이지')}"><span class="arr">${L('下一頁', 'Next', '다음')}</span>→</button>`;
  }
  function render() {
    if (st.c !== 'all' && !all.some(p => p.cat === st.c)) st.c = 'all';
    const list = all.filter(p => st.c === 'all' || p.cat === st.c);
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    st.p = Math.min(Math.max(1, st.p), pages);
    const slice = list.slice((st.p - 1) * PAGE, st.p * PAGE);
    renderChips();
    grid.setAttribute('aria-busy', 'true');
    grid.replaceChildren(...(slice.length ? slice.map(card) : [Object.assign(D.createElement('li'), { className: 'np-empty', textContent: L('目前沒有公告。', 'No announcements right now.', '현재 공지가 없습니다.') })]));
    grid.setAttribute('aria-busy', 'false');
    grid.querySelectorAll('.np-card').forEach(el => (io ? io.observe(el) : el.classList.add('in')));
    renderPager(pages);
    const txt = L(`共 <b>${list.length}</b> 則 · 第 <b>${st.p}</b> / ${pages} 頁`, `<b>${list.length}</b> posts · page <b>${st.p}</b> / ${pages}`, `총 <b>${list.length}</b>건 · <b>${st.p}</b> / ${pages} 페이지`);
    count.innerHTML = txt; countM.innerHTML = txt;
  }
  const toTop = () => { if (bar) bar.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); };

  chipsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
    st = { p: 1, c: b.dataset.c }; writeHash(); render();
  });
  pager.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b || b.disabled) return;
    st.p = +b.dataset.go; writeHash(); render(); toTop();
    const next = pager.querySelector('[aria-current="page"]') || pager.querySelector('button:not(:disabled)'); if (next) next.focus({ preventScroll: true });
  });
  addEventListener('popstate', () => { st = readHash(); render(); });

  grid.setAttribute('aria-busy', 'true');
  window.INTRVLNewsFeed.load(LANG).then(list => {
    all = list; st = readHash();
    render();
  }).catch(() => {
    grid.replaceChildren(Object.assign(D.createElement('li'), { className: 'np-empty', innerHTML: L('消息暫時無法載入，請到 <a href="https://www.instagram.com/intrvl_studio/" target="_blank" rel="noopener noreferrer">Instagram @intrvl_studio</a> 查看最新動態。', 'The news could not be loaded right now. Please see <a href="https://www.instagram.com/intrvl_studio/" target="_blank" rel="noopener noreferrer">Instagram @intrvl_studio</a> for the latest.', '소식을 불러오지 못했습니다. <a href="https://www.instagram.com/intrvl_studio/" target="_blank" rel="noopener noreferrer">Instagram @intrvl_studio</a>에서 최신 소식을 확인해 주세요.') }));
    grid.setAttribute('aria-busy', 'false');
  });
})();
