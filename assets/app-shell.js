/* INTRVL phone app shell (<=760px): app bar + bottom tabs + "More" sheet around inner pages.
   No network access, no inline styles and no data: URLs on purpose, so it can run under the strict CSP of /apply/. */
(() => {
  'use strict';
  const D = document, R = D.documentElement;
  if (R.dataset.asInit) return;
  R.dataset.asInit = '1';
  const mq = matchMedia('(max-width:760px), (max-width:1000px) and (max-height:500px) and (pointer:coarse)');
  const path = location.pathname.replace(/index\.html$/, '');
  let pref = '';
  try { pref = localStorage.getItem('intrvl_lang') || ''; } catch {}
  const lang = /^\/en\//.test(path) ? 'en' : /^\/ko\//.test(path) ? 'ko'
    : /^en/i.test(pref) ? 'en' : /^ko/i.test(pref) ? 'ko' : /^en/i.test(R.lang) ? 'en' : /^ko/i.test(R.lang) ? 'ko' : 'zh';
  const L = (zh, en, ko) => (lang === 'zh' ? zh : lang === 'en' ? en : ko);
  const HOME = { zh: '/', en: '/en/', ko: '/ko/' }[lang];
  const NEWS = { zh: '/news/', en: '/en/news/', ko: '/ko/news/' }[lang];
  const ic = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const ICON = {
    home: ic('M3.5 11 12 3.5 20.5 11M5.5 9.5V20.5h13V9.5M10 20.5v-6h4v6'),
    works: ic('M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z'),
    play: ic('M8 5.5v13l11-6.5z'),
    news: ic('M4.5 4.5h15v15h-15zM8 9h8M8 12.5h8M8 16h5'),
    more: ic('M5 7h14M5 12h14M5 17h14'),
    back: ic('M15 5 8 12l7 7'),
    share: ic('M12 15V4M8 8l4-4 4 4M5 13v7h14v-7')
  };
  const V = '<svg viewBox="0 0 85.205 73" aria-hidden="true"><path d="M 42.702 73 L 15.561 26.626 L 34.93 26.626 L 42.702 39.914 L 57.312 14.985 L 85.205 0.479 Z" fill="#FF9142"/><path d="M 10.765 18.403 L 0 0 L 57.312 0 Z" fill="#FF9142"/></svg>';

  // which tab is "current" for this path
  const cur = /^\/(?:(?:en|ko)\/)?$/.test(path) ? 'home'
    : /^\/works\//.test(path) ? 'works'
    : /^\/(?:(?:en|ko)\/)?news\//.test(path) ? 'news'
    : /^\/(be-my-portfolio-rpg\/|rpg-play\.html)/.test(path) ? 'play'
    : /^\/(course|apply|booking-assistant)\//.test(path) ? 'more' : '';
  const parent = /^\/works\/[^/]+\/$/.test(path) ? '/works/' : HOME;
  const isRoot = cur === 'home';

  const titleOf = () => {
    const attr = D.body && D.body.dataset.appTitle;
    if (attr) return attr;
    const t = (D.title || '').split(/\s*[｜|—–]\s*/)[0].replace(/\s*-\s*INTRVL.*$/i, '').trim();
    return t || 'INTRVL';
  };

  let bar, tabs, sheet, title, prog, share;
  function build() {
    if (bar) return;
    bar = D.createElement('header');
    bar.className = 'as-bar';
    bar.innerHTML = `<a class="as-back" href="${parent}" aria-label="${L('返回', 'Back', '뒤로')}">${ICON.back}</a>
      <div class="as-title" aria-hidden="true"></div>
      <button class="as-share" type="button" aria-label="${L('分享', 'Share', '공유')}">${ICON.share}</button>
      <div class="as-prog" aria-hidden="true"><i></i></div>`;
    const tab = (id, href, label, extra = '') => `<a href="${href}" class="${extra}"${cur === id ? ' aria-current="page"' : ''}><span class="ic">${extra === 'as-play' ? `<span>${ICON.play}</span>` : ICON[id === 'works' ? 'works' : id]}</span><span>${label}</span></a>`;
    tabs = D.createElement('nav');
    tabs.className = 'as-tabs';
    tabs.setAttribute('aria-label', L('主要導覽', 'Main navigation', '주요 내비게이션'));
    tabs.innerHTML = tab('home', HOME, L('首頁', 'Home', '홈')) + tab('works', '/works/', L('作品', 'Works', '작품')) + tab('play', '/be-my-portfolio-rpg/', L('遊戲', 'Play', '게임'), 'as-play') + tab('news', NEWS, L('消息', 'News', '소식'))
      + `<button type="button" data-more${cur === 'more' ? ' aria-current="page"' : ''}><span class="ic">${ICON.more}</span><span>${L('更多', 'More', '더보기')}</span></button>`;
    sheet = D.createElement('dialog');
    sheet.className = 'as-sheet';
    sheet.setAttribute('aria-label', L('更多', 'More', '더보기'));
    const row = (href, zh, en, ko, small) => `<a href="${href}"><span>${L(zh, en, ko)}</span><small>${small}</small><em>→</em></a>`;
    sheet.innerHTML = `<div class="as-sh"><i></i><b>MORE</b><button type="button" data-close aria-label="${L('關閉', 'Close', '닫기')}">×</button></div>
      <div class="as-sl">
        ${row(HOME + '#team', '團隊', 'Team', '팀', 'TEAM')}
        ${row('/course/', '課程', 'Learning', '강의', 'LEARNING')}
        ${row(HOME + '#join', '加入我們', 'Join us', '채용', 'JOIN US')}
        ${row('/apply/', '投遞履歷', 'Apply now', '지원하기', 'APPLY')}
      </div>
      <div class="as-sf">
        <div class="lab">LANGUAGE</div>
        <div class="row"><a href="/" hreflang="zh-TW"${lang === 'zh' ? ' aria-current="true"' : ''}>中文</a><a href="/en/" hreflang="en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a><a href="/ko/" hreflang="ko"${lang === 'ko' ? ' aria-current="true"' : ''}>한국어</a></div>
        <div class="lab">FOLLOW</div>
        <div class="row"><a href="https://www.instagram.com/intrvl_studio/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://x.com/intrvlstudio" target="_blank" rel="noopener noreferrer">X ↗</a><a href="https://www.facebook.com/profile.php?id=61593313695069" target="_blank" rel="noopener noreferrer">Facebook ↗</a></div>
      </div>`;
    D.body.append(bar, tabs, sheet);
    title = bar.querySelector('.as-title');
    prog = bar.querySelector('.as-prog i');
    share = bar.querySelector('.as-share');
    const back = bar.querySelector('.as-back');
    if (isRoot) back.hidden = true;
    share.hidden = !navigator.share;
    back.addEventListener('click', e => {
      let same = false;
      try { same = !!D.referrer && new URL(D.referrer).origin === location.origin; } catch {}
      if (same && history.length > 1) { e.preventDefault(); history.back(); }
    });
    share.addEventListener('click', () => { navigator.share({ title: D.title, url: location.href }).catch(() => {}); });
    tabs.querySelector('[data-more]').addEventListener('click', () => sheet.showModal());
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
    sheet.querySelectorAll('.as-sf a[hreflang]').forEach(a => a.addEventListener('click', () => { try { localStorage.setItem('intrvl_lang', a.getAttribute('hreflang')); } catch {} }));
    const setTitle = () => { title.textContent = titleOf(); };
    setTitle();
    const t = D.querySelector('title');
    if (t) new MutationObserver(setTitle).observe(t, { childList: true, characterData: true, subtree: true });
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = R.scrollHeight - innerHeight;
        prog.style.setProperty('transform', `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  function apply() {
    if (mq.matches) { if (D.body) { build(); R.classList.add('as-on'); } } else { if (sheet && sheet.open) sheet.close(); R.classList.remove('as-on'); }
  }
  mq.addEventListener && mq.addEventListener('change', apply);
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', apply); else apply();
  const themeSet = () => { if (!D.querySelector('meta[name="theme-color"]')) { const m = D.createElement('meta'); m.name = 'theme-color'; m.content = '#000000'; D.head.append(m); } };
  themeSet();
})();
