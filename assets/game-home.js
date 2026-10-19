/* INTRVL game-style homepage. One script for zh / en / ko (language = <html lang>).
   Desktop: stage-based full-screen site with wipe transitions. Phones (<=760px): app layout (see game-home.css). */
(() => {
  'use strict';
  const D = document, R = D.documentElement;
  const LANG = { 'zh-TW': 'zh', 'zh-Hant': 'zh', en: 'en', ko: 'ko' }[R.lang] || 'zh';
  const L = (zh, en, ko) => (LANG === 'zh' ? zh : LANG === 'en' ? en : ko);
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mqApp = matchMedia('(max-width:760px)');
  const mqReduce = matchMedia('(prefers-reduced-motion:reduce)');
  const mqFine = matchMedia('(hover:hover) and (pointer:fine)');
  const isApp = () => mqApp.matches;
  const reduced = () => mqReduce.matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const root = $('#gh');
  if (!root) return;
  try { localStorage.setItem('intrvl_lang', R.lang); } catch {}

  /* ------------------------------------------------------------------ data */
  const V = {
    tri: 'M 10.765 18.403 L 0 0 L 57.312 0 Z',
    chev: 'M 42.702 73 L 15.561 26.626 L 34.93 26.626 L 42.702 39.914 L 57.312 14.985 L 85.205 0.479 Z'
  };
  const vSvg = (fill, attrs = '') => `<svg viewBox="0 0 85.205 73" aria-hidden="true" ${attrs}><path d="${V.chev}" fill="${fill}"/><path d="${V.tri}" fill="${fill}"/></svg>`;
  const WM = [
    'M 0 3.085 L 15.469 3.085 L 15.469 81.383 L 0 81.383 L 0 3.085 Z',
    'M 106.04 84.574 L 46.51 30.957 L 51.098 33.511 L 51.418 81.383 L 35.735 81.383 L 35.735 0 L 36.375 0 L 94.625 53.404 L 91.211 51.915 L 90.891 3.085 L 106.467 3.085 L 106.467 84.574 L 106.04 84.574 Z',
    'M 121.353 3.085 L 174.269 3.085 L 174.269 17.979 L 155.172 17.979 L 155.172 81.383 L 139.703 81.383 L 139.703 17.979 L 121.353 17.979 L 121.353 3.085 Z',
    'M 212.988 3.085 C 217.896 3.085 222.27 3.723 226.111 5 C 229.951 6.206 233.152 7.979 235.712 10.319 C 238.344 12.589 240.335 15.355 241.687 18.617 C 243.038 21.809 243.714 25.426 243.714 29.468 C 243.714 32.66 243.216 35.851 242.22 39.043 C 241.295 42.234 239.731 45.142 237.526 47.766 C 235.392 50.39 232.547 52.518 228.991 54.149 C 225.435 55.709 221.025 56.489 215.762 56.489 L 204.667 56.489 L 204.667 81.383 L 189.198 81.383 L 189.198 3.085 L 212.988 3.085 Z M 215.656 41.596 C 218.003 41.596 219.958 41.206 221.523 40.426 C 223.088 39.645 224.297 38.652 225.15 37.447 C 226.075 36.241 226.715 35 227.071 33.723 C 227.498 32.376 227.711 31.135 227.711 30 C 227.711 29.149 227.569 28.085 227.284 26.809 C 227.071 25.461 226.573 24.113 225.791 22.766 C 225.008 21.418 223.799 20.284 222.163 19.362 C 220.599 18.44 218.465 17.979 215.762 17.979 L 204.667 17.979 L 204.667 41.596 L 215.656 41.596 Z M 230.165 51.17 L 249.581 81.383 L 231.552 81.383 L 211.708 51.596 L 230.165 51.17 Z',
    'M 269.905 3.085 L 292.842 59.468 L 283.881 57.66 L 304.684 3.085 L 323.034 3.085 L 287.188 85 L 251.342 3.085 L 269.905 3.085 Z',
    'M 336.618 3.085 L 352.087 3.085 L 352.087 66.489 L 389 66.489 L 389 81.383 L 336.618 81.383 L 336.618 3.085 Z'
  ];
  const STAGES = [
    { hash: 'boot', n: '00', name: L('啟動', 'Boot', '부팅'), en: 'BOOT' },
    { hash: 'home', n: '01', name: L('首頁', 'Home', '홈'), en: 'HOME', bg: '#000', kind: 'slice' },
    { hash: 'works', n: '02', name: L('作品', 'Works', '작품'), en: 'WORKS', bg: '#121212', kind: 'v' },
    { hash: 'play', n: '03', name: L('遊戲', 'Play', '게임'), en: 'PLAY', bg: '#FF9142', kind: 'slice' },
    { hash: 'news', n: '04', name: L('消息', 'News', '소식'), en: 'NEWS', bg: '#121212', kind: 'blk' },
    { hash: 'team', n: '05', name: L('團隊', 'Team', '팀'), en: 'TEAM', bg: '#000', kind: 'diag' },
    { hash: 'course', n: '06', name: L('課程', 'Learning', '강의'), en: 'LEARNING', bg: '#121212', kind: 'v' },
    { hash: 'join', n: '07', name: L('加入', 'Join us', '채용'), en: 'JOIN US', bg: '#000', kind: 'blk' }
  ];
  STAGES[0].bg = '#000'; STAGES[0].kind = 'slice';
  const HASH_MAP = { home: 1, top: 1, about: 1, works: 2, feature: 2, play: 3, game: 3, news: 4, team: 5, course: 6, learning: 6, join: 7, hiring: 7, contact: 7 };
  const RELEASE = Date.parse('2026-10-10T22:00:00+08:00');
  const launched = () => Date.now() >= RELEASE;

  const WORKS = [
    { k: 'portfolio', cover: '/assets/cards-20261019/portfolio.webp', fit: true, tags: L(['愛情', 'WEBTOON'], ['Romance', 'WEBTOON'], ['로맨스', 'WEBTOON']), badge: true,
      title: L('成為我的作品吧', 'Be My Portfolio', '나의 작품이 되어줘!'),
      meta: L(['上線｜ 10/10 22:00 · 台灣時間', '平台｜ LINE WEBTOON'], ['Release｜ 10/10 22:00 · Taiwan time', 'Platform｜ LINE WEBTOON'], ['공개｜ 10/10 22:00 · 대만 시간', '플랫폼｜ LINE WEBTOON']) },
    { k: 'steal', cover: '/assets/cards-20261019/steal.webp',
      title: L('扒進你心裡', 'Steal Your Heart', '너의 마음을 훔치다'),
      meta: L(['年份｜ 2026', '設定｜ 執著死板攻 × 輕浮扒手受'], ['Year｜ 2026', 'Setup｜ A rigid pursuer × a carefree pickpocket'], ['연도｜ 2026', '설정｜ 고지식한 추격자 × 자유분방한 소매치기']) },
    { k: 'delivery', cover: '/assets/cards-20261019/delivery.webp',
      title: L('外送夥伴即將抵達', 'Delivery Partner Is on the Way', '배달 파트너가 곧 도착합니다'),
      meta: L(['年份｜ 2025', '設定｜ 衷心乖狗攻 × 網黃無助受'], ['Year｜ 2025', 'Setup｜ A devoted sweetheart × a vulnerable adult creator'], ['연도｜ 2025', '설정｜ 헌신적인 순정남 × 위태로운 성인 크리에이터']) },
    { k: 'roommate', cover: '/assets/cards-20261019/roommate.webp',
      title: L('我的室友帥哥學長', 'My Handsome Roommate', '잘생긴 선배 룸메이트'),
      meta: L(['年份｜ 2021', '設定｜ 創傷包袱攻 × 陽光療癒受'], ['Year｜ 2021', 'Setup｜ A troubled past × a healing presence'], ['연도｜ 2021', '설정｜ 상처를 품은 마음 × 따뜻한 위로']) },
    { k: 'pry', cover: '/assets/cards-20261019/pry.webp',
      title: L('窺 PRY', 'PRY', '엿보다 PRY'),
      meta: L(['年份｜ 2023', '設定｜ 禁慾老男攻 × 受虐騷氣受'], ['Year｜ 2023', 'Setup｜ A restrained older man × a provocative partner'], ['연도｜ 2023', '설정｜ 절제하는 연상 × 도발적인 연인']) },
    { k: 'kill', cover: '/assets/cards-20261019/kill.webp',
      title: L('就要弄死你', "I'm Going to Kill You", '너를 죽여줄게'),
      meta: L(['年份｜ 2024', '設定｜ 易怒狼犬攻 × 欠幹奸詐受', '編劇｜ 十八日 18xDay'], ['Year｜ 2024', 'Writer｜ 18xDay 十八日'], ['연도｜ 2024', '각본｜ 18xDay 十八日']) }
  ];
  WORKS.forEach(w => { if (!w.tags) w.tags = L(['愛情', 'BL', 'WEBTOON'], ['Romance', 'BL', 'WEBTOON'], ['로맨스', 'BL', 'WEBTOON']); });

  const MENU = [
    { zh: L('開始遊戲', 'Start game', '게임 시작'), en: 'START', d: L('成為我的作品吧！心動任務。按下 ENTER，開始你的心動任務，進入遊戲。', 'Be My Portfolio — Love Quest. Press ENTER to begin your Love Quest and jump into the game.', '나의 작품이 되어줘! — 두근두근 퀘스트. ENTER 키를 눌러 퀘스트를 시작하고 게임에 입장하세요.'),
      dt: L('成為我的作品吧！心動任務。點一下「開始遊戲」，開始你的心動任務。', 'Be My Portfolio — Love Quest. Tap “Start game” to begin your Love Quest.', '나의 작품이 되어줘! — 두근두근 퀘스트. 「게임 시작」을 눌러 퀘스트를 시작하세요.') },
    { zh: L('作品介紹', 'The story', '작품 소개'), en: 'STORY', d: L('《成為我的作品吧》愛情 · WEBTOON。10/10 22:00 上線，台灣時間。', '“Be My Portfolio” — Romance · WEBTOON. Released 10/10 at 22:00, Taiwan time.', '《나의 작품이 되어줘!》 로맨스 · WEBTOON. 10/10 22:00 공개 (대만 시간).') },
    { zh: L('追蹤消息', 'Follow us', '소식 팔로우'), en: 'FOLLOW', d: L('最新消息都在 Instagram，歡迎追蹤 @intrvl_studio。', 'All the latest news is on Instagram. Follow @intrvl_studio.', '최신 소식은 Instagram에서 확인하세요. @intrvl_studio를 팔로우해 주세요.') }
  ];

  const TEAM = [
    { key: 'piann', name: 'PIANN', role: L('創辦人 · 總監', 'Founder · Director', '설립자 · 디렉터'), cls: 'DIRECTOR', circle: '#ff923d' },
    { key: 'm3', name: 'M3', role: L('美術助手', 'Art Assistant', '아트 어시스턴트'), cls: 'ARTIST', circle: '#4e5b43' },
    { key: 'page', name: 'PAGE', role: L('美術助手', 'Art Assistant', '아트 어시스턴트'), cls: 'ARTIST', circle: '#eb858a' },
    { key: 'mega', name: 'MEGA', role: L('美術助手', 'Art Assistant', '아트 어시스턴트'), cls: 'ARTIST', circle: '#ffe7c3' },
    { key: 'angela', name: 'ANGELA', role: L('獨立作者', 'Independent Author', '독립 작가'), cls: 'AUTHOR', circle: '#eaa4b8' },
    { key: 'next', name: L('下一位夥伴', 'NEXT UP', '다음 팀원'), role: L('正在徵才 →', 'We’re hiring →', '채용 중 →'), cls: '???', next: true }
  ];

  const COURSE = [
    { k: 'sketch-study', part: L('「素描」指南', 'THE “SKETCH” GUIDE', '「소묘」 가이드'), t: L('PIANN 課程示範', 'PIANN course demo', 'PIANN 강의 시연'),
      d: L('從黑白塊面到人物素描，練習觀察形狀、明暗與體積。', 'From black-and-white blocks to figure sketches — practise reading shape, light and volume.', '흑백 덩어리에서 인물 소묘까지, 형태·명암·부피를 관찰하는 연습을 합니다.') },
    { k: 'form', part: L('PART 02 / 抓型', 'PART 02 / SHAPE', 'PART 02 / 형태 잡기'), t: L('比例與動勢', 'Proportion & movement', '비례와 동세'),
      d: L('從輪廓與大形開始，練習人物姿勢，讓動作自然、形體準確。', 'Start from outlines and big shapes, and practise poses so movement feels natural and form stays accurate.', '윤곽과 큰 형태에서 시작해 포즈를 연습하며 자연스러운 동작과 정확한 형태를 익힙니다.') },
    { k: 'structure', part: L('PART 03 / 結構', 'PART 03 / STRUCTURE', 'PART 03 / 구조'), t: L('理解形體', 'Understanding form', '형태 이해하기'),
      d: L('分析臉部與肢體，把看到的形狀轉成能理解、能轉動的立體結構。', 'Analyse faces and limbs, turning what you see into a structure you can understand and rotate.', '얼굴과 팔다리를 분석해 눈에 보이는 모양을 이해하고 돌려볼 수 있는 입체 구조로 바꿉니다.') },
    { k: 'light', part: L('PART 04–05 / 光影・素描', 'PART 04–05 / LIGHT & SKETCH', 'PART 04–05 / 명암·소묘'), t: L('建立體積', 'Building volume', '부피 만들기'),
      d: L('先整理大塊明暗，再處理灰階層次，將抓型與結構整合成素描。', 'Organise the big light-and-dark masses first, then the grey gradations, and combine shape and structure into a sketch.', '큰 명암 덩어리를 먼저 정리한 뒤 회색조 단계를 다듬어 형태와 구조를 소묘로 통합합니다.') },
    { k: 'color', part: L('PART 06–07 / 上色・漫畫', 'PART 06–07 / COLOUR & COMIC', 'PART 06–07 / 채색·만화'), t: L('應用到完稿', 'Taking it to the finish', '완성까지 적용하기'),
      d: L('把基本功帶進色彩、鏡頭構圖與氛圍，接上漫畫的製作流程。', 'Bring the fundamentals into colour, camera composition and mood, then connect to the comic production pipeline.', '기본기를 색감, 컷 구도, 분위기에 적용하고 만화 제작 과정으로 이어갑니다.') },
    { k: 'sketch-to-comic', part: L('素描 × 漫畫', 'SKETCH × COMIC', '소묘 × 만화'), t: L('把基本功，變成作品裡的說服力', 'Turning fundamentals into conviction on the page', '기본기를 작품 속 설득력으로'),
      d: L('同一個漫畫人物以彩色與灰階對照，呈現身體結構、體積與明暗關係。', 'The same comic character in colour and grayscale, showing body structure, volume and light-and-dark.', '같은 만화 캐릭터를 컬러와 그레이스케일로 비교해 신체 구조, 부피, 명암 관계를 보여줍니다.') }
  ];
  const NEWS_CATS = {
    event: L('活動', 'Events', '행사'), work: L('作品', 'Stories', '작품'), game: L('遊戲', 'Game', '게임'), studio: L('工作室', 'Studio', '스튜디오')
  };
  const LOGO_C = [['#000', '#FF9142'], ['#FF9142', '#000'], ['#000', '#fff']];
  const COLS = 10, ROWS = 8;
  const SOCIAL = [
    ['INSTAGRAM', '@intrvl_studio', 'https://www.instagram.com/intrvl_studio/'],
    ['TWITTER (X)', '@intrvlstudio', 'https://x.com/intrvlstudio'],
    ['FACEBOOK', 'INTRVL Studio', 'https://www.facebook.com/profile.php?id=61593313695069']
  ];
  const EMAIL = 'intrvlstudio@gmail.com';
  const GAME = '/be-my-portfolio-rpg/';
  const sd = n => `style="--d:${n}s"`;

  /* ----------------------------------------------------------------- state */
  const S = { stage: 0, boot: 0, wi: 0, tab: 0, sel: 0, lv: 0, ci: 0, cprev: -1, cat: 'all', bootDone: false };
  let busy = false, lastWheel = 0, cleanups = [], mascots = null, mascotsP = null, bootTimer = 0;

  /* ----------------------------------------------------------- shell build */
  const logoSrc = LANG === 'zh' ? '/assets/brand-2026/lockup-zh-white.svg' : '/assets/brand-2026/lockup-en-white.svg';
  const logoAlt = L('之間工作室 INTRVL', 'INTRVL Studio', 'INTRVL Studio');
  const langHref = h => ({ zh: '/', en: '/en/', ko: '/ko/' }[h]);
  const langLinks = () => `<a href="/" hreflang="zh-TW" lang="zh-TW"${LANG === 'zh' ? ' aria-current="page"' : ''}>中文</a><a href="/en/" hreflang="en" lang="en"${LANG === 'en' ? ' aria-current="page"' : ''}>EN</a><a href="/ko/" hreflang="ko" lang="ko"${LANG === 'ko' ? ' aria-current="page"' : ''}>한국어</a>`;
  const ICON = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11 12 3.5 20.5 11M5.5 9.5V20.5h13V9.5M10 20.5v-6h4v6"/></svg>',
    works: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    news: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4.5h15v15h-15zM8 9h8M8 12.5h8M8 16h5"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>'
  };
  const TABS = [
    { id: 1, label: L('首頁', 'Home', '홈'), ic: 'home' },
    { id: 2, label: L('作品', 'Works', '작품'), ic: 'works' },
    { id: 3, label: L('遊戲', 'Play', '게임'), ic: 'play', cls: 'tb-play' },
    { id: 4, label: L('消息', 'News', '소식'), ic: 'news' },
    { id: 'more', label: L('更多', 'More', '더보기'), ic: 'more' }
  ];
  const SEO = root.querySelector('.gh-seo');
  root.insertAdjacentHTML('afterbegin', `<div class="gh-bgc" data-bg></div><div class="gh-v" data-v>${vSvg('#fff')}</div><div class="gh-stage" data-stage tabindex="-1"></div>`);
  root.insertAdjacentHTML('beforeend', `
    <div class="hud" data-hud hidden>
      <div class="hud-top">
        <button class="hud-logo" data-go="1" aria-label="${logoAlt}"><img src="${logoSrc}" alt="" height="35"></button>
        <div class="hud-r">
          <nav class="hud-nav" aria-label="${L('主要導覽', 'Main navigation', '주요 내비게이션')}">${STAGES.slice(1).map((s, i) => `<button data-go="${i + 1}"><i>${s.n}</i><b>${s.name}</b></button>`).join('')}</nav>
          <div class="lang" data-lang aria-label="${L('選擇語言', 'Language', '언어 선택')}">${langLinks()}</div>
        </div>
      </div>
      <div class="hud-bot">
        <div class="hud-hint" data-hint></div>
        <div class="hud-prog"><div class="hud-bars" aria-hidden="true">${STAGES.slice(1).map(() => '<i></i>').join('')}</div><div class="hud-num"><b data-num>01</b><span data-numen>/ 07 · HOME</span></div></div>
      </div>
    </div>
    <header class="ab" data-ab hidden>
      <button class="ab-logo" data-go="1" aria-label="${logoAlt}"><img src="${logoSrc}" alt="" height="26"></button>
      <div class="lang" data-lang aria-label="${L('選擇語言', 'Language', '언어 선택')}">${langLinks()}</div>
    </header>
    <nav class="tb" data-tb hidden aria-label="${L('主要導覽', 'Main navigation', '주요 내비게이션')}">${TABS.map(t => `<button data-tab="${t.id}" class="${t.cls || ''}"><span class="ic">${ICON[t.ic]}</span><span>${t.label}</span></button>`).join('')}</nav>
    <dialog class="sheet" data-sheet aria-label="${L('更多', 'More', '더보기')}">
      <div class="sheet-h"><i></i><b>MORE</b><button class="sheet-x" data-close aria-label="${L('關閉', 'Close', '닫기')}">×</button></div>
      <div class="sheet-l">
        ${[5, 6, 7].map(id => `<button data-go="${id}"><em>${STAGES[id].n}</em><span>${STAGES[id].name}</span><small>${STAGES[id].en}</small><i>→</i></button>`).join('')}
        <a href="/news/"><em>↗</em><span>${L('全部消息', 'All news', '전체 소식')}</span><small>NEWS ARCHIVE</small><i>→</i></a>
        <a href="/works/"><em>↗</em><span>${L('作品列表', 'All stories', '작품 목록')}</span><small>ALL STORIES</small><i>→</i></a>
      </div>
      <div class="sheet-f">
        <div class="lab">LANGUAGE</div><div class="lang" data-lang>${langLinks()}</div>
        <div class="lab">FOLLOW</div><div class="links">${SOCIAL.map(([, h, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(h)} ↗</a>`).join('')}<button type="button" data-privacy>${L('統計與隱私設定', 'Analytics & privacy', '통계 및 개인정보 설정')}</button></div>
      </div>
    </dialog>
    <div class="ov" data-ov></div>
    <div class="gh-sr" role="status" aria-live="polite" data-live></div>
    <div class="cur-ring" data-ring hidden></div><div class="cur-dot" data-dot hidden></div>`);
  const elBg = $('[data-bg]'), elV = $('[data-v]'), elStage = $('[data-stage]'), elHud = $('[data-hud]'), elAb = $('[data-ab]'), elTb = $('[data-tb]');
  const elSheet = $('[data-sheet]'), elOv = $('[data-ov]'), elLive = $('[data-live]'), elRing = $('[data-ring]'), elDot = $('[data-dot]');

  /* --------------------------------------------------------- stage markup */
  function sBoot() {
    return `<div class="boot" data-screen="boot" id="bootScreen">
      <div class="boot-scan"></div>
      <div class="boot-v">${vSvg('#FF9142').replace('<path d="' + V.chev + '" fill="#FF9142"/>', '')}${vSvg('#FF9142').replace('<path d="' + V.tri + '" fill="#FF9142"/>', '')}</div>
      <svg class="boot-wm" viewBox="0 0 389 85" aria-label="INTRVL" role="img">${WM.map((d, i) => `<path style="animation-delay:${(1.45 + i * .08).toFixed(2)}s" d="${d}" fill="${i === 4 ? '#FF9142' : '#fff'}"/>`).join('')}</svg>
      <div class="boot-tag">${L('故 事 在 我 們 之 間 · STORIES BETWEEN US', 'STORIES BETWEEN US', '이야기는 우리 사이에 · STORIES BETWEEN US')}</div>
      <div class="boot-start" data-start></div>
      <div class="boot-count"><b data-pct>000</b><div class="boot-bar"><i data-pbar style="width:0%"></i></div><span>${L('正在準備故事 · LOADING STORIES', 'LOADING STORIES', '이야기를 준비하는 중 · LOADING STORIES')}</span></div>
      <div class="boot-log"><span>SCRIPT ........ OK</span><span>STORYBOARD .... OK</span><span>LINE / COLOR .. OK</span><span>WEEKLY UPDATE . ON</span></div>
    </div>`;
  }

  function sHome() {
    const h1 = L(['故事在', '我們<span class="o">之間</span>'], ['Stories', '<span class="o">Between</span> Us'], ['이야기는', '우리 <span class="o">사이</span>에']);
    const meta = L(['成立｜ 2025 年 10 月', '類型｜ 浪漫', '平台｜ LINE WEBTOON'], ['Founded｜ October 2025', 'Genre｜ Romance', 'Platform｜ LINE WEBTOON'], ['설립｜ 2025년 10월', '장르｜ 로맨스', '플랫폼｜ LINE WEBTOON']);
    const stats = L([['200+', '累積連載話數'], ['2,800萬', '單一作品最高觀看數'], ['2×', '入選 LINE WEBTOON 年度最佳新作'], ['4', '完結連載作品']],
      [['200+', 'Episodes published'], ['28M', 'Peak views on a single title'], ['2×', 'LINE WEBTOON “Best New Series” selections'], ['4', 'Completed serializations']],
      [['200+', '누적 연재 화수'], ['2,800만', '단일 작품 최고 조회수'], ['2×', 'LINE WEBTOON 올해의 신작 선정'], ['4', '완결 연재작']]);
    return `<div class="gh-s s1" data-screen="home">
      <div class="s1-ghost"><b class="u-zoom" ${sd(.2)} aria-hidden="true">之間</b></div>
      <div class="s1-l">
        <div class="s1-eb u-fade" ${sd(.35)}><i class="u-grow" ${sd(.4)}></i><span class="eyebrow">STORIES BETWEEN US</span></div>
        <h1>${h1.map((x, i) => `<span class="lw"><span class="u-line" ${sd((.45 + i * .13).toFixed(2))}>${x}</span></span>`).join('')}</h1>
        <p class="s1-tag u-rise" ${sd(.9)}>${L('來 自 台 灣 的 WEBTOON 製 作 團 隊', 'A WEBTOON production team from Taiwan', '대만의 WEBTOON 제작팀')}</p>
        <div class="s1-meta u-rise" ${sd(.98)}>${meta.map(m => `<span>${m}</span>`).join('')}</div>
        <div class="s1-btns hero-actions u-rise" ${sd(1.05)}>
          <button class="btn btn-p" data-go="2">${L('進入作品', 'Enter works', '작품 보기')} <span>↓</span></button>
          <button class="btn btn-s" data-go="7">${L('加入我們', 'Join us', '함께하기')} <span>↗</span></button>
        </div>
        <div class="s1-stats u-rise" ${sd(1.2)}>${stats.map((s, i) => `<div class="stat"><b${i === 0 ? ' class="o"' : ''}>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
      </div>
      <div class="s1-r u-wipeUp" ${sd(.5)}>
        <div class="logo-panel" data-logo data-noswipe></div>
        <div class="s1-lab">SCRATCH ｜ ${L('滑過方格，翻轉 LOGO', 'Swipe across the grid to flip the logo', '칸 위를 지나 로고를 뒤집어 보세요')}</div>
        <div class="s1-next"><span>NEXT</span><i data-sw></i><i data-sw></i><i data-sw></i><b data-lv>LAYER × 00</b></div>
      </div>
    </div>`;
  }

  function wdHTML(i) {
    const w = WORKS[i];
    const badges = w.badge ? `<div class="wd-badges"><span class="b1">NEW STORY</span><span class="b2">${launched() ? 'NOW ON LINE WEBTOON' : 'COMING SOON'}</span></div>` : '';
    return `<div class="wd-no">${String(i + 1).padStart(2, '0')}</div>
      <div class="wd-code">${w.k.toUpperCase()}</div>${badges}
      <h3>${esc(w.title)}</h3>
      <div class="wd-tags">${w.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <div class="wd-meta">${w.meta.map(m => `<span>${esc(m)}</span>`).join('')}</div>
      <div class="wd-btns"><a class="btn btn-p" href="/works/${w.k}/">${L('作品介紹', 'About the story', '작품 소개')} <span>↗</span></a><a class="btn btn-s" href="/works/">${L('更多作品', 'More stories', '더 많은 작품')} <span>↗</span></a></div>`;
  }
  function sWorks() {
    return `<div class="gh-s s2 works" data-screen="works">
      <div class="s2-head">
        <div><span class="eyebrow u-fade" ${sd(.3)}>SELECT YOUR STORY</span><h2><span class="u-line" ${sd(.35)}>${L('選擇作品', 'Select a story', '작품 선택')}</span></h2></div>
        <div class="ctl u-rise" style="--d:.7s;--t:.7s"><button data-w="-1" aria-label="${L('上一個作品', 'Previous story', '이전 작품')}">←</button><div class="ctl-n"><b data-wn>01</b> / 06</div><button data-w="1" aria-label="${L('下一個作品', 'Next story', '다음 작품')}">→</button></div>
      </div>
      <div class="s2-body">
        <div class="car u-fade" ${sd(.5)} data-car data-noswipe role="group" aria-label="${L('作品輪播', 'Stories carousel', '작품 캐러셀')}">${WORKS.map((w, i) => `<button class="car-card${w.fit ? ' fit' : ''}"${w.fit ? ` style="--fill:url(${w.cover})"` : ''} data-i="${i}" aria-label="${esc(w.title)}"><img src="${w.cover}" alt="" width="400" height="600" draggable="false" decoding="async"></button>`).join('')}</div>
        <div class="wd-dots" data-dots>${WORKS.map((w, i) => `<button data-i="${i}" aria-label="${i + 1}"><i></i></button>`).join('')}</div>
        <div class="wd u-rise" ${sd(.8)} data-wd aria-live="polite">${wdHTML(0)}</div>
      </div>
    </div>`;
  }

  function sPlay() {
    const eb = L('BE MY PORTFOLIO — LOVE QUEST ｜ 最新作品線上玩', 'BE MY PORTFOLIO — LOVE QUEST ｜ Play our latest story', 'BE MY PORTFOLIO — LOVE QUEST ｜ 최신 작품 플레이');
    const h2 = L('成為我的作品吧！<br>心動任務', 'Be My Portfolio<br>Love Quest', '나의 작품이 되어줘!<br>두근두근 퀘스트');
    const date = L('10 月 7 日晚上 9 點開放（台灣時間）', 'Opened October 7 at 9 PM (Taiwan time)', '10월 7일 오후 9시 공개 (대만 시간)');
    const rows = MENU.map((m, i) => {
      const inner = `<i>▶</i><span>${m.zh}</span><em>${m.en}</em>`;
      if (i === 0) return `<a class="mrow${i === S.sel ? ' on' : ''}" data-i="${i}" href="${GAME}">${inner}</a>`;
      if (i === 2) return `<a class="mrow${i === S.sel ? ' on' : ''}" data-i="${i}" href="https://www.instagram.com/intrvl_studio/" target="_blank" rel="noopener noreferrer">${inner}</a>`;
      return `<button class="mrow${i === S.sel ? ' on' : ''}" data-i="${i}" type="button">${inner}</button>`;
    }).join('');
    return `<div class="gh-s s3" data-screen="play">
      <a class="pg u-wipeUp" ${sd(.5)} href="${GAME}" aria-label="${L('開始遊戲：成為我的作品吧！心動任務', 'Start the game: Be My Portfolio — Love Quest', '게임 시작: 나의 작품이 되어줘! 두근두근 퀘스트')}">
        <div class="pg-img" style="background-image:url(/assets/love-quest-promo.webp?v=20261009-no-url)"></div>
        <div class="pg-top"><span>INTRVL RPG · <b>● ONLINE</b></span><span class="blink o" style="font-weight:700">${mqFine.matches ? 'PRESS ENTER' : 'TAP TO START'}</span></div>
        <div class="pg-dlg"><b>INTRVL</b><div><span data-type></span><i data-arrow style="opacity:0">▼</i></div></div>
      </a>
      <div class="s3-r">
        <span class="eyebrow u-fade" ${sd(.3)}>${eb}</span>
        <h2><span class="u-line" ${sd(.35)}>${h2}</span></h2>
        <p class="u-rise" ${sd(.6)}>${date}</p>
        <div class="menu u-wipeR" style="--d:.75s;--t:.8s"  data-menu>${rows}</div>
      </div>
    </div>`;
  }

  function sNews() {
    const mq = `<span>${L('最新消息', 'LATEST NEWS', '최신 소식')}</span>${vSvg('#FF9142')}<span>${L('最新消息', 'LATEST NEWS', '최신 소식')}</span>${vSvg('#FF9142')}`;
    const fu = L([['LINE WEBTOON', '我們唯一的連載平台'], ['台灣角川', '實體書出版發行'], ['CWT', '每年於台灣同人誌販售會發行全新獨立刊物']],
      [['LINE WEBTOON', 'Our exclusive serialization platform'], ['Kadokawa Taiwan', 'Print editions'], ['CWT', 'New independent publications every year at Comic World Taiwan']],
      [['LINE WEBTOON', '독점 연재 플랫폼'], ['대만 카도카와', '단행본 출판'], ['CWT', '매년 대만 코믹 월드(CWT)에서 새로운 독립 출판물 발매']]);
    return `<div class="gh-s s4" data-screen="news">
      <div class="mq u-wipeR" ${sd(.25)} aria-hidden="true"><div class="mq-t"><div>${mq}</div><div>${mq}</div></div></div>
      <div class="s4-g">
        <section class="bull official-board u-rise" style="--d:.55s;--t:.9s" aria-label="${L('官方佈告欄', 'Studio bulletin', '공식 게시판')}">
          <span class="eyebrow">OFFICIAL BULLETIN</span>
          <div class="bull-t">${L('官方佈告欄', 'Studio bulletin', '공식 게시판')}</div>
          <div class="chips" data-chips></div>
          <div class="posts" data-posts aria-live="polite"><div class="post" style="color:var(--g);font-size:14px">${L('載入中…', 'Loading…', '불러오는 중…')}</div></div>
          <a class="bull-all" href="/news/"><span>${L('查看全部消息', 'See all news', '전체 소식 보기')}</span><b>→</b></a>
          <div class="bull-foot"><span>${L('最新消息都在 Instagram，歡迎追蹤', 'Studio updates are posted on Instagram. Follow', '스튜디오 소식은 Instagram에서 확인하세요')}</span><a href="https://www.instagram.com/intrvl_studio/" target="_blank" rel="noopener noreferrer">@intrvl_studio ↗</a></div>
        </section>
        <div class="fu u-rise" style="--d:.7s;--t:.9s">
          <span class="eyebrow">FIND US ｜ ${L('在哪裡找到我們', 'Where to find us', '우리를 만나는 곳')}</span>
          ${fu.map(r => `<div class="fu-row"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}
          <div class="soc">${SOCIAL.map(s => `<a href="${s[2]}" target="_blank" rel="noopener noreferrer"><small>${s[0]}</small><b>${s[1]} ↗</b></a>`).join('')}</div>
        </div>
      </div>
    </div>`;
  }

  function sTeam() {
    const h2 = L('一個團隊，<span class="o">各司其職</span>', 'One team,<br><span class="o">many trades</span>', '하나의 팀,<br><span class="o">저마다의 본업</span>');
    const p = L('我們在工作室之外都擁有各自的正職——分別在軟體工程、行銷企劃與實體店面經營領域。我們相信，這些來自日常職場的真實體驗，正是賦予故事層次與質感的關鍵。',
      'All of us hold full-time careers outside the studio — in software, marketing, and small business. That grounding in everyday working life is exactly what gives our stories their texture.',
      '우리 모두는 스튜디오 밖에서 각자의 본업을 가지고 있습니다 — 소프트웨어 엔지니어링, 마케팅, 자영업 분야에서요. 일상적인 직장 생활에서 비롯된 이런 경험들이 우리 이야기에 깊이와 질감을 부여한다고 믿습니다.');
    return `<div class="gh-s s5" data-screen="team">
      <div class="s5-head">
        <div><span class="eyebrow u-fade" ${sd(.3)}>${L('關於團隊 · SELECT YOUR PARTY', 'ABOUT THE TEAM · SELECT YOUR PARTY', '팀 소개 · SELECT YOUR PARTY')}</span><h2><span class="u-line" ${sd(.35)}>${h2}</span></h2></div>
        <p class="u-rise" ${sd(.6)}>${p}</p>
      </div>
      <div class="team" data-team>${TEAM.map((m, i) => `<div class="tc" style="--d:${(.45 + i * .08).toFixed(2)}s"><button class="tc-in" data-key="${m.key}" ${m.next ? 'data-next' : ''} aria-label="${esc(m.name)} — ${esc(m.role)}">
          <span class="tc-top"><b>No.${String(i + 1).padStart(2, '0')}</b><span>${m.cls}</span></span>
          <span class="tc-art" style="${m.next ? 'background:#FF9142' : ''}">${m.next ? '<span class="tc-plus">+</span>' : `<span class="ring" style="background:${m.circle}"></span><span data-m="${m.key}"></span>`}</span>
          <span class="tc-nm"><b${m.next ? ' class="o"' : ''}>${esc(m.name)}</b><span>${esc(m.role)}</span></span>
        </button></div>`).join('')}</div>
    </div>`;
  }

  function sCourse() {
    const h2 = L(['想畫好漫畫，', '先把<span class="o">素描</span>練穩。'], ['Want to join us?', 'Start with <span class="o">drawing</span>.'], ['함께하고 싶다면,', '<span class="o">소묘</span>부터 탄탄하게.']);
    const intro = L('給想加入之間工作室的你。我們最重視的繪畫基本功，是素描能力。透過 PIANN 的 Coloso 課程，從觀察、抓型、結構與光影開始，把「看懂」練成「畫得出來」。',
      'For anyone who wants to join INTRVL. Drawing fundamentals matter most to us — and sketching is the core. Through PIANN’s Coloso course, start from observation, shape, structure and light, and turn “seeing” into “drawing”.',
      'INTRVL에 함께하고 싶은 분들께. 저희가 가장 중요하게 보는 것은 소묘 기본기입니다. PIANN의 Coloso 강의에서 관찰, 형태, 구조, 명암부터 익혀 “보는 것”을 “그리는 것”으로 바꿔 보세요.');
    const st = L([['PIANN', '之間工作室・課程講師'], ['50', '堂線上影片課程'], ['40', '組課程練習']], [['PIANN', 'INTRVL Studio · instructor'], ['50', 'online video lessons'], ['40', 'practice sets']], [['PIANN', 'INTRVL 스튜디오 · 강사'], ['50', '온라인 영상 강의'], ['40', '연습 세트']]);
    return `<div class="gh-s s6" data-screen="course">
      <div class="s6-l">
        <span class="eyebrow u-fade" ${sd(.3)}>INTRVL LEARNING / PIANN × COLOSO</span>
        <h2>${h2.map((x, i) => `<span class="lw"><span class="u-line" ${sd((.35 + i * .13).toFixed(2))}>${x}</span></span>`).join('')}</h2>
        <p class="u-rise" ${sd(.65)}>${intro}</p>
        <div class="s6-st u-rise" ${sd(.8)}>${st.map((s, i) => `<div class="stat"><b${i === 0 ? ' class="o"' : ''}>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
        <div class="s6-btns u-rise" ${sd(.95)}>
          <a class="btn btn-p" href="https://coloso.global/en/products/webtoonartist-piann-zh" target="_blank" rel="noopener noreferrer">${L('前往 Coloso 查看課程與報名', 'View the course on Coloso', 'Coloso에서 강의 확인하기')} <span>↗</span></a>
          <a class="btn btn-s" href="/course/">${L('先了解我們重視的能力', 'What we look for (Chinese)', '우리가 중시하는 역량 (중국어)')} <span>↗</span></a>
        </div>
      </div>
      <div class="s6-r u-rise" ${sd(.6)} style="--t:.9s" data-cwrap>
        <div class="cs" data-cs data-noswipe role="group" aria-label="${L('課程圖片輪播', 'Course images', '강의 이미지')}">
          ${COURSE.map(c => `<div class="cs-s" style="background-image:url(/assets/coloso/${c.k}.webp);clip-path:inset(0 0 0 100%)"></div>`).join('')}
          <div class="cs-part" data-cpart></div>
          <div class="cs-c"><button data-c="-1" aria-label="${L('上一張', 'Previous', '이전')}">←</button><div><b data-cn>01</b> / 06</div><button data-c="1" aria-label="${L('下一張', 'Next', '다음')}">→</button></div>
        </div>
        <div class="cs-bars">${COURSE.map((c, i) => `<button data-i="${i}" aria-label="${i + 1} / 06"><i></i></button>`).join('')}</div>
        <div class="cs-cap" aria-live="polite"><b data-ct></b><span data-cd></span></div>
      </div>
    </div>`;
  }

  function joinTab(tab) {
    if (tab === 0) {
      return `<div class="jt jt-h">
        <span class="eyebrow">WE ARE HIRING</span>
        <h2><span class="u-line" ${sd(.2)}>${L('加入我們', 'Join us', '함께해요')}</span></h2>
        <p class="jt-sub">${L('正在徵才，徵招更多工作夥伴', 'We are hiring — join our team', '함께할 동료를 찾고 있습니다')}</p>
        <div class="jt-btns"><a class="btn btn-p" href="/apply/">${L('投遞履歷', 'Apply now', '지원하기')} <span>↗</span></a><button class="btn btn-s" data-go="6">${L('先把素描練穩', 'Start with drawing', '소묘부터 탄탄하게')} →</button></div>
      </div>`;
    }
    const h3 = L('認識我們，<br>與我們<span class="o">合作</span>', 'Get to know us,<br>work with <span class="o">us</span>', '우리를 알아보고<br>함께 <span class="o">일해요</span>');
    return `<div class="jt jt-c">
      <span class="eyebrow">${L('合作夥伴 · 找到我們 · 洽詢', 'COLLABORATE · FIND US · INQUIRE', '협력 · 우리를 만나는 곳 · 문의')}</span>
      <h3>${h3}</h3>
      <p class="jt-body">${L('我們歡迎來自出版社、品牌與合法註冊公司的專業合作邀約。', 'We welcome professional collaborations from publishers, brands, and legally registered companies.', '출판사, 브랜드 및 법인 등록된 기업의 전문 협업 문의를 환영합니다.')}</p>
      <div class="wd-tags">${L(['出版合約', '品牌 IP 改編', '企業插畫'], ['Publishing', 'Brand IP adaptation', 'Corporate illustration'], ['출판', '브랜드 IP 각색', '기업 일러스트']).map(t => `<span class="chip">${t}</span>`).join('')}</div>
      <div class="jt-btns"><a class="btn btn-p mail" href="mailto:${EMAIL}">${EMAIL} <span>↗</span></a><span class="jt-note">${L('目前不接受私人或個人委託（非商委託）。', 'We are not currently taking private or personal commissions.', '현재 개인 의뢰(비상업 의뢰)는 받지 않습니다.')}</span></div>
      <div class="jt-ext"><small>${L('外部 · 編劇', 'EXTERNAL · WRITER', '외부 · 각본')}</small><span><b>${L('十八日', '18xDay', '18xDay')}</b> 18xDay ｜ ${L('合作作品《就要弄死你》', 'Collaboration — I’m Going to Kill You', '협업작 《너를 죽여줄게》')}</span></div>
    </div>`;
  }
  function sJoin() {
    return `<div class="gh-s s7" data-screen="join">
      <div class="s7-f u-zoom" style="--d:.3s;--t:1s">
        <div class="s7-img u-wipeR" ${sd(.6)} data-jimg style="background:#1F1F1F"><i class="on" style="background-image:url(/assets/join/hiring.webp)"></i><i style="background-image:url(/assets/join/contact.webp)"></i><b data-jcap></b></div>
        <div class="s7-c">
          <div class="tabs u-fade" ${sd(.6)} role="tablist">${L(['徵才', '合作'], ['Hiring', 'Contact'], ['채용', '문의']).map((z, i) => `<button role="tab" data-jt="${i}" aria-selected="${i === 0}" class="${i === 0 ? 'on' : ''}"><b>${z}</b><small>${['HIRING', 'CONTACT'][i]}</small></button>`).join('')}</div>
          <div data-jbody>${joinTab(0)}</div>
          <div class="s7-foot u-fade" ${sd(1.1)}><span>${EMAIL}</span><span>intrvlstudio.cc</span><button type="button" data-replay>${L('重播開場', 'Replay intro', '오프닝 다시 보기')} ↺</button><button type="button" data-privacy>${L('統計與隱私設定', 'Analytics & privacy', '통계 및 개인정보 설정')}</button></div>
        </div>
      </div>
    </div>`;
  }
  const BUILD = [sBoot, sHome, sWorks, sPlay, sNews, sTeam, sCourse, sJoin];

  /* ------------------------------------------------------------- behaviour */
  function mountStage(n) {
    cleanups.forEach(f => { try { f(); } catch {} });
    cleanups = [];
    S.stage = n;
    elStage.innerHTML = BUILD[n]();
    elStage.scrollTop = 0;
    elStage.setAttribute('data-n', n);
    chrome(n);
    const init = [initBoot, initHome, initWorks, initPlay, initNews, initTeam, initCourse, initJoin][n];
    init(elStage.firstElementChild);
  }

  function chrome(n) {
    const st = STAGES[n];
    elBg.style.background = st.bg;
    root.classList.toggle('on-orange', n === 3);
    root.dataset.st = st.hash;
    const hud = n > 0;
    elHud.hidden = !hud; elAb.hidden = !hud; elTb.hidden = !hud;
    $$('[data-go]', elHud).forEach(b => { const on = +b.dataset.go === n; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
    $$('.hud-bars i', elHud).forEach((b, i) => b.classList.toggle('on', i + 1 === n));
    $('[data-num]', elHud).textContent = st.n;
    $('[data-numen]', elHud).textContent = `/ 07 · ${st.en}`;
    $('[data-hint]', elHud).textContent = n === 3 ? '↑ ↓ 選擇 ／ ENTER 確認 ／ SCROLL ／ 1–7'.replace('選擇', L('選擇', 'SELECT', '선택')).replace('確認', L('確認', 'CONFIRM', '확인')) : 'SCROLL ↓ ／ ↑ ↓ ／ 1–7';
    $$('[data-tab]', elTb).forEach(b => { const id = b.dataset.tab, on = id === 'more' ? n >= 5 : +id === n; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
    $$('[data-lang] a').forEach(a => { a.setAttribute('href', langHref(a.getAttribute('hreflang') === 'zh-TW' ? 'zh' : a.getAttribute('hreflang')) + (n > 0 ? '#' + st.hash : '')); });
    if (n > 0) { try { history.replaceState(history.state, '', '#' + st.hash); } catch {} }
    elLive.textContent = n > 0 ? `${st.n} ${st.name}` : '';
    if (n > 0) { try { dispatchEvent(new CustomEvent('intrvl:stage', { detail: st.hash })); } catch {} }
    if (SEO) SEO.hidden = n > 0;
  }

  /* boot */
  function initBoot(el) {
    R.classList.add('intro-playing');
    clearInterval(bootTimer);
    S.boot = 0; S.bootDone = false;
    const pct = $('[data-pct]', el), bar = $('[data-pbar]', el), start = $('[data-start]', el);
    const paint = () => { pct.textContent = String(S.boot).padStart(3, '0'); bar.style.width = S.boot + '%'; };
    const finish = () => {
      S.bootDone = true;
      start.innerHTML = `<button type="button"><b>PRESS START</b><span>${mqFine.matches ? L('按任意鍵開始', 'PRESS ANY KEY', '아무 키나 눌러 시작') : L('點一下開始', 'TAP TO START', '탭해서 시작')}</span></button>`;
    };
    if (reduced()) { S.boot = 100; paint(); finish(); return; }
    bootTimer = setInterval(() => {
      if (S.boot >= 100) { clearInterval(bootTimer); return; }
      S.boot = Math.min(100, S.boot + 1 + Math.floor(Math.random() * 4));
      paint();
      if (S.boot >= 100) { clearInterval(bootTimer); finish(); }
    }, 40);
    cleanups.push(() => clearInterval(bootTimer));
    el.addEventListener('click', () => { if (S.bootDone) leaveBoot(); });
  }
  function leaveBoot() {
    if (!S.bootDone || S.stage !== 0) return;
    try { sessionStorage.setItem('intrvl_gh_boot', '1'); } catch {}
    go(startStage());
  }
  function startStage() { return hashStage().n || 1; }
  function hashStage() {
    const h = decodeURIComponent((location.hash || '').replace(/^#/, '')).toLowerCase();
    const n = HASH_MAP[h] || 0;
    return { n, tab: h === 'contact' ? 1 : 0 };
  }

  /* home: logo scratch */
  function initHome(el) {
    const panel = $('[data-logo]', el), sw = $$('[data-sw]', el), lvEl = $('[data-lv]', el);
    const uris = LOGO_C.map(([, ink]) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800"><g fill="${ink}" transform="translate(220 217) scale(1.44)"><g transform="translate(119.5 0) scale(1.76)"><path d="${V.chev}"/><path d="${V.tri}"/></g><g transform="translate(0 168.5)">${WM.map(d => `<path d="${d}"/>`).join('')}</g></g></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    });
    const cells = [];
    for (let i = 0; i < COLS * ROWS; i++) { const c = D.createElement('div'); c.dataset.i = i; panel.append(c); cells.push(c); }
    const cs = cells.map(() => S.lv);
    const paintCell = i => { const k = cs[i] % 3; cells[i].style.backgroundColor = LOGO_C[k][0]; cells[i].style.backgroundImage = uris[k]; };
    const paintSw = () => {
      sw.forEach((s, k) => { s.style.background = LOGO_C[k][1]; s.style.boxShadow = (S.lv + 1) % 3 === k ? '0 0 0 2px #FF9142' : 'none'; });
      lvEl.textContent = 'LAYER × ' + String(S.lv).padStart(2, '0');
    };
    const layout = () => {
      const r = panel.getBoundingClientRect(); if (!r.width) return;
      const cw = r.width / COLS, ch = r.height / ROWS;
      cells.forEach((c, i) => {
        const x = i % COLS, y = Math.floor(i / COLS);
        Object.assign(c.style, { left: x * cw + 'px', top: y * ch + 'px', width: cw + .6 + 'px', height: ch + .6 + 'px', backgroundSize: r.width + 'px ' + r.height + 'px', backgroundPosition: -x * cw + 'px ' + -y * ch + 'px' });
        paintCell(i);
      });
    };
    layout(); paintSw();
    const ro = new ResizeObserver(layout); ro.observe(panel); cleanups.push(() => ro.disconnect());
    const flip = (i, to, delay) => {
      const c = cells[i]; cs[i] = to;
      if (reduced()) { paintCell(i); return; }
      c.animate([{ transform: 'perspective(600px) rotateY(0deg)' }, { transform: 'perspective(600px) rotateY(90deg)' }], { duration: 150, delay, easing: 'cubic-bezier(.7,0,1,1)', fill: 'both' }).finished.then(() => {
        paintCell(i);
        c.animate([{ transform: 'perspective(600px) rotateY(-90deg)' }, { transform: 'perspective(600px) rotateY(0deg)' }], { duration: 200, easing: 'cubic-bezier(0,0,.3,1)', fill: 'both' });
      }).catch(() => {});
    };
    let lcx = -1, lcy = -1;
    const brush = e => {
      const r = panel.getBoundingClientRect();
      const cx = Math.floor((e.clientX - r.left) / (r.width / COLS)), cy = Math.floor((e.clientY - r.top) / (r.height / ROWS));
      if (cx === lcx && cy === lcy) return; lcx = cx; lcy = cy;
      const lv = S.lv;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        const i = y * COLS + x; if (cs[i] === lv) flip(i, lv + 1, (Math.abs(dx) + Math.abs(dy)) * 45);
      }
      if (cs.filter(v => v > lv).length >= cs.length * .8) {
        cs.forEach((v, i) => { if (v === lv) { const x = i % COLS, y = Math.floor(i / COLS); flip(i, lv + 1, 120 + (Math.abs(x - cx) + Math.abs(y - cy)) * 35); } });
        S.lv = lv + 1; paintSw();
      }
    };
    panel.addEventListener('pointermove', brush);
    panel.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') brush(e); });
  }

  /* works carousel */
  function setWi(i) { S.wi = (i + WORKS.length) % WORKS.length; paintWorks(true); }
  function paintWorks(swap) {
    const cars = $$('.car-card', elStage), n = WORKS.length;
    cars.forEach((c, i) => {
      let o = i - S.wi; if (o > 3) o -= n; if (o < -2) o += n; const a = Math.abs(o);
      c.style.transform = `translate(${-50 + o * 56}%,-50%) scale(${o === 0 ? 1 : .8 - a * .06}) rotateY(${o * -24}deg)`;
      c.style.opacity = a > 2 ? 0 : (o === 0 ? 1 : .8 - a * .22);
      c.style.filter = o === 0 ? 'none' : 'grayscale(1) brightness(.5)';
      c.style.zIndex = 10 - a;
      c.style.outline = o === 0 ? '3px solid #FF9142' : '0 solid transparent';
      c.style.pointerEvents = a > 2 ? 'none' : 'auto';
      c.tabIndex = o === 0 ? 0 : -1;
      c.setAttribute('aria-current', o === 0 ? 'true' : 'false');
    });
    $$('.wd-dots button', elStage).forEach((b, i) => b.classList.toggle('on', i === S.wi));
    const wn = $('[data-wn]', elStage); if (wn) wn.textContent = String(S.wi + 1).padStart(2, '0');
    const wd = $('[data-wd]', elStage); if (!wd) return;
    if (!swap) { wd.innerHTML = wdHTML(S.wi); return; }
    if (reduced()) { wd.innerHTML = wdHTML(S.wi); return; }
    const token = ++wd._t;
    wd.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-24px)' }], { duration: 180, fill: 'forwards' }).finished.then(() => {
      if (token !== wd._t) return;
      wd.innerHTML = wdHTML(S.wi);
      wd.getAnimations().forEach(a => a.cancel());
      wd.animate([{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }).catch(() => {});
  }
  function initWorks(el) {
    const wd = $('[data-wd]', el); wd._t = 0;
    const cardEls = $$('.car-card', el); cardEls.forEach(c => { c.style.transition = 'none'; });
    paintWorks(false);
    void el.offsetWidth; cardEls.forEach(c => { c.style.transition = ''; });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-w]'); if (b) { setWi(S.wi + +b.dataset.w); return; }
      const d = e.target.closest('.wd-dots button'); if (d) { setWi(+d.dataset.i); return; }
      const c = e.target.closest('.car-card'); if (c && !el._dragged) setWi(+c.dataset.i);
    });
    const car = $('[data-car]', el);
    let sx = null, sy = 0;
    car.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; el._dragged = false; });
    car.addEventListener('pointerup', e => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { el._dragged = true; setTimeout(() => { el._dragged = false; }, 50); setWi(S.wi + (dx < 0 ? 1 : -1)); }
    });
    car.addEventListener('pointercancel', () => { sx = null; });
  }

  /* play */
  function initPlay(el) {
    const typeEl = $('[data-type]', el), arrow = $('[data-arrow]', el), rows = $$('.mrow', el);
    const text = () => (mqFine.matches ? MENU[S.sel].d : (MENU[S.sel].dt || MENU[S.sel].d));
    let typed = 0;
    const tick = () => { const t = text(); if (typed < t.length) { typed++; typeEl.textContent = t.slice(0, typed); arrow.style.opacity = typed >= t.length ? 1 : 0; } };
    const reset = () => { typed = reduced() ? text().length : 0; typeEl.textContent = text().slice(0, typed); arrow.style.opacity = typed >= text().length ? 1 : 0; arrow.classList.toggle('blink', typed >= text().length); };
    reset();
    const id = setInterval(tick, 32); cleanups.push(() => clearInterval(id));
    el._pick = i => { const n = (i + 3) % 3; if (n === S.sel) return; S.sel = n; rows.forEach((r, k) => r.classList.toggle('on', k === n)); reset(); };
    el._run = i => {
      if (i === 1) { S.wi = 0; go(2); return; }
      rows[i].click();
    };
    rows.forEach((r, i) => {
      r.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') el._pick(i); });
      r.addEventListener('focus', () => el._pick(i));
      if (i === 1) r.addEventListener('click', () => el._run(1));
    });
  }

  /* news */
  async function initNews(el) {
    const chips = $('[data-chips]', el), posts = $('[data-posts]', el);
    let all = [];
    try { all = await window.INTRVLNewsFeed.load(LANG); } catch { all = []; }
    if (S.stage !== 4) return;
    const cats = [...new Set(all.map(p => p.cat))].filter(c => NEWS_CATS[c]);
    const paint = () => {
      chips.innerHTML = [['all', L('全部', 'All', '전체')], ...cats.map(c => [c, NEWS_CATS[c]])].map(([k, v]) => `<button type="button" data-cat="${k}" class="${S.cat === k ? 'on' : ''}">${esc(v)}</button>`).join('');
      const list = all.filter(p => S.cat === 'all' || p.cat === S.cat).slice(0, 3);
      posts.innerHTML = list.length ? list.map(p => {
        const ext = /^https?:/.test(p.url);
        return `<article class="post"><time datetime="${esc(p.date)}">${esc(p.date)}</time><h3>${esc(p.title)}</h3>${p.body ? `<p>${esc(p.body)}</p>` : ''}${p.url ? `<a href="${esc(p.url)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${ext ? 'Instagram ↗' : L('了解更多 →', 'Read more →', '자세히 보기 →')}</a>` : ''}</article>`;
      }).join('') : `<div class="post" style="color:var(--g);font-size:14px">${L('目前沒有公告', 'No announcements right now', '현재 공지가 없습니다')}</div>`;
    };
    paint();
    chips.addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { S.cat = b.dataset.cat; paint(); } });
  }

  /* team */
  function loadMascots() {
    if (mascotsP) return mascotsP;
    mascotsP = fetch('/assets/team/mascots.json').then(r => r.json()).then(d => {
      mascots = d;
      if (!$('#intrvl-mascot-css')) {
        const st = D.createElement('style'); st.id = 'intrvl-mascot-css';
        st.textContent = Object.values(d).map(o => o.css).join('\n');
        D.head.appendChild(st);
      }
    }).catch(() => { mascots = {}; });
    return mascotsP;
  }
  async function initTeam(el) {
    await loadMascots();
    if (S.stage !== 5) return;
    const SZ = {
      piann: 'width:100%;height:100%;transform:translateX(17%)', m3: 'width:68%;height:90%', page: 'width:60%;height:65%', mega: 'width:80%;height:100%',
      angela: 'position:absolute;left:50%;bottom:-13%;transform:translateX(-50%) scale(.8);width:100%;height:125%'
    };
    $$('[data-m]', el).forEach(b => {
      const k = b.dataset.m, o = mascots[k]; if (!o || b.firstChild) return;
      b.innerHTML = o.svg;
      const s = $('svg', b); if (!s) return;
      s.setAttribute('viewBox', o.vb); s.removeAttribute('width'); s.removeAttribute('height'); s.setAttribute('aria-hidden', 'true');
      s.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      s.style.cssText = 'display:block;flex:none;overflow:visible;' + SZ[k];
      b.style.display = 'flex'; b.style.alignItems = 'flex-end'; b.style.justifyContent = 'center';
    });
    const cards = $$('.tc-in', el), play = (c, on) => { const m = $('[data-m]', c); if (m) m.classList.toggle('on', on); };
    cards.forEach(c => {
      c.addEventListener('mouseenter', () => play(c, true)); c.addEventListener('mouseleave', () => play(c, false));
      c.addEventListener('focus', () => play(c, true)); c.addEventListener('blur', () => play(c, false));
      c.addEventListener('click', () => { if (c.hasAttribute('data-next')) { S.tab = 0; go(7); } });
    });
    if (!mqFine.matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => play(e.target, e.isIntersecting && e.intersectionRatio >= .6)), { root: elStage, threshold: [0, .6, 1] });
      cards.forEach(c => io.observe(c)); cleanups.push(() => io.disconnect());
    }
  }

  /* course */
  function paintCourse() {
    const el = $('[data-cs]', elStage); if (!el) return;
    const a = S.ci, p = S.cprev;
    $$('.cs-s', el).forEach((s, i) => {
      const on = i === a, was = i === p;
      s.style.zIndex = on ? 3 : was ? 2 : 1;
      s.style.clipPath = on || was ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)';
      s.style.transition = on && !reduced() ? 'clip-path .9s cubic-bezier(.7,0,.2,1)' : 'none';
    });
    $$('.cs-bars button', elStage).forEach((b, i) => b.classList.toggle('on', i === a));
    $('[data-cpart]', el).textContent = COURSE[a].part;
    $('[data-cn]', el).textContent = String(a + 1).padStart(2, '0');
    $('[data-ct]', elStage).textContent = COURSE[a].t; $('[data-cd]', elStage).textContent = COURSE[a].d;
  }
  function setCi(i) { S.cprev = S.ci; S.ci = (i + COURSE.length) % COURSE.length; paintCourse(); }
  function initCourse(el) {
    S.cprev = -1; S.ci = 0; paintCourse();
    let held = false;
    const wrap = $('[data-cwrap]', el);
    wrap.addEventListener('mouseenter', () => { held = true; }); wrap.addEventListener('mouseleave', () => { held = false; });
    wrap.addEventListener('focusin', () => { held = true; }); wrap.addEventListener('focusout', () => { held = false; });
    const id = setInterval(() => { if (!held && !reduced() && !D.hidden && S.stage === 6) setCi(S.ci + 1); }, 4200); cleanups.push(() => clearInterval(id));
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (b) { setCi(S.ci + +b.dataset.c); return; }
      const d = e.target.closest('.cs-bars button'); if (d) setCi(+d.dataset.i);
    });
    const cs = $('[data-cs]', el); let sx = null, sy = 0;
    cs.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; held = true; });
    cs.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setCi(S.ci + (dx < 0 ? 1 : -1)); if (e.pointerType !== 'mouse') setTimeout(() => { held = false; }, 6000); });
    cs.addEventListener('pointercancel', () => { sx = null; });
  }

  /* join */
  function paintJoin() {
    const el = $('.s7', elStage); if (!el) return;
    $$('.tabs button', el).forEach((b, i) => { b.classList.toggle('on', i === S.tab); b.setAttribute('aria-selected', i === S.tab); });
    $('[data-jbody]', el).innerHTML = joinTab(S.tab);
    $$('.s7-img i', el).forEach((i, k) => i.classList.toggle('on', k === S.tab));
    $('[data-jimg]', el).style.background = ['#1F1F1F', '#FF9142'][S.tab];
    $('[data-jcap]', el).textContent = S.tab === 0 ? L('WE ARE HIRING ｜ 正在徵才', 'WE ARE HIRING', 'WE ARE HIRING ｜ 채용 중') : L('之間工作室 ｜ Made in Taiwan · 準時，每一週', 'INTRVL Studio ｜ Made in Taiwan · On time, every week', 'INTRVL Studio ｜ Made in Taiwan · 매주 제시간에');
  }
  function initJoin(el) {
    paintJoin();
    el.addEventListener('click', e => {
      const t = e.target.closest('.tabs button'); if (t) { S.tab = +t.dataset.jt; paintJoin(); return; }
      if (e.target.closest('[data-replay]')) { try { sessionStorage.removeItem('intrvl_gh_boot'); history.replaceState(history.state, '', location.pathname); } catch {} go(0); }
    });
  }

  /* ----------------------------------------------------------- transitions */
  const anim = (el, kf, opt) => el.animate(kf, Object.assign({ fill: 'forwards' }, opt)).finished;
  function vPoly(s, rot) {
    const P = [[42.702, 73], [15.561, 26.626], [34.93, 26.626], [42.702, 39.914], [57.312, 14.985], [85.205, 0.479]];
    const r = rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
    return 'polygon(' + P.map(([x, y]) => { const dx = (x - 55) * s, dy = (y - 35) * s; return `calc(50% + ${(dx * co - dy * si).toFixed(1)}px) calc(50% + ${(dx * si + dy * co).toFixed(1)}px)`; }).join(',') + ')';
  }
  const vFrames = (a, b, r0, r1) => { const f = []; for (let i = 0; i <= 12; i++) { const t = i / 12; f.push({ clipPath: vPoly(a * Math.pow(b / a, t), r0 + (r1 - r0) * t) }); } return f; };
  function buildOverlay() {
    const mk = (g, k, l, i, css) => `<div data-k="${k}" data-l="${l}" data-i="${i}" style="${css}"></div>`;
    let h = '';
    h += `<div data-g="v">${[1, 2].map(l => mk('v', 'v', l, 0, `inset:0;background:${l === 1 ? '#FF9142' : '#000'};clip-path:polygon(50% 50%,50% 50%,50% 50%)`)).join('')}</div>`;
    h += `<div data-g="slice">${[1, 2].map(l => Array.from({ length: 10 }, (_, i) => mk('slice', 'slice', l, i, `top:0;bottom:0;left:${i * 10}%;width:10.2%;background:${l === 1 ? '#FF9142' : '#000'};transform:scaleY(0)`)).join('')).join('')}</div>`;
    h += `<div data-g="blk">${[1, 2].map(l => Array.from({ length: 40 }, (_, i) => mk('blk', 'blk', l, i, `left:${(i % 8) * 12.5}%;top:${Math.floor(i / 8) * 20}%;width:12.6%;height:20.2%;background:${l === 1 ? '#FF9142' : '#000'};transform:scale(0)`)).join('')).join('')}</div>`;
    h += `<div data-g="diag">${[1, 2].map(l => [0, 1].map(i => mk('diag', 'diag', l, i, `inset:0;background:${l === 1 ? '#FF9142' : '#000'};clip-path:${i === 0 ? 'polygon(0 0,102% 0,0 102%)' : 'polygon(100% -2%,100% 100%,-2% 100%)'};transform:translate(${i === 0 ? '-100%,-100%' : '100%,100%'})`)).join('')).join('')}</div>`;
    h += `<div class="ov-lab" data-lab><span data-ovn></span><strong data-ovz></strong><em data-ove></em><div class="ov-bar"><i data-bar></i></div></div>`;
    elOv.innerHTML = h;
  }
  function cover(kind, el) {
    const l2 = el.dataset.l === '2', i = +el.dataset.i, ez = 'cubic-bezier(.7,0,.25,1)';
    if (kind === 'v') return anim(el, vFrames(.02, 220, -40, 0), { duration: 760, delay: l2 ? 170 : 0, easing: 'cubic-bezier(.5,0,.4,1)' });
    if (kind === 'slice') { el.style.transformOrigin = '50% 0%'; return anim(el, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 500, delay: i * 38 + (l2 ? 150 : 0), easing: ez }); }
    if (kind === 'blk') { const c = i % 8, r = Math.floor(i / 8); return anim(el, [{ transform: 'scale(0) rotate(90deg)' }, { transform: 'scale(1) rotate(0deg)' }], { duration: 420, delay: (c + r) * 34 + (l2 ? 150 : 0), easing: ez }); }
    const g = i === 0 ? -1 : 1;
    return anim(el, [{ transform: `translate(${g * 100}%,${g * 100}%)` }, { transform: 'translate(0,0)' }], { duration: 620, delay: l2 ? 150 : 0, easing: ez });
  }
  function reveal(kind, el) {
    const l2 = el.dataset.l === '2', i = +el.dataset.i, d = l2 ? 0 : 150, ez = 'cubic-bezier(.7,0,.25,1)';
    if (kind === 'v') return anim(el, vFrames(220, .02, 0, 40), { duration: 720, delay: d, easing: 'cubic-bezier(.5,0,.4,1)' });
    if (kind === 'slice') { el.style.transformOrigin = '50% 100%'; return anim(el, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 500, delay: i * 38 + d, easing: ez }); }
    if (kind === 'blk') { const c = i % 8, r = Math.floor(i / 8); return anim(el, [{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(0) rotate(-90deg)' }], { duration: 420, delay: (c + r) * 34 + d, easing: ez }); }
    const g = i === 0 ? 1 : -1;
    return anim(el, [{ transform: 'translate(0,0)' }, { transform: `translate(${g * 100}%,${g * 100}%)` }], { duration: 620, delay: d, easing: ez });
  }
  async function wipe(n) {
    const lab = $('[data-lab]', elOv), bar = $('[data-bar]', elOv), kind = STAGES[n].kind, st = STAGES[n];
    $('[data-ovn]', elOv).textContent = 'STAGE ' + st.n; $('[data-ovz]', elOv).textContent = st.name; $('[data-ove]', elOv).textContent = LANG === 'en' ? '' : st.en;
    $$('[data-g]', elOv).forEach(g => { g.style.display = g.dataset.g === kind ? 'block' : 'none'; });
    elOv.style.visibility = 'visible';
    const els = $$(`[data-k="${kind}"]`, elOv);
    els.forEach(el => el.getAnimations().forEach(a => a.cancel()));
    await Promise.all(els.map(el => cover(kind, el)));
    // The stage title sits on the covered screen: fade in, let the bar fill, then hold a beat so it never reads as a flash.
    lab.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 320, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' });
    await anim(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)' });
    mountStage(n);
    await new Promise(r => setTimeout(r, 220));
    await anim(lab, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-24px)' }], { duration: 260 });
    await Promise.all(els.map(el => reveal(kind, el)));
    elOv.style.visibility = 'hidden';
    bar.getAnimations().forEach(a => a.cancel()); lab.getAnimations().forEach(a => a.cancel());
  }
  async function slide(n, dir) {
    const cur = elStage.firstElementChild;
    if (cur) await anim(cur, [{ opacity: 1 }, { opacity: 0 }], { duration: 110 }).catch(() => {});
    mountStage(n);
    const next = elStage.firstElementChild;
    if (next && !reduced()) next.animate([{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  async function go(n, opts = {}) {
    if (busy || n === S.stage || n < 0 || n > 7) return;
    busy = true;
    try {
      if (opts.instant || reduced()) mountStage(n);
      else if (isApp() && n > 0 && S.stage > 0) await slide(n, n > S.stage ? 1 : -1);
      else await wipe(n);
    } finally { busy = false; }
    if (S.stage > 0) R.classList.remove('intro-playing');
  }
  // On very short desktop windows the stage scrolls; only change stage once the content has reached its end.
  const canScroll = dir => {
    if (getComputedStyle(elStage).overflowY !== 'auto' || elStage.scrollHeight <= elStage.clientHeight + 4) return false;
    return dir > 0 ? elStage.scrollTop + elStage.clientHeight < elStage.scrollHeight - 2 : elStage.scrollTop > 2;
  };
  const step = d => { const n = S.stage + d; if (S.stage === 0) { leaveBoot(); return; } if (n >= 1 && n <= 7) go(n); };

  /* -------------------------------------------------------------- input */
  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (elSheet.open) return;
    const k = e.key, s = S.stage, tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (s === 0) { if (S.bootDone && k !== 'Tab' && k !== 'Shift') leaveBoot(); return; }
    if (s === 3 && (k === 'ArrowDown' || k === 'ArrowUp')) { if (isApp()) return; e.preventDefault(); $('.s3', elStage)._pick(S.sel + (k === 'ArrowDown' ? 1 : -1)); return; }
    if (s === 3 && k === 'Enter' && !e.target.closest('a,button')) { e.preventDefault(); $('.s3', elStage)._run(S.sel); return; }
    if (!isApp() && (k === 'ArrowDown' || k === 'PageDown')) { if (canScroll(1)) return; e.preventDefault(); step(1); }
    else if (!isApp() && (k === 'ArrowUp' || k === 'PageUp')) { if (canScroll(-1)) return; e.preventDefault(); step(-1); }
    else if (/^[1-7]$/.test(k)) go(+k);
    else if (s === 6 && k === 'ArrowRight') setCi(S.ci + 1);
    else if (s === 6 && k === 'ArrowLeft') setCi(S.ci - 1);
    else if (s === 2 && k === 'ArrowRight') setWi(S.wi + 1);
    else if (s === 2 && k === 'ArrowLeft') setWi(S.wi - 1);
  });
  addEventListener('wheel', e => {
    if (S.stage === 0) { if (S.bootDone) leaveBoot(); return; }
    if (isApp() || busy || Math.abs(e.deltaY) < 25 || Date.now() - lastWheel < 1000 || canScroll(e.deltaY)) return;
    if (e.target.closest && e.target.closest('.sheet')) return;
    lastWheel = Date.now(); step(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });
  let tx = 0, ty = 0, tNo = false;
  root.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0]; tx = t.clientX; ty = t.clientY;
    tNo = !!e.target.closest('[data-noswipe],input,textarea,.sheet') || tx < 24 || tx > innerWidth - 24;
  }, { passive: true });
  root.addEventListener('touchend', e => {
    if (tNo || busy || S.stage === 0 || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (isApp()) { if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1); }
    else if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
  });
  root.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); if (e.detail > 0) g.blur(); if (elSheet.open) elSheet.close(); go(+g.dataset.go); return; }
    const tb = e.target.closest('[data-tab]');
    if (tb && tb.closest('[data-tb]')) { tb.dataset.tab === 'more' ? elSheet.showModal() : go(+tb.dataset.tab); return; }
    if (e.target.closest('[data-close]')) { elSheet.close(); return; }
    if (e.target === elSheet) { elSheet.close(); return; }
    if (e.target.closest('[data-privacy]')) { if (elSheet.open) elSheet.close(); const b = $('.consent-reopen'); if (b) b.click(); return; }
  });
  addEventListener('hashchange', () => { const h = hashStage(); if (h.n && h.n !== S.stage && S.stage > 0) { if (h.n === 7) S.tab = h.tab; go(h.n); } });
  $$('[data-lang] a').forEach(a => a.addEventListener('click', () => { try { localStorage.setItem('intrvl_lang', a.getAttribute('hreflang')); } catch {} }));

  /* ------------------------------------------- cursor + watermark parallax */
  let mx = 0, my = 0, cx = 0, cy = 0, px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py, raf = 0;
  function frame() {
    cx += (mx - cx) * .07; cy += (my - cy) * .07; rx += (px - rx) * .2; ry += (py - ry) * .2;
    elV.style.transform = `translate(${cx * -70}px,${cy * -70}px)`;
    elDot.style.transform = `translate(${px - 3}px,${py - 3}px)`; elRing.style.transform = `translate(${rx - 18}px,${ry - 18}px)`;
    raf = requestAnimationFrame(frame);
  }
  let seen = false;
  function pointerFx() {
    const on = mqFine.matches && !isApp() && !reduced();
    elRing.hidden = elDot.hidden = !on || !seen;
    cancelAnimationFrame(raf);
    if (on) raf = requestAnimationFrame(frame); else elV.style.transform = '';
  }
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; if (!seen) { seen = true; rx = e.clientX; ry = e.clientY; pointerFx(); } px = e.clientX; py = e.clientY; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  [mqApp, mqReduce, mqFine].forEach(m => m.addEventListener && m.addEventListener('change', pointerFx));
  mqApp.addEventListener && mqApp.addEventListener('change', () => { if (S.stage > 0) { const n = S.stage; S.stage = -1; mountStage(n); } });
  D.addEventListener('visibilitychange', () => { if (D.hidden) cancelAnimationFrame(raf); else pointerFx(); });

  /* ----------------------------------------------------------------- start */
  buildOverlay();
  pointerFx();
  const h0 = hashStage();
  let booted = false; try { booted = sessionStorage.getItem('intrvl_gh_boot') === '1'; } catch {}
  if (h0.n || booted) { if (h0.n === 7) S.tab = h0.tab; mountStage(h0.n || 1); }
  else mountStage(0);
  root.classList.add('is-ready');
  window.INTRVLGameHome = { go, get stage() { return S.stage; }, state: S };
})();
