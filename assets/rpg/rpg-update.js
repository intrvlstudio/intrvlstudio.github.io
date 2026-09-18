/* UI and loading enhancements for the 2026 RPG brief. Story state remains in the game. */
(() => {
  const $ = selector => document.querySelector(selector);
  const hud = $('#gameScreen .hud');
  for (const id of ['episodeCount', 'castBook', 'fullscreen', 'sfx', 'music', 'gameHelp', 'home', 'hudMenuToggle']) hud.append($('#' + id));
  // Keep the progress node for the original game state; CSS hides its HUD label.
  $('#exitGame')?.remove();
  $('#gameHelp').textContent = 'i';
  $('#castBook').textContent = '▤';
  $('#sfx').textContent = '♪';
  $('#home').setAttribute('aria-label', '儲存進度並回到官網首頁');
  $('#home').onclick = () => { location.href = 'index.html'; };
  const actorLayer = document.createElement('canvas');
  actorLayer.id = 'actorLayer';
  actorLayer.width = 1280;
  actorLayer.height = 768;
  actorLayer.setAttribute('aria-hidden', 'true');
  $('#portalMarkers').after(actorLayer);

  const loader = document.createElement('dialog');
  loader.id = 'gameLoader';
  loader.setAttribute('aria-label', '載入遊戲');
  loader.innerHTML = `<div class="loader-inner"><svg viewBox="0 0 160 170" shape-rendering="crispEdges" role="img" aria-label="空心貓咪逐漸裝滿粉紅色果汁"><defs><clipPath id="catClip"><path d="M20 82V27L48 8l24 23h17l24-23 27 19v55c0 45-23 73-60 73S20 127 20 82Z"/></clipPath></defs><rect class="loader-fill" x="19" y="7" width="122" height="149" fill="#f596be" clip-path="url(#catClip)"/><path d="M20 82V27L48 8l24 23h17l24-23 27 19v55c0 45-23 73-60 73S20 127 20 82Z" fill="none" stroke="#fff7ec" stroke-width="9" stroke-linejoin="miter"/></svg><span class="loader-copy" aria-live="polite">準備冒險素材…</span><progress max="100" value="0" aria-label="遊戲載入進度"></progress></div>`;
  document.body.append(loader);
  loader.addEventListener('cancel', event => event.preventDefault());
  const loadImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = () => reject(new Error('無法載入 ' + src));
    image.src = src;
  });
  let loading = false;
  async function preloadThen(begin, reset = false) {
    if (loading) return;
    loading = true;
    loader.dataset.ready = 'false';
    loader.style.setProperty('--fill', '0');
    const progress = loader.querySelector('progress');
    progress.value = 0;
    loader.querySelector('.loader-copy').textContent = '準備冒險素材…';
    loader.showModal();
    const music = $('#backgroundMusic');
    if ($('#music').getAttribute('aria-pressed') === 'true') {
      music.preload = 'auto';
      music.play().catch(() => {});
    }
    const saved = (() => { try { return JSON.parse(localStorage.getItem('bmp-rpg-save-v3')); } catch { return null; } })();
    const scene = reset ? 'studio' : saved?.scene || 'studio';
    const essentials = [
      DATA.art.maps[scene === 'poolHall' ? 'campus' : scene],
      DATA.art.sheets.思于,
      DATA.art.sheets[scene === 'studio' && saved?.f?.misunderstanding ? '凱翔' : '曉彤'],
      DATA.art.portraits.思于.neutral,
      DATA.art.assets.title
    ];
    try {
      let done = 0;
      await Promise.all([
        ...essentials.map(src => loadImage(src).then(() => {
          progress.value = Math.round(++done / (essentials.length + 1) * 100);
          loader.style.setProperty('--fill', String(progress.value / 100));
        })),
        document.fonts.load('16px PixelRPG').then(() => {
          progress.value = Math.round(++done / (essentials.length + 1) * 100);
          loader.style.setProperty('--fill', String(progress.value / 100));
        })
      ]);
      progress.value = 100;
      loader.style.setProperty('--fill', '1');
      loader.dataset.ready = 'true';
      loader.querySelector('.loader-copy').textContent = '一起開始冒險';
      await new Promise(resolve => setTimeout(resolve, 430));
      loader.close();
      begin();
      // Later scenes fetch quietly after the first map is interactive.
      setTimeout(() => {
        for (const src of Object.values(DATA.art.maps)) loadImage(src).catch(() => {});
        for (const src of Object.values(DATA.art.sheets)) loadImage(src).catch(() => {});
      }, 700);
    } catch (error) {
      loader.querySelector('.loader-copy').textContent = '素材載入失敗，請重試';
      await new Promise(resolve => setTimeout(resolve, 1000));
      loader.close();
    } finally { loading = false; }
  }
  for (const id of ['start', 'continue', 'confirmStart', 'newGame']) {
    const button = $('#' + id);
    const old = button.onclick;
    button.onclick = event => {
      // New game confirmation comes before loading, not after it.
      if ((id === 'start' || id === 'newGame') && !$('#continue').hidden) return old.call(button, event);
      preloadThen(() => old.call(button, event), id !== 'continue');
    };
  }

  // Desktop glove cursor uses the supplied art; pressing compresses the finger.
  const cursor = document.createElement('div');
  cursor.className = 'rpg-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  document.addEventListener('pointermove', event => {
    cursor.style.setProperty('--cursor-x', `${event.clientX - 8}px`);
    cursor.style.setProperty('--cursor-y', `${event.clientY - 3}px`);
  }, { passive: true });
  document.addEventListener('pointerdown', () => cursor.style.setProperty('--press', '.78'));
  document.addEventListener('pointerup', () => cursor.style.setProperty('--press', '1'));
  document.addEventListener('pointercancel', () => cursor.style.setProperty('--press', '1'));

  // Signatures are approved with the supplied pixel stamp.
  const mini = $('#mini');
  let observedGauge = null;
  function syncMini() {
    if (mini.dataset.game === 'contract') {
      const paper = mini.querySelector('.contract');
      if (paper && !paper.querySelector('.approve-stamp')) {
        const stamp = document.createElement('img');
        stamp.className = 'approve-stamp';
        stamp.src = 'assets/rpg/approve-stamp.png';
        stamp.alt = 'Approve 貓咪合格印章';
        paper.append(stamp);
      }
      if (paper && mini.querySelector('#signedBy')?.textContent.includes('✓')) paper.classList.add('approved');
    }
    if (mini.dataset.game === 'sketch') {
      const columns = mini.querySelector('.mini-columns');
      const reason = mini.querySelector('#reason');
      if (columns && reason && !columns.contains(reason)) {
        const label = reason.closest('label');
        label.classList.add('reason-gauge');
        columns.insertBefore(label, mini.querySelector('#sketchPaper'));
      }
      if (reason && reason !== observedGauge) {
        observedGauge = reason;
        let previous = Number(reason.value);
        new MutationObserver(() => {
          const next = Number(reason.value);
          if (next < previous) {
            reason.classList.remove('hit');
            void reason.offsetWidth;
            reason.classList.add('hit');
          }
          previous = next;
        }).observe(reason, { attributes: true, attributeFilter: ['value'] });
      }
    }
  }
  new MutationObserver(syncMini).observe(mini, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-game'] });

  // Five existing character sprites cheer against a school-yard pixel backdrop.
  const celebration = document.createElement('div');
  celebration.className = 'ending-celebration';
  celebration.innerHTML = '<h2>第一章素描，故事才剛開始</h2><div class="celebration-cast"></div>';
  for (const who of ['凱翔', '思于', '曉彤', '亞廷', '江承翰']) {
    const image = document.createElement('img');
    image.src = DATA.art.sprites[who].front;
    image.alt = who;
    celebration.querySelector('.celebration-cast').append(image);
  }
  $('#endingScreen').insertBefore(celebration, $('#endingScreen .ending-art'));

  // Dialogue blocking: one character on each side, never overlapping. The pool
  // collision reverses the pair so Siyu is on the right and Kaixiang on the left.
  const stage = document.createElement('div');
  stage.className = 'dialogue-stage';
  stage.innerHTML = '<img class="stage-left" alt=""><img class="stage-right" alt="">';
  $('#talk').prepend(stage);
  let lastSound = '';
  function surprise() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      for (const [i, frequency] of [680, 460].entries()) {
        const osc = context.createOscillator(), gain = context.createGain(), at = context.currentTime + i * .09;
        osc.type = 'square';
        osc.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(.03, at);
        gain.gain.exponentialRampToValueAtTime(.001, at + .12);
        osc.connect(gain); gain.connect(context.destination); osc.start(at); osc.stop(at + .13);
      }
      setTimeout(() => context.close().catch(() => {}), 400);
    } catch {}
  }
  function syncDialogueStage() {
    if (!$('#talk').open) return;
    const who = $('#speaker').textContent.split(' · ')[0];
    const scene = $('#map').dataset.scene;
    if (who === '旁白' || who === 'Podcast') { stage.hidden = true; return; }
    const pair = scene === 'poolHall' ? '凱翔' : scene === 'dorm' ? '凱翔' : scene === 'cafe' ? '曉彤' : scene === 'pool' ? '江承翰' : scene === 'studio' ? ($('#actorTargets .actor-target')?.dataset.actor === 'kai' ? '凱翔' : '曉彤') : '亞廷';
    const partner = who === '思于' ? pair : who;
    const reverse = scene === 'poolHall';
    stage.hidden = false;
    stage.dataset.layout = reverse ? 'side' : 'staggered';
    const left = stage.querySelector('.stage-left'), right = stage.querySelector('.stage-right');
    left.src = DATA.art.sprites[reverse ? partner : '思于'].right;
    left.alt = reverse ? partner : '思于';
    right.src = DATA.art.sprites[reverse ? '思于' : partner].left;
    right.alt = reverse ? '思于' : partner;
    const soundKey = scene + ':' + $('#talk').dataset.source;
    if (soundKey !== lastSound && (scene === 'poolHall' || scene === 'dorm' && $('#dialogue').textContent.includes('接招'))) {
      lastSound = soundKey;
      surprise();
    }
  }
  new MutationObserver(syncDialogueStage).observe($('#talk'), { attributes: true, attributeFilter: ['open', 'data-source'] });
  new MutationObserver(syncDialogueStage).observe($('#speaker'), { childList: true });
  new MutationObserver(syncDialogueStage).observe($('#dialogue'), { childList: true, subtree: true, characterData: true });
})();
