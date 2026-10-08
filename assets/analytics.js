/* INTRVL 網站統計（GA4）：全站唯一入口，各頁 <head> 只放一行
     <script src="/assets/analytics.js?v=…" defer></script>
   一定要排在 clean-url.js 之前：clean-url 會把網址的 ?utm_… 清掉，這裡要先把來源參數記進 page_location。
   設計重點
   - gtag.js 本體延後到 load 之後（閒置或第一次互動）才下載，不和首屏搶頻寬；事件先排進 dataLayer。
   - 不改動既有頁面腳本：點擊、區塊曝光、對話框、遊戲進度都用事件委派／MutationObserver／存檔寫入掛勾觀察。
   - 本機（127.0.0.1／localhost）不送資料；網址加 ?ga_off=1 可排除自己的裝置，?ga_on=1 還原，?ga_debug=1 看 DebugView。
   - 絕不送使用者輸入的內容（姓名、Email、經驗描述等）；只送事件名稱和固定選項。
   事件字典與 GA 後台設定另有私有文件。 */
(() => {
  'use strict';
  if (window.INTRVLAnalytics) return;

  const ID = 'G-Z2KGVEM7L5';
  const doc = document, root = doc.documentElement, me = doc.currentScript;
  const qs = new URLSearchParams(location.search);
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const safe = fn => { try { return fn(); } catch (e) { if (debug) console.warn('[ga4]', e); } };

  /* ---------- 開關 ---------- */
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost|.+\.test)$/.test(location.hostname);
  let off = false, debug = false;
  safe(() => {
    if (qs.get('ga_off') === '1') localStorage.setItem('intrvl_ga_off', '1');
    if (qs.get('ga_on') === '1') localStorage.removeItem('intrvl_ga_off');
    off = localStorage.getItem('intrvl_ga_off') === '1';
    if (qs.has('ga_debug')) qs.get('ga_debug') === '1' ? sessionStorage.setItem('intrvl_ga_debug', '1') : sessionStorage.removeItem('intrvl_ga_debug');
    debug = sessionStorage.getItem('intrvl_ga_debug') === '1';
  });
  const force = LOCAL && qs.get('ga_force') === '1';                 // 只給本機驗證真正的 gtag.js 用
  const enabled = !off && navigator.globalPrivacyControl !== true && (!LOCAL || force);
  if (!enabled) window['ga-disable-' + ID] = true;

  /* ---------- gtag 與事件出口 ---------- */
  const log = [];                                                    // 只在本機或除錯時保留，方便自動化測試
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {                                    // 必須推 arguments 物件，gtag.js 才認得
    window.dataLayer.push(arguments);
    if ((LOCAL || debug) && arguments[0] === 'event') {
      log.push({ name: arguments[1], params: arguments[2] || {} });
      if (log.length > 400) log.shift();
      if (debug) console.log('[ga4]', arguments[1], arguments[2] || {});
    }
  };
  const tidy = p => {
    const o = {};
    for (const k in p) {
      let v = p[k];
      if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) continue;
      if (typeof v === 'string') v = v.replace(/\s+/g, ' ').trim().slice(0, 100);
      else if (typeof v === 'boolean') v = String(v);
      else if (typeof v === 'number') v = Math.round(v * 1000) / 1000;
      if (v !== '') o[k] = v;
    }
    return o;
  };
  const counts = {};
  const track = (name, params = {}) => {
    if ((counts[name] = (counts[name] || 0) + 1) > 60) return;       // 保險：任何事件單頁最多 60 次，避免迴圈灌爆
    safe(() => window.gtag('event', name, tidy(params)));
  };
  const seen = new Set();
  const once = (key, fn) => { if (!seen.has(key)) { seen.add(key); fn(); } };

  /* ---------- 這一頁是什麼 ---------- */
  const path = location.pathname.replace(/index\.html$/, '');
  const override = me && me.dataset.page;
  const detail = /^\/works\/([a-z0-9-]+)\/$/.exec(path);
  const type = override
    || (/^\/(?:(?:en|ko)\/)?$/.test(path) && 'home')
    || (path === '/works/' && 'works_list')
    || (detail && 'work_detail')
    || (path === '/course/' && 'course')
    || (/^\/(be-my-portfolio-rpg\/|rpg-play\.html)$/.test(path) && 'game')
    || 'other';
  const lang = /^\/en\//.test(path) ? 'en' : /^\/ko\//.test(path) ? 'ko'
    : /^en/i.test(root.lang) ? 'en' : /^ko/i.test(root.lang) ? 'ko' : 'zh-TW';
  const workId = detail ? detail[1] : '';
  let framed = false;                                                // 遊戲被內嵌在同網站的另一頁（首頁彈窗或手機直式外殼）
  safe(() => { framed = top !== self && top.location.origin === location.origin; });
  const topEntry = framed ? safe(() => top.RPGEntry) : null;
  const entry = type !== 'game' ? ''
    : framed ? (topEntry && topEntry.standalone ? 'mobile_shell' : 'home_dialog')
    : window.RPGEntry && window.RPGEntry.standalone ? 'mobile_shell' : 'direct';
  const inApp = (ua => /Instagram/i.test(ua) ? 'instagram' : /FBAN|FBAV/i.test(ua) ? 'facebook' : /\bLine\//i.test(ua) ? 'line' : /Threads/i.test(ua) ? 'threads' : '')(navigator.userAgent);

  // 只保留廣告來源參數，其餘（embedded、rotate、ga_*…）不進報表，路徑才不會被拆成一堆
  const KEEP = /^(utm_[a-z_]+|gclid|dclid|gbraid|wbraid|msclkid|fbclid|ttclid)$/i;
  const canonical = () => {
    const keep = new URLSearchParams();
    qs.forEach((v, k) => { if (KEEP.test(k)) keep.append(k, v); });
    const s = keep.toString();
    return location.origin + path + (s ? '?' + s : '');
  };

  /* ---------- 設定並送出 page_view ---------- */
  const cfg = { page_location: canonical(), content_group: type, site_language: lang };
  if (workId) cfg.work_id = workId;
  if (entry) cfg.entry = entry;
  if (inApp) cfg.in_app_browser = inApp;
  if (debug || force) { cfg.debug_mode = true; cfg.traffic_type = 'internal'; }   // 測試流量可在 GA 後台的內部流量篩選器排除
  if (type === 'game' && framed) cfg.send_page_view = false;         // 內嵌的遊戲由外層頁負責 page_view，這裡只送互動事件
  let prefLang = lang;
  safe(() => { prefLang = localStorage.getItem('intrvl_lang') || lang; });

  /* 同意（Consent Mode v2）：訪客還沒表態前只送不含 cookie 的匿名訊號；按「同意」才啟用 cookie 做完整統計。
     廣告相關一律拒絕（網站不做廣告）。選擇存在 localStorage 一年，同網站的其他分頁／內嵌遊戲會同步。 */
  const CONSENT_KEY = 'intrvl_consent', LATER_KEY = 'intrvl_consent_later';
  const readConsent = () => {
    try {
      const c = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (c && (c.a === 'granted' || c.a === 'denied') && Date.now() - c.t < 365 * 864e5) return c.a;
    } catch {}
    return '';
  };
  let consent = readConsent();                                       // '' 代表還沒表態
  window.gtag('consent', 'default', { analytics_storage: consent === 'granted' ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('js', new Date());
  window.gtag('set', 'user_properties', { pref_language: prefLang, reduced_motion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'yes' : 'no' });
  window.gtag('config', ID, cfg);
  if (type === 'not_found') track('page_not_found', { ui_item: location.pathname, ui_value: safe(() => new URL(doc.referrer).hostname) });

  /* ---------- gtag.js 本體：load 之後，閒置或第一次互動就載入 ---------- */
  let loaded = false;
  const loadGtag = () => {
    if (loaded || !enabled) return;
    loaded = true;
    const s = doc.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    doc.head.appendChild(s);
  };
  const armLoader = () => {
    (window.requestIdleCallback || (f => setTimeout(f, 1500)))(loadGtag, { timeout: 4000 });
    for (const t of ['pointerdown', 'keydown', 'touchstart', 'wheel']) addEventListener(t, loadGtag, { once: true, passive: true, capture: true });
  };
  doc.readyState === 'complete' ? armLoader() : addEventListener('load', armLoader, { once: true });

  /* ---------- 同意橫幅：沒表態才顯示；橫幅程式在需要時才載入 ---------- */
  const clearGaCookies = () => safe(() => document.cookie.split(';').forEach(c => {
    const n = c.split('=')[0].trim();
    if (/^_ga(_|$)/.test(n)) document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }));
  const applyConsent = v => {
    consent = v;
    window.gtag('consent', 'update', { analytics_storage: v });
    if (v === 'denied') clearGaCookies();                            // 拒絕時順手清掉先前留下的 GA cookie
  };
  const setConsent = v => {
    safe(() => { localStorage.setItem(CONSENT_KEY, JSON.stringify({ a: v, t: Date.now() })); sessionStorage.removeItem(LATER_KEY); });
    applyConsent(v);
    track('consent_choice', { ui_value: v });
  };
  const postpone = () => { safe(() => sessionStorage.setItem(LATER_KEY, '1')); track('consent_choice', { ui_value: 'later' }); };
  addEventListener('storage', e => safe(() => {                      // 另一個分頁或內嵌遊戲做了選擇
    if (e.key !== CONSENT_KEY) return;
    const v = readConsent();
    if (v && v !== consent) { applyConsent(v); if (window.INTRVLConsentBanner) window.INTRVLConsentBanner.hide(); }
  }));
  // 首頁彈窗裡的遊戲由外層頁處理；手機直式的外殼頁沒有可用版面，改由裡面的遊戲畫面顯示
  const bannerPage = entry !== 'home_dialog' && !(entry === 'mobile_shell' && !framed);
  const selfVersion = ((me && me.src && /[?&]v=([^&]+)/.exec(me.src)) || [])[1] || '';
  let bannerRequested = false;
  const openBanner = () => {
    const go = () => window.INTRVLConsentBanner && window.INTRVLConsentBanner.show();
    if (window.INTRVLConsentBanner) return go();
    if (bannerRequested) return;
    bannerRequested = true;
    const s = doc.createElement('script');
    s.src = '/assets/consent-banner.js' + (selfVersion ? '?v=' + selfVersion : '');
    s.onload = go;
    s.onerror = () => { bannerRequested = false; };
    doc.head.appendChild(s);
  };
  const postponed = safe(() => sessionStorage.getItem(LATER_KEY) === '1');
  if (bannerPage && !consent && !postponed && !off && navigator.globalPrivacyControl !== true) {
    const t0 = performance.now();
    // 等開場動畫結束，也等所有對話框（宣傳彈窗、遊戲教學…）關閉：它們是封鎖式對話框，會讓橫幅按不到
    const waitIntro = () => ((root.classList.contains('intro-playing') && performance.now() - t0 < 15000) || doc.querySelector('dialog[open]')) ? setTimeout(waitIntro, 500) : openBanner();
    const arm = () => setTimeout(waitIntro, 800);
    doc.readyState === 'complete' ? arm() : addEventListener('load', arm, { once: true });
  }
  if (bannerPage) safe(() => {                                       // 頁尾的「統計與隱私設定」：隨時可以改選擇
    const host = $('.footer-bottom > div:last-child') || $('footer');
    if (!host) return;
    const label = { en: 'Analytics & privacy', ko: '통계 및 개인정보 설정' }[lang] || '統計與隱私設定';
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'consent-reopen'; b.textContent = label;
    b.style.cssText = 'background:none;border:0;padding:0;margin:0 0 0 1.2em;font:inherit;color:inherit;text-decoration:underline;cursor:pointer';
    b.addEventListener('click', openBanner);
    host.append(b);
  });

  /* ---------- 版位與連結分類 ---------- */
  const PLACES = [
    ['#loveQuestPromo', 'promo_popup'], ['#chapterAchievement', 'game_achievement'], ['#shareOptions', 'game_share'], ['#endingScreen', 'game_ending'],
    ['#chapter-menu', 'menu'], ['.nav-quick', 'nav_quick'], ['.lang-toggle', 'lang_toggle'], ['#token-relay', 'token_relay'],
    ['.official-board', 'news_board'], ['.instagram-panel', 'instagram'], ['.release-cta-wrap', 'hero_cta'], ['.hero-actions', 'hero'],
    ['.hero-copy', 'hero'], ['.detail-hero', 'hero'], ['.chapter-nav', 'chapter_nav'], ['.book-section', 'book'], ['.read-section', 'read_section'],
    ['.next-work', 'next_work'], ['.detail-nav', 'top_nav'], ['.public-nav, .course-nav', 'top_nav'], ['.course-hero', 'hero'],
    ['.catalog', 'catalog'], ['.upcoming', 'upcoming'], ['footer', 'footer'], ['#works, .works', 'works'], ['#about', 'about'],
    ['#feature', 'feature'], ['#news', 'news'], ['#team', 'team'], ['#course', 'course'], ['#hiring', 'hiring'], ['#contact', 'contact'],
    ['#collab', 'collab'], ['dialog', 'dialog'], ['main', 'main'], ['nav, header', 'top_nav']
  ];
  const placeOf = el => { for (const [sel, name] of PLACES) if (el.closest(sel)) return name; return 'page'; };
  const hostIs = (h, d) => h === d || h.endsWith('.' + d);
  const SOCIAL = [['instagram.com', 'instagram'], ['x.com', 'x'], ['twitter.com', 'x'], ['facebook.com', 'facebook'], ['threads.net', 'threads'], ['threads.com', 'threads'], ['youtube.com', 'youtube']];

  function onLink(a) {
    if (a.hasAttribute('data-track')) return;                        // 布告欄活動卡的連結由 token-relay.js 自己回報
    let u;
    try { u = new URL(a.href, location.href); } catch { return; }
    const where = placeOf(a);
    if (u.protocol === 'mailto:') return track('contact_click', { method: 'email', link_location: where });
    if (!/^https?:$/.test(u.protocol)) return;
    if (u.origin !== location.origin) {
      const host = u.hostname.replace(/^www\./, ''), base = { link_location: where, dest_domain: host, dest_url: u.origin + u.pathname };
      if (hostIs(host, 'webtoons.com') || hostIs(host, 'webtoons.onelink.me')) return track('read_click', { ...base, platform: 'webtoon' });   // onelink.me 是遊戲內的短連結
      if (hostIs(host, 'kadokawa.com.tw')) return track('buy_click', { ...base, platform: 'kadokawa' });
      if (hostIs(host, 'coloso.global')) return track('course_click', { ...base, platform: 'coloso' });
      const social = SOCIAL.find(([d]) => hostIs(host, d));
      if (social) return track('social_click', { ...base, platform: social[1] });
      return track('outbound_click', base);
    }
    const p = u.pathname.replace(/index\.html$/, ''), work = /^\/works\/([a-z0-9-]+)\/$/.exec(p);
    if (u.pathname === location.pathname && u.hash) return track('anchor_click', { section_id: u.hash.slice(1), link_location: where });
    if (work) return track('select_content', { content_type: 'work', content_id: work[1], link_location: where });
    if (p === '/apply/') return track('apply_click', { link_location: where });
    if (p === '/be-my-portfolio-rpg/') return track('game_click', { link_location: where });
    const page = { '/works/': 'works_list', '/course/': 'course', '/': 'home', '/en/': 'home_en', '/ko/': 'home_ko' }[p];
    if (page) track('select_content', { content_type: 'page', content_id: page, link_location: where });
  }

  /* ---------- 明確指定的互動（selector, 事件名, 額外參數）；命中就不再走一般連結分類 ---------- */
  let lastStart = 'new', lastTutorialBtn = '';
  const COMMON_RULES = [
    ['.lang-toggle a', 'language_switch', a => ({ ui_item: lang, ui_value: a.getAttribute('hreflang') })],
    ['.menu-open', 'menu_open'],
    ['#scrollTop', 'back_to_top'],
    ['[data-category]', 'news_filter', b => ({ ui_item: b.dataset.category })],
    ['#latest-story-cta', 'hero_cta_click', a => ({ ui_item: 'game', ui_value: a.classList.contains('is-locked') ? 'locked' : 'open' })],
    ['.character-motion', 'mascot_click', b => { const m = b.closest('.member'); return { ui_item: (m && (/member-(\w+)/.exec(m.className) || [])[1]) || (b.getAttribute('aria-label') || '').replace(/^播放\s*|\s*角色動畫$/g, '') }; }],
    ['.quest-promo-link', 'select_promotion', () => promo('select')],
    ['[data-process]', 'process_step_click', b => ({ ui_item: b.dataset.process })],
    ['[data-character]', null, b => storyCharacter(b, 'click')],
    ['[data-art]', 'art_open', b => ({ ui_item: b.dataset.art })],
    ['#loadContinue', 'story_loader_skip'],
    ['#course-play', 'course_video_click']
  ];
  // 遊戲頁專用：避免其他頁剛好有同名 id 時誤觸
  const GAME_RULES = [
    ['#start', null, () => { lastStart = 'new'; }],
    ['#continue', null, () => { lastStart = 'continue'; }],
    ['#tutorialClose, #tutorialDone', null, b => { lastTutorialBtn = b.id; }],
    ['#shareComplete', 'share', () => ({ method: 'complete_card', content_type: 'game_result' })],
    ['#downloadComplete', 'game_result_download'],
    ['#shareThreads', 'share', () => ({ method: 'threads', content_type: 'game_result' })],
    ['#shareX', 'share', () => ({ method: 'x', content_type: 'game_result' })],
    ['#copyShareLink', 'share', () => ({ method: 'copy_link', content_type: 'game_result' })],
    ['#read, #roam, #newGame', 'game_ending_choice', b => ({ ui_value: b.id })],
    ['#music, #sfx, #theme, #fullscreen, #gameHelp, #castBook, #episodeCount, #questToggle, #navigateTask, #zoomIn, #zoomOut, #cameraReset, #exitGame, #home, #homeGuideOpen', 'game_ui', b => ({ ui_item: b.id })]
  ];
  const RULES = type === 'game' ? [...COMMON_RULES, ...GAME_RULES] : COMMON_RULES;
  const dismissReason = new WeakMap();

  function onClick(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    let handled = false;
    for (const [sel, name, extra] of RULES) {
      const el = t.closest(sel);
      if (!el) continue;
      handled = true;
      const more = extra ? extra(el, e) : null;
      if (name) track(name, { link_location: placeOf(el), ...more });
    }
    const dlg = t.closest('#loveQuestPromo');
    if (dlg) {
      if (t.closest('.quest-promo-close')) dismissReason.set(dlg, 'button');
      else if (t.closest('.quest-promo-link')) dismissReason.set(dlg, 'link');
      else if (t === dlg) dismissReason.set(dlg, 'backdrop');
    }
    const a = t.closest('a[href]');
    if (a && !handled) onLink(a);
  }
  doc.addEventListener('click', e => safe(() => onClick(e)), true);
  doc.addEventListener('auxclick', e => safe(() => { if (e.button === 1 && e.target instanceof Element) { const a = e.target.closest('a[href]'); if (a) onLink(a); } }), true);

  /* ---------- 捲動深度 ---------- */
  if (!['game', 'not_found'].includes(type)) {
    const marks = [25, 50, 75, 100];
    let queued = false;
    const measure = () => {
      queued = false;
      const max = root.scrollHeight - innerHeight;
      if (max < 400) return;
      const pct = scrollY / max * 100;
      for (const m of marks) if (pct >= (m === 100 ? 97 : m)) once('depth:' + m, () => track('scroll_depth', { depth_percent: String(m) }));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(measure); } }, { passive: true });
  }

  /* ---------- 區塊曝光：落在視窗中線附近連續 1 秒才算看過；首頁的電影式捲動改看 .is-current ---------- */
  function watchSections(find) {
    const hits = new Map();
    let timer;
    const tick = () => {
      if (doc.hidden) return;
      if (find().every(([, id]) => seen.has('sec:' + id))) return clearInterval(timer);
      const mid = innerHeight / 2, band = innerHeight * .15;
      for (const [target, id] of find()) {
        const el = typeof target === 'string' ? $(target) : target;
        if (!el || seen.has('sec:' + id)) continue;
        const r = el.getBoundingClientRect();
        const film = root.classList.contains('film-enabled') && el.classList.contains('film-shot');
        const on = film ? el.classList.contains('is-current') : r.height > 0 && r.top < mid + band && r.bottom > mid - band;
        if (!on) { hits.delete(id); continue; }
        hits.set(id, (hits.get(id) || 0) + 1);
        if (hits.get(id) >= 2) once('sec:' + id, () => track('section_view', { section_id: id }));
      }
    };
    timer = setInterval(tick, 500);
  }
  const SECTIONS = {
    home: () => [['header#top', 'cover'], ['#works', 'works'], ['#about', 'about'], ['.numbers', 'numbers'], ['#feature', 'feature'], ['#news', 'news'], ['#team', 'team'], ['#course', 'course'], ['#hiring', 'hiring'], ['#contact', 'contact']],
    works_list: () => [['.catalog', 'catalog'], ['.upcoming', 'upcoming'], ['#making', 'making']],
    work_detail: () => [['.detail-hero', 'hero'], ['#story', 'story'], ['#characters', 'characters'], ['#visuals', 'visuals'], ['#books', 'books'], ['.read-section', 'read'], ['.next-work', 'next_work'], ['.release-gate', 'release_gate']],
    course: () => [['.course-hero', 'hero'], ...$$('.course-section[id]').map(e => [e, e.id])]
  };
  if (SECTIONS[type]) watchSections(SECTIONS[type]);

  /* ---------- 首頁：彈窗宣傳、Instagram 內嵌、遊戲彈窗 ---------- */
  const PROMO = { promotion_id: 'love_quest_2026_10', promotion_name: 'Be My Portfolio Love Quest', creative_slot: 'home_popup', location_id: lang };
  const promo = which => (which === 'select' ? { ...PROMO } : { promotion_id: PROMO.promotion_id });
  function storyCharacter(b, how) {
    const name = (b.getAttribute('aria-label') || '').replace(/^認識/, '') || b.dataset.character;
    once('char:' + name, () => track('character_view', { ui_item: name, ui_value: how }));
    return null;
  }
  const promoOpenedAt = new WeakMap();
  const body = doc.body;
  if (type === 'home' && body) safe(() => {
    new MutationObserver(list => safe(() => {
      for (const m of list) for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.id === 'loveQuestPromo') {
          promoOpenedAt.set(n, performance.now());
          track('view_promotion', PROMO);
          n.addEventListener('cancel', () => dismissReason.set(n, 'esc'));
          n.addEventListener('close', () => track('promo_dismiss', { promotion_id: PROMO.promotion_id, ui_value: dismissReason.get(n) || 'other', duration_ms: performance.now() - (promoOpenedAt.get(n) || 0) }));
          const skip = $('.quest-promo-skip input', n);
          if (skip) skip.addEventListener('change', () => track('promo_snooze', { promotion_id: PROMO.promotion_id, ui_value: skip.checked ? 'on' : 'off' }));
        } else if (n.localName === 'dialog' && $('iframe[title^="Be My Portfolio"]', n)) {
          track('game_open', { entry: 'home_dialog' });
          window.gtag('event', 'page_view', tidy({ page_location: location.origin + '/be-my-portfolio-rpg/', page_title: 'Be My Portfolio RPG Game Official', content_group: 'game', site_language: lang, entry: 'home_dialog', page_referrer: cfg.page_location }));
        }
      }
    })).observe(body, { childList: true });
    addEventListener('blur', () => setTimeout(() => safe(() => {         // 點進跨網域 iframe 時，視窗會失焦：用來估算 Instagram 內嵌貼文的互動
      const f = doc.activeElement;
      if (f && f.matches && f.matches('.instagram-post-frame')) once('ig:interact', () => track('embed_interaction', { ui_item: 'instagram' }));
    }), 0));
    doc.addEventListener('toggle', e => safe(() => { if (e.target.matches && e.target.matches('.relay-rules') && e.target.open) once('relay:rules', () => track('relay_rules_open')); }), true);
  });

  /* ---------- 作品內頁 ---------- */
  if (type === 'work_detail') safe(() => {
    const wd = $('#workDetail');
    if (wd) new MutationObserver(() => safe(() => {
      if ($('.release-gate', wd)) once('gate', () => track('coming_soon_view'));
      if ($('.error-state', wd)) once('story:error', () => track('content_error', { error_code: 'story_load' }));
    })).observe(wd, { childList: true });
    safe(() => new PerformanceObserver(l => l.getEntries().forEach(e => e.name === 'work-ready' && once('ready', () => track('story_ready', { duration_ms: e.startTime })))).observe({ type: 'mark', buffered: true }));
    doc.addEventListener('pointerenter', e => safe(() => { if (e.pointerType === 'mouse' && e.target.matches && e.target.matches('[data-character]')) storyCharacter(e.target, 'hover'); }), true);
  });

  /* ---------- 課程頁：試看影片。GA 內建的影片事件認不得動態建立的 youtube-nocookie 內嵌，
     所以改接 YouTube 播放器的 postMessage（需要 iframe 網址帶 enablejsapi=1，見 coloso.js） ---------- */
  if (type === 'course') safe(() => {
    const ORIGIN = 'https://www.youtube-nocookie.com';
    let ready = false, cur = 0, dur = 0, state = -1, playedMs = 0, last = 0, reached = 0, reportedWatch = false;
    const hello = () => {
      const f = $('#course-player iframe');
      if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'intrvl', channel: 'widget' }), ORIGIN);
    };
    doc.addEventListener('click', e => {
      if (!(e.target.closest && e.target.closest('#course-play'))) return;
      let tries = 0;
      const t = setInterval(() => { if (ready || ++tries > 15) clearInterval(t); else hello(); }, 800);
    }, true);
    addEventListener('message', e => safe(() => {
      if (e.origin !== ORIGIN) return;
      const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!d) return;
      if (d.event === 'onReady') ready = true;
      const i = d.info;
      if (d.event !== 'infoDelivery' || !i || typeof i !== 'object') return;
      if (i.duration) dur = i.duration;
      if (typeof i.currentTime === 'number') cur = i.currentTime;
      const now = performance.now();
      if (typeof i.playerState === 'number' && i.playerState !== state) {
        state = i.playerState;
        if (state === 1) once('video:play', () => track('course_video_play', { ui_item: 'trial_ep07' }));
        if (state === 0) once('video:complete', () => track('course_video_complete', { ui_item: 'trial_ep07' }));
        if (state !== 1) last = 0;
      }
      if (state === 1) { if (last) playedMs += Math.min(now - last, 1500); last = now; }
      if (dur) {
        const pct = cur / dur * 100;
        reached = Math.max(reached, pct);
        for (const m of [25, 50, 75]) if (pct >= m && state === 1) once('video:' + m, () => track('course_video_progress', { ui_item: 'trial_ep07', ui_value: String(m) }));
      }
    }));
    const report = () => {                                            // 離開時回報實際看了多久、最遠看到哪
      if (reportedWatch || !playedMs) return;
      reportedWatch = true;
      track('course_video_watch', { ui_item: 'trial_ep07', duration_ms: playedMs, ui_value: String(Math.round(reached)) });
    };
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) report(); });
    addEventListener('pagehide', report);
  });

  /* ---------- 遊戲：掛在既有 DOM、存檔與 data-screen 上，不動 game-r2.min.js ---------- */
  if (type === 'game' && $('#titleScreen')) safe(() => {
    const SAVE = 'bmp-rpg-save-v3', ONBOARD = 'bmp-rpg-onboarding-v2';
    const started = performance.now();
    let flagsDone = 0, activeMs = 0, since = doc.hidden ? 0 : performance.now(), phase = 'titleScreen', sentEnd = false;
    const flagsOf = raw => safe(() => { const s = JSON.parse(raw); return { n: Object.keys(s.f || {}).filter(k => s.f[k]), eps: (s.eps || []).length, heart: s.heart || 0, scene: s.scene }; });
    const known = new Set(), first = flagsOf(localStorage.getItem(SAVE));
    if (first) { flagsDone = first.n.length; first.n.forEach(k => known.add(k)); }

    const proto = Storage.prototype, orig = proto.setItem;           // 遊戲每次存檔或完成教學都會寫 localStorage：從這裡看進度
    proto.setItem = function (key, value) {
      const result = orig.apply(this, arguments);
      if (this === window.localStorage) safe(() => {
        if (key === SAVE) {
          const s = flagsOf(value);
          if (s) for (const k of s.n) if (!known.has(k)) { known.add(k); flagsDone = known.size; track('game_progress', { ui_item: k, ui_value: s.scene, step_count: flagsDone }); }
        } else if (key === ONBOARD && value === 'done') {
          track('tutorial_complete', { ui_value: lastTutorialBtn === 'tutorialClose' ? 'closed' : 'finished' });
        }
      });
      return result;
    };

    new MutationObserver(() => safe(() => {
      if (body.dataset.introReady === 'true') once('game:ready', () => track('game_ready', { duration_ms: performance.now() - started }));
      const screen = body.dataset.screen;
      if (screen === phase) return;
      phase = screen;
      if (screen === 'gameScreen') once('game:start', () => track('game_start', { ui_value: lastStart, step_count: flagsDone }));
      if (screen === 'endingScreen') {
        const s = flagsOf(localStorage.getItem(SAVE)) || { eps: 0, heart: 0 };
        track('game_ending_view', { ui_value: s.eps + '/3', step_count: flagsDone });
        if (s.eps >= 3) once('game:complete', () => track('game_complete', { step_count: flagsDone, ui_value: 'heart_' + s.heart }));
      }
    })).observe(body, { attributes: true, attributeFilter: ['data-screen', 'data-intro-ready'] });

    const DIALOGS = {
      gameTutorial: () => once('tutorial:begin', () => track('tutorial_begin')),
      chapterAchievement: () => { const n = /第\s*(\d+)\s*話/.exec(($('#achievementTitle') || {}).textContent || ''); if (n) once('ach:' + n[1], () => track('unlock_achievement', { achievement_id: 'ep' + n[1], step_count: flagsDone })); },
      mini: d => track('minigame_open', { ui_item: ($('h2, h3', d) || {}).textContent }),
      panel: d => track('game_panel_open', { ui_item: ($('h2, h3', d) || {}).textContent }),
      shareOptions: () => track('share_options_open'),
      rotateHint: () => once('rotate:hint', () => track('rotate_hint_view')),
      confirmNew: () => track('new_game_confirm_view')
    };
    new MutationObserver(list => safe(() => {
      for (const m of list) { const d = m.target; if (d.localName === 'dialog' && d.open && DIALOGS[d.id] && m.oldValue === null) DIALOGS[d.id](d); }
    })).observe(body, { subtree: true, attributes: true, attributeFilter: ['open'], attributeOldValue: true });

    const end = () => {                                                // 離開時回報最後停在哪，用來看流失點
      if (sentEnd || performance.now() - started < 5000) return;
      sentEnd = true;
      if (since) activeMs += performance.now() - since;
      track('game_session_end', { ui_value: phase, step_count: flagsDone, duration_ms: activeMs });
    };
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) { if (since) activeMs += performance.now() - since; since = 0; end(); } else since = performance.now(); });
    addEventListener('pagehide', end);
  });

  /* ---------- 網站速度（Core Web Vitals）：離開頁面時回報一次 ---------- */
  if (!framed && 'PerformanceObserver' in window) safe(() => {
    const v = {}, supported = PerformanceObserver.supportedEntryTypes || [];
    const watch = (kind, cb, extra) => { if (supported.includes(kind)) try { new PerformanceObserver(l => l.getEntries().forEach(cb)).observe({ type: kind, buffered: true, ...extra }); } catch {} };
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.responseStart > 0) v.TTFB = nav.responseStart;
    let lcpOpen = true;
    for (const t of ['keydown', 'pointerdown']) addEventListener(t, () => { lcpOpen = false; }, { once: true, capture: true });
    watch('paint', e => { if (e.name === 'first-contentful-paint') v.FCP = e.startTime; });
    watch('largest-contentful-paint', e => { if (lcpOpen) v.LCP = e.startTime; });
    let win = 0, winStart = 0, winLast = 0, worst = 0;                // CLS：相隔不到 1 秒、最長 5 秒歸為同一視窗，取最大的視窗
    watch('layout-shift', e => {
      if (e.hadRecentInput) return;
      if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) win += e.value; else { win = e.value; winStart = e.startTime; }
      winLast = e.startTime; worst = Math.max(worst, win); v.CLS = worst;
    });
    const longest = new Map();                                        // INP：每次互動取最長的一段，再取第 98 百分位
    watch('event', e => { if (e.interactionId) longest.set(e.interactionId, Math.max(longest.get(e.interactionId) || 0, e.duration)); }, { durationThreshold: 40 });
    const RATE = { LCP: [2500, 4000], INP: [200, 500], CLS: [.1, .25], FCP: [1800, 3000], TTFB: [800, 1800] };
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      const d = [...longest.values()].sort((a, b) => b - a);
      if (d.length) v.INP = d[Math.min(d.length - 1, Math.floor(d.length / 50))];
      for (const [name, val] of Object.entries(v)) {
        const [good, poor] = RATE[name];
        track('web_vital', { vital_name: name, vital_value: name === 'CLS' ? Math.round(val * 1000) / 1000 : Math.round(val), vital_rating: val <= good ? 'good' : val <= poor ? 'needs_improvement' : 'poor' });
      }
    };
    doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'hidden') send(); });
    addEventListener('pagehide', send);
  });

  /* ---------- 錯誤：腳本例外與本站資源載入失敗（每頁最多 5 筆） ---------- */
  let errorCount = 0;
  const reported = new Set();
  const fail = (name, params) => {
    const key = name + params.error_code + (params.ui_item || '');
    if (errorCount >= 5 || reported.has(key)) return;
    reported.add(key); errorCount++;
    track(name, params);
  };
  addEventListener('error', e => safe(() => {
    const t = e.target;
    if (t && t !== window && t.nodeType === 1) {
      const src = t.currentSrc || t.src || t.href;
      if (!src) return;
      const u = new URL(src, location.href);
      if (u.origin === location.origin) fail('resource_error', { error_code: t.localName, ui_item: u.pathname });
      return;
    }
    if (!e.message || e.message === 'Script error.' || /^(chrome|moz|safari-web)-extension:/.test(e.filename || '')) return;
    fail('js_error', { error_code: e.message, ui_item: (e.filename || '').split('/').pop().split('?')[0] + ':' + e.lineno });
  }), true);
  addEventListener('unhandledrejection', e => safe(() => fail('js_error', { error_code: 'promise: ' + String((e.reason && e.reason.message) || e.reason).slice(0, 80) })));

  /* ---------- 對外介面（主要給自己在 Console 排除裝置、給自動化測試用） ---------- */
  window.INTRVLAnalytics = {
    id: ID, enabled, type, track, log,
    consent: { lang, get: () => consent, set: setConsent, later: postpone },   // 給 consent-banner.js 用
    optOut() { safe(() => localStorage.setItem('intrvl_ga_off', '1')); window['ga-disable-' + ID] = true; return '此裝置已排除統計'; },
    optIn() { safe(() => localStorage.removeItem('intrvl_ga_off')); return '已還原統計，重新整理後生效'; }
  };
})();
