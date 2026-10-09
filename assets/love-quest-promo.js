/* Europe/Berlin: CEST at opening; CET after the October 25 clock change.
   End is exclusive, so the campaign includes all of October 31. */
(() => {
  const begins = Date.parse('2026-10-07T15:00:00+02:00');
  const ends = Date.parse('2026-11-01T00:00:00+01:00');
  // "Don't show again today": a first-party preference cookie that lapses at local midnight.
  const cookieName = 'intrvl_love_quest_promo_hidden';
  const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hiddenToday = () => { try { return document.cookie.split('; ').includes(`${cookieName}=${localDay()}`); } catch { return false; } };
  function hideToday(on) {
    try {
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      document.cookie = `${cookieName}=${on ? localDay() : ''}; path=/; ${on ? `expires=${midnight.toUTCString()}` : 'max-age=0'}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    } catch {}
  }
  let shown = false, dialog, timer;
  const active = () => Date.now() >= begins && Date.now() < ends;
  function close() { dialog?.close(); document.documentElement.classList.remove('love-quest-promo-open'); }
  function check() {
    clearTimeout(timer);
    if (Date.now() >= ends) { close(); observer.disconnect(); return; }
    if (!shown && hiddenToday()) { observer.disconnect(); return; }
    if (!shown && active() && !document.hidden && !document.documentElement.classList.contains('intro-playing') && !document.querySelector('dialog[open]')) {
      shown = true;
      const en = document.documentElement.lang === 'en', ko = document.documentElement.lang === 'ko';
      const title = en ? 'Be My Portfolio — Love Quest' : ko ? '나의 작품이 되어줘! — 두근두근 퀘스트' : '成為我的作品吧！心動任務';
      const label = en ? 'Close promotion' : ko ? '프로모션 닫기' : '關閉宣傳視窗';
      const go = en ? 'Start your Love Quest' : ko ? '두근두근 퀘스트 시작' : '開始你的心動任務，進入遊戲';
      const skip = en ? 'Don’t show again today' : ko ? '오늘 하루 보지 않기' : '今天不再顯示';
      dialog = document.createElement('dialog');
      dialog.id = 'loveQuestPromo'; dialog.setAttribute('aria-label', title);
      dialog.innerHTML = `<a class="quest-promo-link" href="/be-my-portfolio-rpg/" aria-label="${go}"><img src="/assets/love-quest-promo.webp?v=20261009-no-url" width="1200" height="1200" alt="${title}" fetchpriority="high"></a><button class="quest-promo-close" type="button" aria-label="${label}" autofocus><img src="/assets/love-quest-close.svg" width="52" height="52" alt=""></button><label class="quest-promo-skip"><input type="checkbox"><span>${skip}</span></label>`;
      document.body.append(dialog);
      dialog.querySelector('button').addEventListener('click', close);
      // Saved as soon as it is ticked, so closing by any route (button, backdrop, Esc, link) keeps the choice.
      dialog.querySelector('.quest-promo-skip input').addEventListener('change', event => hideToday(event.target.checked));
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      // Close before the existing game host receives the bubbling link click.
      dialog.querySelector('a').addEventListener('click', close);
      dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
      dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('love-quest-promo-open');
        if (!document.querySelector('dialog[open]')) document.querySelector('.emblem-menu, .nav-brand-logo, a[href]')?.focus({preventScroll:true});
      });
      document.documentElement.classList.add('love-quest-promo-open');
      dialog.showModal();
    }
    // Recheck pending entrances and expire an already-open promotion on time.
    timer = setTimeout(check, Math.min(60000, Math.max(100, (active() ? ends : begins) - Date.now())));
  }
  const observer = new MutationObserver(check);
  observer.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  document.addEventListener('visibilitychange', check);
  addEventListener('pageshow', check);
  check();
})();
