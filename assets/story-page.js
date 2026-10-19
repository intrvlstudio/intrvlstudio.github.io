/* INTRVL work detail page, game edition.
   One work = one stage: title screen -> story (visual novel) -> character select -> collection -> print edition -> result.
   Progress is kept in this browser only (localStorage `intrvl_quest_v1`); nothing is sent anywhere.
   Hooks kept for analytics.js: .detail-hero #story #characters #visuals #books .read-section .next-work .release-gate,
   [data-character] (aria-label 認識…), [data-art], #loadContinue, performance mark `work-ready`. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0'), clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const root = $('#workDetail'), page = $('#pageContent'), start = performance.now();
const reduced = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
const MIN_LOAD = 1400;
let data, assetMap = new Map(), rendered = false, ready = false, finished = false, failed = 0, total = 0, done = 0, pendingHash = null;

/* ---------- inline icons ---------- */
const ICON = {
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S4 15.6 4 9.9A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.5c0 5.700-8 10.600-8 10.600z"/></svg>',
  mark: '<svg viewBox="0 0 303 263" aria-hidden="true"><path d="M151.854 263L55.3371 95.9273H124.214L151.854 143.799L203.807 53.9873L303 1.72394L151.854 263Z"/><path d="M38.2805 66.3006L0 0H203.807L38.2805 66.3006Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10.500h12V20H6zM8.500 10.500V7.500a3.500 3.500 0 0 1 7 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>'
};

/* ---------- loader ---------- */
const kb = n => `${Math.round(n / 1024)} KB`;
const allAssets = w => [w.cover, w.hero, ...(w.pair ? [w.pair] : w.characters.map(c => c.art)), ...w.gallery, ...(w.book ? [w.book.art] : [])];
function finish() {
  if (finished) return; finished = true;
  $('#fillRect')?.setAttribute('y', '0'); $('#loadPercent').textContent = '100%';
  $('#loadText').textContent = failed ? '已準備可用內容' : 'STAGE READY';
  page.inert = false; root.setAttribute('aria-busy', 'false'); performance.mark('work-ready');
  setTimeout(() => {
    $('#workLoader').classList.add('is-done');
    setTimeout(() => $('#workLoader').remove(), 450);
    if (pendingHash) { pendingHash.scrollIntoView({ behavior: 'instant' }); pendingHash = null; }
  }, 150);
}
function tick(now) {
  if (finished) return;
  const elapsed = now - start, t = Math.min(elapsed / MIN_LOAD, 1), fraction = total ? done / total : 0;
  const progress = ready ? Math.min(100, t * 100) : Math.min(94, t * 65 + fraction * 29);
  $('#fillRect').setAttribute('y', String(263 * (1 - progress / 100))); $('#loadPercent').textContent = `${Math.floor(progress)}%`;
  if (elapsed >= MIN_LOAD && ready) finish();
  else { if (elapsed > 12000) { $('#loadNotice').textContent = '連線較慢，仍在準備圖片。可繼續等待，或先進入頁面。'; $('#loadContinue').hidden = false } requestAnimationFrame(tick) }
}
$('#loadContinue').onclick = () => {
  if (rendered) { failed++; finish() }
  else { root.innerHTML = '<section class="error-state"><h1>連線較慢</h1><p>作品資料仍在讀取中，請稍後重試。</p><a href="' + esc(location.href) + '">重新載入 ↗</a></section>'; failed++; finish() }
};
requestAnimationFrame(tick);
async function waitAssets() {
  const imgs = $$('[data-critical]'); total = imgs.length;
  await Promise.all(imgs.map(async img => { try { await img.decode() } catch { failed++; img.alt += '（圖片暫時無法載入）' } finally { done++ } }));
  ready = true;
}

/* ---------- saved progress ---------- */
const STORE = 'intrvl_quest_v1';
let store = {};
try { const o = JSON.parse(localStorage.getItem(STORE) || '{}'); if (o && typeof o === 'object') store = o } catch {}
const saveStore = () => { try { localStorage.setItem(STORE, JSON.stringify(store)) } catch {} };
const blank = () => ({ story: 0, chars: [], cards: [], book: 0, read: 0, hearts: 0, clear: 0 });
const getRec = id => { const r = store[id] = Object.assign(blank(), store[id] || {}); if (!Array.isArray(r.chars)) r.chars = []; if (!Array.isArray(r.cards)) r.cards = []; return r };

/* ---------- small pieces ---------- */
function image(a, { type = 'screen', lazy = false, critical = false, alt = a.label } = {}) {
  return `<img src="${esc(a[type])}" width="${a.width}" height="${a.height}" alt="${esc(alt)}" ${lazy ? 'loading="lazy"' : 'loading="eager"'} decoding="async" ${critical ? 'data-critical fetchpriority="high"' : ''}>`;
}
const ratio = a => (a.width / a.height).toFixed(4);
function actions(w) {
  if (!w.read) return '<div class="detail-actions"><span class="reading-pending">閱讀連結即將公布</span></div>';
  return `<div class="detail-actions"><a href="${esc(w.read)}" data-read target="_blank" rel="noopener noreferrer">開始閱讀 ↗</a>${w.buy ? `<a href="${w.book ? '#books' : esc(w.buy)}" ${w.book ? '' : 'target="_blank" rel="noopener noreferrer"'}>收藏實體書 ${w.book ? '↓' : '↗'}</a>` : ''}</div>`;
}
function typeInto(el, text, speed, onDone) {
  let i = 0, timer = 0, ended = false;
  const end = () => { if (ended) return; ended = true; clearInterval(timer); el.textContent = text; el.classList.remove('is-typing'); onDone && onDone() };
  if (reduced.matches || !text) { end(); return { skip: end, get done() { return ended } } }
  el.textContent = ''; el.classList.add('is-typing');
  timer = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i >= text.length) end() }, speed);
  return { skip: end, get done() { return ended } };
}
async function pickTint(src) {
  try {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 20;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, 20, 20);
    const px = g.getImageData(0, 0, 20, 20).data; let r = 0, gr = 0, b = 0, wsum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]), sat = mx ? (mx - mn) / mx : 0, wt = sat * sat * (mx / 255) + .01;
      r += px[i] * wt; gr += px[i + 1] * wt; b += px[i + 2] * wt; wsum += wt;
    }
    r /= wsum; gr /= wsum; b /= wsum; const k = 235 / Math.max(r, gr, b, 1);
    return `${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(gr * k))},${Math.min(255, Math.round(b * k))}`;
  } catch { return null }
}

/* ---------- coming-soon gate ---------- */
function renderComingSoon(w) {
  root.innerHTML = `<section class="release-gate"><div class="eyebrow">INTRVL / NEXT STAGE · LOCKED</div><div class="gate-lock">${ICON.lock}</div><div class="release-date" aria-hidden="true">10<span>/</span>10</div><p class="release-kicker">新的故事，準備與你相遇。</p><h1>${esc(w.title)}</h1><p class="release-time"><time datetime="${esc(w.releaseAt)}">${esc(w.releaseLabel)}</time> 正式上線</p><div class="release-countdown" aria-label="距離上線"><span><b id="releaseDays">--</b>天</span><span><b id="releaseHours">--</b>時</span><span><b id="releaseMinutes">--</b>分</span><span><b id="releaseSeconds">--</b>秒</span></div><div class="detail-actions"><a href="/works/">先探索其他故事 ↗</a></div></section>`;
  const tick = () => {
    const remaining = Date.parse(w.releaseAt) - Date.now();
    if (remaining <= 0) { location.reload(); return }
    const s = Math.ceil(remaining / 1000);
    for (const [key, n] of Object.entries({ Days: Math.floor(s / 86400), Hours: Math.floor(s / 3600) % 24, Minutes: Math.floor(s / 60) % 60, Seconds: s % 60 })) $('#release' + key).textContent = pad2(n);
  };
  tick(); setInterval(tick, 1000);
}

/* ---------- lightbox ---------- */
const dialog = $('#artDialog'); let modalToken = 0, artOrder = [], artNow = '';
function closeArt() { modalToken++; dialog.close(); $('#artContainer').replaceChildren(); $('#artStatus').textContent = '' }
async function openArt(id) {
  const a = assetMap.get(id); if (!a) return;
  const token = ++modalToken; artNow = id;
  const at = artOrder.indexOf(id), count = $('#artCount');
  if (count) count.textContent = artOrder.length > 1 && at >= 0 ? `${at + 1} / ${artOrder.length}` : '';
  $$('#artPrev,#artNext').forEach(b => b.hidden = artOrder.length < 2);
  $('#artContainer').classList.toggle('comic-reader', a.role === 'comic'); $('#artTitle').textContent = a.label;
  $('#artStatus').textContent = `正在載入大圖 · ${kb(a.fullBytes)}`; $('#artContainer').replaceChildren();
  if (!dialog.open) dialog.showModal();
  const img = new Image(); img.alt = a.label; img.src = a.full;
  try { await img.decode(); if (token !== modalToken) return; $('#artContainer').replaceChildren(img); $('#artStatus').textContent = `${a.label} / 點擊「關閉」或按 Esc 返回` }
  catch { if (token === modalToken) $('#artStatus').textContent = '大圖暫時無法載入，請關閉後再試。' }
}
function stepArt(d) { if (artOrder.length < 2) return; const at = artOrder.indexOf(artNow); openArt(artOrder[(at + d + artOrder.length) % artOrder.length]) }
$('#closeArt').onclick = closeArt;
$('#artPrev')?.addEventListener('click', () => stepArt(-1)); $('#artNext')?.addEventListener('click', () => stepArt(1));
dialog.addEventListener('cancel', () => { modalToken++; $('#artContainer').replaceChildren() });
dialog.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') stepArt(-1); else if (e.key === 'ArrowRight') stepArt(1) });
dialog.addEventListener('click', e => { if (e.target === dialog) { const b = dialog.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) closeArt() } });
document.addEventListener('click', e => { const b = e.target.closest('[data-art]'); if (b) openArt(b.dataset.art) });

/* ---------- the stage ---------- */
function renderStory() {
  const w = data.works.find(x => x.id === document.body.dataset.story) || (!document.body.dataset.story ? data.works[0] : null);
  if (!w) { root.innerHTML = '<section class="error-state"><p class="eyebrow">STAGE NOT FOUND</p><h1>找不到這部作品</h1><a href="/works/">返回所有作品 ↗</a></section>'; return }
  const idx = data.works.indexOf(w), N = data.works.length, next = data.works[(idx + 1) % N], hero = w.hero, rec = getRec(w.id);
  root.dataset.work = w.id; document.title = `${w.title} — INTRVL Studio`;
  if (w.releaseAt && Date.now() < Date.parse(w.releaseAt)) { renderComingSoon(w); return }

  const stageNo = pad2(idx + 1), cards = [w.cover, ...w.gallery], beats = w.synopsis.match(/[^。]+。?/g).map(s => s.trim()).filter(Boolean);
  const steps = [['story', '故事'], ['characters', '角色'], ['visuals', '收藏'], ...(w.book ? [['books', '實體書']] : []), ['clear', '結算']];
  const chips = w.setting.split('/').map(s => s.trim()).filter(Boolean);
  const needsBook = !!w.book;

  /* --- markup --- */
  const figure = c => `<button class="character-trigger" data-character="${c.i}" aria-label="認識${esc(c.name)}" aria-controls="profile-${c.i}" aria-expanded="false">${image(c.art, { alt: '', lazy: false })}<span class="cs-plate"><b>P${c.i + 1}</b>${esc(c.name)}<i aria-hidden="true">＋</i></span></button>`;
  const csFigures = w.pair
    ? `<div class="cs-figure pair-figure">${image(w.pair, { alt: `${w.characters.map(c => c.name).join('與')}的去背全身立繪` })}<div class="pair-hotspots">${w.characters.map((c, i) => `<button class="character-trigger" data-character="${i}" aria-label="認識${esc(c.name)}" aria-controls="profile-${i}" aria-expanded="false"><span class="cs-plate"><b>P${i + 1}</b>${esc(c.name)}<i aria-hidden="true">＋</i></span></button>`).join('')}</div></div>`
    : `<div class="cs-figure cs-p1">${figure({ ...w.characters[0], i: 0 })}</div><div class="cs-figure cs-p2">${figure({ ...w.characters[1], i: 1 })}</div>`;
  const centerCol = `<div class="cs-center"><div class="cs-meter" aria-hidden="true"><span class="cs-dots">${w.characters.map(() => '<i></i>').join('')}</span><b data-cs-count>0 / ${w.characters.length}</b></div><div class="holo-zone" aria-live="polite"><div class="holo-hint"><span class="micro">CHARACTER SIGNAL / STANDBY</span><br>選一位角色，開始認識他。<br>點擊可固定面板，再點一次收起。</div>${w.characters.map((c, i) => `<article class="holo-panel" id="profile-${i}" hidden><span class="micro">PLAYER ${i + 1} / PROFILE — CONNECTED</span><h3>${esc(c.name)}</h3><ul class="tags">${(c.tags || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul><p>${esc(c.description)}</p></article>`).join('')}</div>${w.pairing ? `<p class="cs-pairing" data-pairing hidden><span class="micro">LINK ESTABLISHED</span><b>${esc(w.pairing)}</b></p>` : ''}</div>`;
  const card = (a, i) => `<li class="card" data-card="${esc(a.id)}" style="--arn:${ratio(a)}"><button type="button" class="card-btn" data-flip aria-label="翻開收藏卡 No.${pad2(i + 1)}"><span class="card-inner"><span class="card-back" aria-hidden="true">${ICON.mark}<small>No.${pad2(i + 1)}</small><em>TAP TO OPEN</em></span><span class="card-front"><span class="card-art" style="--bg:url('${esc(a.thumb)}')">${image(a, { lazy: true })}</span><span class="card-label"><small>No.${pad2(i + 1)}</small><span>${esc(a.label)}</span><b aria-hidden="true">放大 ↗</b></span></span></span></button></li>`;
  const bookHTML = w.book ? `<section class="book-section stage" id="books" data-stage="books" aria-labelledby="bookTitle"><div class="book-header reveal"><span class="eyebrow">MISSION 04 / ITEM DROP</span><span class="micro">INTRVL × KADOKAWA</span></div><div class="book-layout reveal"><div class="book-viewer"><div class="book-3d" data-book tabindex="0" role="group" aria-label="${esc(w.title)}實體書：拖曳或用方向鍵轉動"><span class="book-orbit" aria-hidden="true"></span><span class="book-cross cross-one" aria-hidden="true">＋</span><span class="book-cross cross-two" aria-hidden="true">＋</span><div class="book-float"><div class="book-tilt">${image(w.book.art, { lazy: true, alt: w.title + '・' + w.book.caption })}<span class="book-glare" style="--m:url('${esc(w.book.art.screen)}')" aria-hidden="true"></span></div></div><span class="book-get" aria-hidden="true">ITEM GET!</span></div><p class="book-caption micro">${esc(w.book.caption)} / PRINT EDITION · 拖曳轉動</p></div><div class="book-copy"><p class="book-edition">${esc(w.book.publisher)}出版 <span>／ ${esc(w.book.edition)}</span></p><h2 id="bookTitle">故事，<br>也能握在手裡。</h2><p class="book-subtitle">${esc(w.book.copy)}</p><p class="book-name">${esc(w.title)}</p><a class="book-buy" href="${esc(w.buy)}" data-book-buy target="_blank" rel="noopener noreferrer"><span><small>TAIWAN KADOKAWA</small><strong>前往角川購買</strong></span><span class="buy-arrow" aria-hidden="true">↗</span></a><p class="book-fineprint">${w.id === 'roommate' ? '前往系列頁選擇集數。' : ''}版本與供貨以角川官網為準。</p></div></div></section>` : '';
  const tally = [['story', '故事'], ['chars', '角色'], ['cards', '收藏'], ...(needsBook ? [['book', '實體書']] : []), ...(w.read ? [['read', '前往閱讀']] : [])];

  root.innerHTML = `
<section class="detail-hero stage" id="top" data-stage="top" aria-labelledby="workTitle">
  <div class="hero-bg" style="--bg:url('${esc(hero.thumb)}')" aria-hidden="true"></div>
  <svg class="hero-vectors" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true"><path d="M920 0H1440V900H1210L710 0" fill="#ff91420a"/><path d="M940 0L1440 780M680 0L1220 900M0 820H1440" fill="none" stroke="#ff91424a"/><path d="M1360 120h-72v72M80 670v72h72" fill="none" stroke="#ff9142" stroke-width="3"/><circle cx="1290" cy="460" r="255" fill="none" stroke="#ff914229"/></svg>
  <div class="hero-copy">
    <div class="eyebrow">INTRVL / STAGE ${stageNo} · ${esc(w.year)}</div>
    <div class="hero-index" aria-hidden="true">${stageNo}</div>
    <h1 id="workTitle">${esc(w.title)}</h1>
    <ul class="chips" aria-label="作品設定">${chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    <div class="hero-start"><button type="button" class="press-start" data-start><span>PRESS START</span><i aria-hidden="true">▶</i></button>${w.read ? `<a class="hero-read" href="${esc(w.read)}" data-read target="_blank" rel="noopener noreferrer">直接閱讀 ↗</a>` : '<span class="reading-pending">閱讀連結即將公布</span>'}</div>
    <p class="hero-hint micro">按 Enter 開始 · 點擊作品畫面，送出心動</p>
  </div>
  <figure class="hero-art" style="--arn:${ratio(hero)}">
    <div class="hero-art-in">${image(hero, { critical: true, alt: w.title + '主視覺' })}<span class="hero-scan" aria-hidden="true"></span><span class="hero-glare" aria-hidden="true"></span></div>
    <i class="br tl" aria-hidden="true"></i><i class="br tr" aria-hidden="true"></i><i class="br bl" aria-hidden="true"></i><i class="br bb" aria-hidden="true"></i>
    <figcaption>STAGE ${stageNo} / ${pad2(N)}</figcaption>
    <button type="button" class="art-heart" data-heart aria-label="送出心動（累積心動值）">${ICON.heart}<b>TAP</b></button>
  </figure>
  <div class="hero-caption micro"><span>BETWEEN YOU &amp; THE STORY</span><a href="#story">SCROLL TO EXPLORE ↓</a></div>
</section>

<section class="story-stage stage" id="story" data-stage="story" aria-labelledby="storyTitle">
  <div class="stage-bg" style="--bg:url('${esc(w.cover.thumb)}')" aria-hidden="true"></div>
  <header class="stage-head reveal"><div><div class="eyebrow">MISSION 01 / THE STORY</div><h2 id="storyTitle" class="section-title">一切，<br>從相遇開始。</h2></div><p class="stage-hint">點擊對話框，或按「NEXT」，<br>把故事讀下去。</p></header>
  <div class="vn reveal">
    <figure class="vn-art" style="--arn:${ratio(w.cover)}">${image(w.cover, { lazy: true, alt: w.title + ' 正式封面' })}<figcaption class="micro">FILE ${stageNo} · 正式封面</figcaption></figure>
    <div class="vn-box" data-vn>
      <div class="vn-tag micro"><b>STORY</b><span data-vn-count>— / ${beats.length}</span></div>
      <p class="vn-text" data-vn-text aria-hidden="true"></p>
      <p class="gh-sr">${esc(w.synopsis)}</p>
      <div class="vn-foot"><div class="vn-dots" aria-hidden="true">${beats.map(() => '<i></i>').join('')}</div><div class="vn-btns"><button type="button" class="ghost" data-vn-skip>全部顯示</button><button type="button" class="solid" data-vn-next>NEXT <i aria-hidden="true">▶</i></button></div></div>
    </div>
  </div>
  <small class="stage-note">${esc(w.title)} / ${esc(w.setting)}</small>
</section>

<section class="chars-stage stage detail-section characters-section" id="characters" data-stage="characters" aria-labelledby="charsTitle">
  <header class="stage-head reveal"><div><div class="eyebrow">MISSION 02 / CHARACTER SELECT</div><h2 id="charsTitle" class="section-title">靠近一點，<br>認識他們。</h2></div><p class="stage-hint">移到角色身上，或輕點立繪，<br>打開屬於他的故事。<br><span class="micro">← → 切換角色</span></p></header>
  <div class="cs ${w.pair ? 'cs-pair' : ''} reveal" data-cs>${w.pair ? csFigures + centerCol : csFigures.replace('<div class="cs-figure cs-p2">', centerCol + '<div class="cs-figure cs-p2">')}</div>
</section>

<section class="coll-stage stage detail-section gallery-section" id="visuals" data-stage="visuals" aria-labelledby="visualsTitle">
  <header class="stage-head reveal"><div><div class="eyebrow">MISSION 03 / COLLECTION</div><h2 id="visualsTitle" class="section-title">故事以外的瞬間。</h2></div><div class="coll-side"><p class="stage-hint">翻開卡片，收集畫面。<br>翻開後再點一次可放大。</p><div class="coll-bar"><b data-coll-count>0 / ${cards.length}</b><button type="button" data-flip-all>全部翻開</button></div></div></header>
  <ul class="cards reveal" aria-label="收藏卡">${cards.map(card).join('')}</ul>
</section>

${bookHTML}

<section class="read-section stage reveal" id="clear" data-stage="clear" aria-labelledby="clearTitle">
  <div class="clear-bg" aria-hidden="true"></div>
  <div class="clear-head"><div class="eyebrow">RESULT / STAGE ${stageNo}</div><h2 id="clearTitle" class="clear-title" data-clear-title>STAGE ${stageNo}</h2><p class="clear-sub" data-clear-sub>完成所有任務，就能通關這一關。</p></div>
  <div class="clear-grid">
    <div class="tally" aria-label="本關成績">
      <ul>${tally.map(([k, t]) => `<li data-tally="${k}"><span>${t}</span><b>—</b></li>`).join('')}<li data-tally="hearts"><span>心動值</span><b>0</b></li></ul>
      <div class="tally-exp"><div class="exp-bar"><i data-clear-bar></i></div><b data-clear-pct>0%</b></div>
      <div class="rank" aria-label="評價"><small>RANK</small><b data-rank>D</b></div>
    </div>
    <div class="clear-cta"><p class="clear-line">下一幕，等你翻開。</p><p>閱讀《${esc(w.title)}》，把故事繼續下去。</p>${actions(w)}</div>
  </div>
  <div class="world"><div class="world-head micro"><span>ALL STAGES</span><b data-world-count>0 / ${N} CLEARED</b></div><ol class="world-list">${data.works.map((x, i) => `<li><a class="world-item${x.id === w.id ? ' is-current' : ''}" href="/works/${x.id}/" data-world="${x.id}" aria-label="第 ${i + 1} 關：${esc(x.title)}"><span class="world-img"><img src="${esc(x.cover.thumb)}" width="${x.cover.width}" height="${x.cover.height}" alt="" loading="lazy" decoding="async"></span><span class="world-no">${pad2(i + 1)}</span><i class="world-ok" aria-hidden="true">${ICON.check}</i></a></li>`).join('')}</ol></div>
</section>

<a class="next-work" href="/works/${next.id}/"><div><small>NEXT STAGE / 下一關</small>${esc(next.title)}</div><img src="${esc(next.cover.thumb)}" width="${next.cover.width}" height="${next.cover.height}" alt="" loading="lazy" decoding="async"><span aria-hidden="true">↗</span></a>`;

  /* --- HUD, quest log, toasts --- */
  const hud = document.createElement('nav');
  hud.className = 'qhud'; hud.dataset.cur = 'top'; hud.setAttribute('aria-label', '作品關卡與任務');
  hud.innerHTML = `<a class="qhud-logo" href="/" aria-label="INTRVL 首頁"><img src="/assets/brand-2026/wordmark-en-black.svg" width="136" height="30" alt="INTRVL"></a>
    <div class="qhud-steps" role="group" aria-label="關卡進度"><ol>${steps.map(([id, t], i) => `<li><a href="#${id}" data-step="${id}"><i>${pad2(i + 1)}</i><span>${t}</span></a></li>`).join('')}</ol></div>
    <span class="qhud-cur" aria-hidden="true" data-cur-label>START</span>
    <div class="qhud-stat"><button type="button" class="qhud-quest" aria-expanded="false" aria-controls="questPanel"><span class="qhud-exp" aria-hidden="true"><i data-exp-bar></i></span><b data-exp-pct>0%</b><span class="qhud-ql">任務</span></button><span class="qhud-hearts" role="img" aria-label="心動值">${ICON.heart}<b data-hearts>0</b></span><a class="qhud-all" href="/works/">所有作品 ↗</a></div>`;
  const panel = document.createElement('div');
  panel.className = 'quest-panel'; panel.id = 'questPanel'; panel.hidden = true;
  panel.innerHTML = `<div class="quest-head"><span class="micro">QUEST LOG / STAGE ${stageNo}</span><button type="button" class="quest-close" aria-label="關閉任務清單">×</button></div><ul class="quest-list"></ul><div class="quest-foot"><small>進度只記錄在這個瀏覽器。</small><button type="button" data-reset>重新開始</button></div>`;
  const toasts = document.createElement('div'); toasts.className = 'toasts'; toasts.setAttribute('role', 'status'); toasts.setAttribute('aria-live', 'polite');
  const fx = document.createElement('div'); fx.className = 'fx'; fx.setAttribute('aria-hidden', 'true');
  const banner = document.createElement('div'); banner.className = 'clear-banner'; banner.hidden = true;
  banner.setAttribute('role', 'status');
  banner.innerHTML = `<div><small>STAGE ${stageNo} · RANK S</small><b>STAGE CLEAR</b></div><a href="#clear">查看結算 ↓</a>`;
  page.append(hud, panel, toasts, fx, banner); page.classList.add('has-hud');

  /* --- quest bookkeeping --- */
  const defs = [
    { id: 'story', label: '讀完故事', weight: 20, total: 1, got: () => rec.story ? 1 : 0 },
    { id: 'chars', label: '認識所有角色', weight: 25, total: w.characters.length, got: () => rec.chars.length },
    { id: 'cards', label: '翻開所有收藏卡', weight: 30, total: cards.length, got: () => rec.cards.length },
    ...(needsBook ? [{ id: 'book', label: '翻看實體書', weight: 15, total: 1, got: () => rec.book ? 1 : 0 }] : []),
    ...(w.read ? [{ id: 'read', label: '前往閱讀', weight: 10, total: 1, got: () => rec.read ? 1 : 0 }] : [])
  ];
  const wsum = defs.reduce((s, d) => s + d.weight, 0), isDone = d => d.got() >= d.total;
  const percent = () => Math.round(defs.reduce((s, d) => s + d.weight * Math.min(1, d.got() / d.total), 0) / wsum * 100);
  const announced = new Set(defs.filter(isDone).map(d => d.id));
  const rankOf = p => p >= 100 ? 'S' : p >= 75 ? 'A' : p >= 50 ? 'B' : p >= 25 ? 'C' : 'D';
  const stepDone = { story: () => !!rec.story, characters: () => rec.chars.length >= w.characters.length, visuals: () => rec.cards.length >= cards.length, books: () => !!rec.book, clear: () => !!rec.clear };

  const toast = (kind, title, sub) => {
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = `<b>${esc(kind)}</b><span>${esc(title)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    toasts.append(el); while (toasts.children.length > 2) toasts.firstElementChild.remove();
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 400) }, 3000);
  };
  const burst = (x, y, n = 1) => {
    if (reduced.matches) return;
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span'); h.className = 'heart'; h.innerHTML = ICON.heart;
      h.style.setProperty('--x', `${x + (Math.random() - .5) * 46}px`); h.style.setProperty('--y', `${y}px`); h.style.setProperty('--dx', `${(Math.random() - .5) * 90}px`); h.style.setProperty('--s', (.7 + Math.random() * .7).toFixed(2));
      fx.append(h); setTimeout(() => h.remove(), 1300);
    }
  };
  let saveTimer = 0;
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveStore, 250) };
  function paint() {
    const p = percent(), clearedNow = !!rec.clear;
    $('[data-hearts]', hud).textContent = rec.hearts; $('[data-exp-pct]', hud).textContent = `${p}%`; $('[data-exp-bar]', hud).style.transform = `scaleX(${p / 100})`;
    hud.classList.toggle('is-clear', clearedNow);
    $$('[data-step]', hud).forEach(a => { const f = stepDone[a.dataset.step]; a.classList.toggle('done', !!f && f()) });
    $('.quest-list', panel).innerHTML = defs.map(d => { const g = Math.min(d.got(), d.total); return `<li class="${isDone(d) ? 'done' : ''}"><i>${isDone(d) ? ICON.check : ''}</i><span>${d.label}</span><b>${d.total > 1 ? `${g}/${d.total}` : (isDone(d) ? '完成' : '未完成')}</b></li>` }).join('');
    $('[data-cs-count]')?.replaceChildren(`${rec.chars.length} / ${w.characters.length}`);
    $$('.cs-dots i').forEach((d, i) => d.classList.toggle('on', rec.chars.includes(i)));
    $('[data-coll-count]').textContent = `${rec.cards.length} / ${cards.length}`;
    const T = k => $(`[data-tally="${k}"] b`);
    T('story') && (T('story').textContent = rec.story ? '✓ 讀完' : '未讀完'); T('chars') && (T('chars').textContent = `${rec.chars.length} / ${w.characters.length}`);
    T('cards') && (T('cards').textContent = `${rec.cards.length} / ${cards.length}`); T('book') && (T('book').textContent = rec.book ? '✓ 已翻看' : '未翻看');
    T('read') && (T('read').textContent = rec.read ? '✓ 已前往' : '未前往'); T('hearts') && (T('hearts').textContent = rec.hearts);
    $('[data-clear-pct]').textContent = `${p}%`; $('[data-clear-bar]').style.transform = `scaleX(${p / 100})`; $('[data-rank]').textContent = rankOf(p);
    root.classList.toggle('is-cleared', clearedNow);
    $('[data-clear-title]').textContent = clearedNow ? 'STAGE CLEAR' : `STAGE ${stageNo}`;
    $('[data-clear-sub]').textContent = clearedNow ? '全部任務完成。這一關，你通關了。' : '完成所有任務，就能通關這一關。';
    const cleared = data.works.filter(x => x.id === w.id ? clearedNow : (store[x.id] && store[x.id].clear)).length;
    $('[data-world-count]').textContent = `${cleared} / ${N} CLEARED`;
    $$('[data-world]').forEach(a => a.classList.toggle('is-cleared', a.dataset.world === w.id ? clearedNow : !!(store[a.dataset.world] && store[a.dataset.world].clear)));
    persist();
  }
  const addHearts = (n, x, y) => {
    rec.hearts += n; if (x != null) burst(x, y, Math.min(n, 3));
    $('[data-hearts]', hud).textContent = rec.hearts; const t = $('[data-tally="hearts"] b'); if (t) t.textContent = rec.hearts; persist();
  };
  function bump(id) {
    const d = defs.find(q => q.id === id); paint();
    if (d && isDone(d) && !announced.has(id)) {
      announced.add(id); rec.hearts += 10; toast('QUEST COMPLETE', d.label, `+10 心動值 · 進度 ${percent()}%`); paint();
      if (defs.every(isDone) && !rec.clear) stageClear();
    }
  }
  function stageClear() {
    rec.clear = 1; paint(); saveStore();
    banner.hidden = false; banner.classList.remove('is-out'); void banner.offsetWidth; banner.classList.add('is-in');
    setTimeout(() => { banner.classList.add('is-out'); setTimeout(() => { banner.hidden = true; banner.classList.remove('is-in') }, 600) }, 5200);
    if (!reduced.matches) for (let i = 0; i < 14; i++) setTimeout(() => burst(innerWidth * (.15 + Math.random() * .7), innerHeight * (.45 + Math.random() * .3), 1), i * 90);
  }
  banner.querySelector('a').addEventListener('click', () => { banner.hidden = true });

  /* quest panel */
  const qBtn = $('.qhud-quest', hud);
  const setPanel = open => { panel.hidden = !open; qBtn.setAttribute('aria-expanded', String(open)); if (open) $('.quest-close', panel).focus({ preventScroll: true }) };
  qBtn.addEventListener('click', () => setPanel(panel.hidden));
  $('.quest-close', panel).addEventListener('click', () => { setPanel(false); qBtn.focus({ preventScroll: true }) });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden && !dialog.open) { setPanel(false); qBtn.focus({ preventScroll: true }) } });
  document.addEventListener('pointerdown', e => { if (!panel.hidden && !e.target.closest('.quest-panel,.qhud-quest')) setPanel(false) });
  $('[data-reset]', panel).addEventListener('click', () => { if (confirm('要清除這部作品的任務進度嗎？')) { delete store[w.id]; saveStore(); location.reload() } });

  /* --- hero --- */
  const hero$ = $('.detail-hero');
  const goStory = () => $('#story').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
  $('[data-start]').addEventListener('click', goStory);
  if (fine.matches && !reduced.matches) {
    let raf = 0;
    hero$.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = hero$.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width - .5, -.5, .5) * 2, y = clamp((e.clientY - r.top) / r.height - .5, -.5, .5) * 2;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { hero$.style.setProperty('--px', x.toFixed(3)); hero$.style.setProperty('--py', y.toFixed(3)); hero$.style.setProperty('--gx', `${50 + x * 40}%`); hero$.style.setProperty('--gy', `${50 + y * 40}%`) });
    });
    hero$.addEventListener('pointerleave', () => { hero$.style.setProperty('--px', 0); hero$.style.setProperty('--py', 0) });
  }
  $('.hero-art').addEventListener('click', e => {
    const b = $('.art-heart'), r = b.getBoundingClientRect(), x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
    addHearts(1, x, y); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.target !== document.body || dialog.open || !panel.hidden) return;
    const r = hero$.getBoundingClientRect(); if (r.bottom > innerHeight * .5 && r.top < innerHeight * .5) goStory();
  });

  /* --- story (visual novel) --- */
  const vnText = $('[data-vn-text]'), vnNext = $('[data-vn-next]'), vnSkip = $('[data-vn-skip]'), vnCount = $('[data-vn-count]'), vnDots = $$('.vn-dots i');
  let beat = -1, typer = null, vnStarted = false;
  const lastBeat = beats.length - 1;
  function vnPaint() {
    const complete = !!rec.story && (beat === lastBeat && (!typer || typer.done) || beat === -2);
    vnNext.innerHTML = complete ? '認識角色 <i aria-hidden="true">↓</i>' : 'NEXT <i aria-hidden="true">▶</i>';
    vnSkip.textContent = complete ? '重看一次' : '全部顯示'; vnSkip.dataset.mode = complete ? 'replay' : 'skip';
    vnDots.forEach((d, i) => d.classList.toggle('on', beat === -2 || i <= beat));
    vnCount.textContent = beat === -2 ? `全部 / ${beats.length}` : `${Math.max(beat, 0) + 1} / ${beats.length}`;
  }
  function finishStory() { if (!rec.story) { rec.story = 1; addHearts(5); bump('story') } vnPaint() }
  function showBeat(n) {
    typer && typer.skip(); beat = n; vnText.classList.remove('is-all');
    typer = typeInto(vnText, beats[n], 34, () => { if (n === lastBeat) finishStory(); else vnPaint() }); vnPaint();
  }
  function showAll() { typer && typer.skip(); beat = -2; vnText.classList.add('is-all'); typer = null; vnText.textContent = beats.join(''); finishStory() }
  function vnAdvance() {
    if (typer && !typer.done) { typer.skip(); return }
    if (beat === -2 || (beat === lastBeat && rec.story)) { $('#characters').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' }); return }
    if (beat < lastBeat) showBeat(beat + 1);
  }
  vnNext.addEventListener('click', vnAdvance);
  vnSkip.addEventListener('click', () => { if (vnSkip.dataset.mode === 'replay') { showBeat(0) } else showAll() });
  $('[data-vn]').addEventListener('click', e => { if (!e.target.closest('button')) vnAdvance() });
  const startVN = () => { if (vnStarted) return; vnStarted = true; if (rec.story) showAll(); else showBeat(0) };

  /* --- character select --- */
  const cs = $('[data-cs]'), trig = $$('[data-character]'), panels = $$('.holo-panel'), hint = $('.holo-hint');
  let pinned = null, hovered = null, dwell = 0;
  const shown = () => hovered ?? pinned;
  function csPaint() {
    const i = shown(); cs.dataset.sel = i == null ? '' : String(i);
    trig.forEach((b, j) => { b.setAttribute('aria-expanded', String(i === j)); b.classList.toggle('is-sel', i === j); b.classList.toggle('is-dim', i != null && i !== j) });
    panels.forEach((p, j) => { p.hidden = i !== j }); hint.hidden = i != null;
  }
  function markChar(i, x, y) {
    if (rec.chars.includes(i)) return;
    rec.chars.push(i); addHearts(5, x, y); bump('chars');
    if (rec.chars.length >= w.characters.length) linkUp(true);
  }
  function linkUp(announce) {
    cs.classList.add('is-linked'); const p = $('[data-pairing]'); if (p) p.hidden = false;
    if (announce) toast('LINK ESTABLISHED', '兩人的關係線接上了', w.pairing || '');
  }
  if (rec.chars.length >= w.characters.length) linkUp(false);
  trig.forEach((b, i) => {
    b.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; hovered = i; csPaint(); clearTimeout(dwell); dwell = setTimeout(() => markChar(i), 500) });
    b.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; hovered = null; clearTimeout(dwell); csPaint() });
    b.addEventListener('focus', () => { if (!b.matches(':focus-visible')) return; hovered = i; csPaint(); clearTimeout(dwell); dwell = setTimeout(() => markChar(i), 600) });
    b.addEventListener('blur', () => { if (hovered === i && !b.matches(':hover')) { hovered = null; clearTimeout(dwell); csPaint() } });
    b.addEventListener('click', e => {
      pinned = pinned === i ? null : i; if (e.detail === 0) hovered = null; csPaint();
      if (pinned !== i) return;
      markChar(i, e.clientX || undefined, e.clientY || undefined);
      if (matchMedia('(max-width:1000px)').matches) requestAnimationFrame(() => {
        const r = panels[i].getBoundingClientRect(), tab = ($('.as-tabs') || {}).offsetHeight || 0;
        if (r.bottom > innerHeight - tab - 8 || r.top < hud.offsetHeight + 60) panels[i].scrollIntoView({ block: 'center', behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });
    b.addEventListener('keydown', e => {
      if (e.key === 'Escape') { pinned = null; hovered = null; csPaint(); return }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + trig.length) % trig.length;
        trig[n].focus({ preventScroll: true }); clearTimeout(dwell); pinned = n; hovered = null; csPaint(); markChar(n);
      }
    });
  });

  /* --- collection --- */
  const cardEls = $$('.card');
  const syncOrder = () => { artOrder = cards.filter(a => rec.cards.includes(a.id)).map(a => a.id) };
  function openCard(el) {
    const id = el.dataset.card, btn = $('.card-btn', el);
    if (el.classList.contains('is-open')) return;
    el.classList.add('is-open'); btn.removeAttribute('data-flip'); btn.dataset.art = id; btn.setAttribute('aria-label', `放大：${assetMap.get(id).label}`);
    if (!rec.cards.includes(id)) { rec.cards.push(id); const r = el.getBoundingClientRect(); addHearts(3, r.left + r.width / 2, r.top + r.height / 2); bump('cards') }
    syncOrder();
  }
  cardEls.forEach(el => {
    if (rec.cards.includes(el.dataset.card)) openCard(el)
    const btn = $('.card-btn', el);
    btn.addEventListener('click', e => { if (!el.classList.contains('is-open')) { e.stopPropagation(); openCard(el) } });
    if (fine.matches && !reduced.matches) {
      btn.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || !el.classList.contains('is-open')) return;
        const r = btn.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        btn.style.setProperty('--ry', `${((x - .5) * 14).toFixed(2)}deg`); btn.style.setProperty('--rx', `${((.5 - y) * 14).toFixed(2)}deg`); btn.style.setProperty('--gx', `${x * 100}%`); btn.style.setProperty('--gy', `${y * 100}%`);
      });
      btn.addEventListener('pointerleave', () => { btn.style.setProperty('--ry', '0deg'); btn.style.setProperty('--rx', '0deg') });
    }
  });
  syncOrder();
  $('[data-flip-all]').addEventListener('click', () => { cardEls.filter(el => !el.classList.contains('is-open')).forEach((el, i) => setTimeout(() => openCard(el), reduced.matches ? 0 : i * 140)) });

  /* --- print edition --- */
  const book = $('[data-book]');
  if (book) {
    const tilt = $('.book-tilt', book); let dragging = false, moved = 0, last = null;
    const set = (ry, rx, gx, gy) => { tilt.style.setProperty('--bry', `${ry}deg`); tilt.style.setProperty('--brx', `${rx}deg`); tilt.style.setProperty('--bgx', `${gx}%`); tilt.style.setProperty('--bgy', `${gy}%`) };
    const touched = () => { if (!rec.book) { rec.book = 1; addHearts(5); book.classList.add('got'); toast('ITEM GET', '拿到了實體書', w.book.caption); bump('book') } };
    const aim = e => { if (reduced.matches) return; const r = book.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp((e.clientY - r.top) / r.height, 0, 1); set(((x - .5) * 52).toFixed(1), ((.5 - y) * 30).toFixed(1), (x * 100).toFixed(0), (y * 100).toFixed(0)) };
    book.addEventListener('pointerdown', e => { dragging = true; moved = 0; last = [e.clientX, e.clientY]; try { book.setPointerCapture(e.pointerId) } catch {} book.classList.add('is-drag'); aim(e) });
    book.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' && !dragging) return;
      if (last) moved += Math.abs(e.clientX - last[0]) + Math.abs(e.clientY - last[1]);
      last = [e.clientX, e.clientY]; aim(e); if (moved > 80) touched();
    });
    const rest = () => { dragging = false; book.classList.remove('is-drag'); set(0, 0, 50, 50) };
    book.addEventListener('pointerup', () => { if (moved < 6) touched(); rest() }); book.addEventListener('pointercancel', rest);
    book.addEventListener('pointerleave', () => { if (!dragging) { set(0, 0, 50, 50); last = null } });
    book.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, 14], ArrowDown: [0, -14] }[e.key]; if (!k) return;
      e.preventDefault(); set(k[0], k[1], 50 + k[0], 50 - k[1]); touched(); clearTimeout(book._t); book._t = setTimeout(() => set(0, 0, 50, 50), 900);
    });
    if (rec.book) book.classList.add('got');
    $('[data-book-buy]').addEventListener('click', touched);
  }

  /* --- read links --- */
  document.addEventListener('click', e => { const a = e.target.closest('[data-read]'); if (a && !rec.read) { rec.read = 1; bump('read') } });

  /* --- stage tracking (HUD) --- */
  const secs = $$('[data-stage]'), labels = { top: 'START', ...Object.fromEntries(steps) };
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) { seen.delete(en.target); } else seen.add(en.target);
      const cur = secs.find(s => seen.has(s)) ? secs.filter(s => seen.has(s)).pop() : null; if (!cur) return;
      const id = cur.dataset.stage; hud.dataset.cur = id; $('[data-cur-label]', hud).textContent = labels[id] || '';
      $$('[data-step]', hud).forEach(a => { if (a.dataset.step === id) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current') });
      if (id === 'story') startVN();
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => io.observe(s));
    const lateStart = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { startVN(); lateStart.disconnect() } }), { threshold: .35 }); lateStart.observe($('#story'));
  } else startVN();

  /* --- secret code --- */
  const code = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']; let ci = 0;
  document.addEventListener('keydown', e => {
    if (e.target.matches && e.target.matches('input,textarea')) return;
    ci = e.key.toLowerCase() === code[ci] ? ci + 1 : (e.key.toLowerCase() === code[0] ? 1 : 0);
    if (ci === code.length) { ci = 0; addHearts(30, innerWidth / 2, innerHeight * .6); toast('SECRET CODE', '祕技發動', '+30 心動值'); }
  });

  paint();
  if (rec.clear) hud.classList.add('is-clear');
  pickTint(hero.thumb).then(c => { if (c) root.style.setProperty('--tint', c) });
  if (location.hash.length > 1) { try { pendingHash = document.getElementById(decodeURIComponent(location.hash.slice(1))) } catch {} }
}

/* ---------- page-level motion ---------- */
function motion() {
  const targets = $$('.reveal');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target) } }), { threshold: .1 });
    targets.forEach(e => io.observe(e));
  }
  let scheduled = false;
  const paint = () => { scheduled = false; if (!reduced.matches) document.documentElement.style.setProperty('--hero-y', `${Math.min(scrollY * .06, 48)}px`) };
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(paint) } }, { passive: true }); paint();
}

async function init() {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('/assets/stories.json', { signal: controller.signal });
    if (!response.ok) throw Error('data');
    data = await response.json(); data.works.flatMap(allAssets).forEach(a => assetMap.set(a.id, a));
    renderStory(); rendered = true; motion(); await waitAssets();
    if (failed) { const warning = document.createElement('p'); warning.className = 'preview-banner'; warning.textContent = '部分圖片未能載入，請檢查連線後重新整理。'; root.prepend(warning) }
  } catch {
    failed++; root.innerHTML = '<section class="error-state"><p class="eyebrow">CONNECTION INTERRUPTED</p><h1>暫時無法載入作品</h1><p>請檢查連線，然後再試一次。</p><a href="' + esc(location.href) + '">重新載入 ↗</a>　<a href="/works/">所有作品 ↗</a></section>'; rendered = true; ready = true;
  } finally { clearTimeout(timeout) }
}
init();
})();
