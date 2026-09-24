/* 布告欄置頂活動卡：《台漫搶代幣接力賽》＋一鍵加入行事曆提醒。
   掉落日期要和 tools/build-token-relay-ics.cjs 一致（改完重跑該腳本產生 .ics）。活動結束後自動隱藏。 */
(() => {
  const DROPS = ['2026-09-29', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-18'];
  const TIME = '21:00', END = new Date('2026-10-18T23:59:59+08:00');
  const REDEEM = 'https://lin.ee/jkrRSV8C/wttw';
  const IG = 'https://www.instagram.com/intrvl_studio/', WEBTOON_IG = 'https://www.instagram.com/linewebtoontw/';
  const WEEK = { zh: '日一二三四五六', en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ko: '일월화수목금토' };
  const t = (zh, en, ko) => `<span class="lang-zh">${zh}</span><span class="lang-en">${en}</span><span class="lang-ko">${ko}</span>`;
  const at = date => new Date(`${date}T${TIME}:00+08:00`);
  const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const gcal = date => {
    const start = at(date), end = new Date(start.getTime() + 30 * 60000);
    const q = new URLSearchParams({
      action: 'TEMPLATE', text: 'INTRVL 搶代幣接力賽｜21:00 代幣掉落', dates: `${stamp(start)}/${stamp(end)}`, ctz: 'Asia/Taipei',
      details: `到 IG @intrvl_studio 看當天貼文取得兌換代碼，再到兌換網址輸入：${REDEEM}\n限量 30 名，先搶先得。`
    });
    return `https://calendar.google.com/calendar/render?${q}`;
  };
  const track = method => { try { window.gtag?.('event', 'token_relay_reminder', { method }); } catch {} };

  function render(now = new Date()) {
    const board = document.querySelector('.official-board');
    if (!board) return;
    board.querySelector('.relay-card')?.remove();
    if (now > END) return;
    const upcoming = DROPS.filter(d => at(d) > now);
    const next = upcoming[0];
    const rows = DROPS.map((d, i) => {
      const day = at(d), [, m, dd] = d.split('-').map(Number), w = new Date(`${d}T12:00:00+08:00`).getUTCDay();
      const past = day <= now, isNext = d === next;
      return `<li class="${past ? 'is-past' : ''}${isNext ? ' is-next' : ''}">
        <span class="relay-day">Day ${i + 2}</span>
        <span class="relay-date">${m}/${dd}<small>${t(`（${WEEK.zh[w]}）`, ` ${WEEK.en[w]}`, `(${WEEK.ko[w]})`)}</small></span>
        <span class="relay-time">${TIME}<small>${t('台灣時間', 'Taiwan time', '대만 시간')}</small></span>
        ${past ? `<span class="relay-done">${t('已掉落', 'Dropped', '종료')}</span>`
          : `<span class="relay-add"><a href="${gcal(d)}" target="_blank" rel="noopener noreferrer" data-track="google">Google</a><a href="assets/events/token-relay-${d}.ics" data-track="ics-single">${t('iPhone／其他', 'Apple / other', 'iPhone／기타')}</a></span>`}
      </li>`;
    }).join('');
    const card = document.createElement('article');
    card.className = 'relay-card';
    card.id = 'token-relay';
    card.setAttribute('aria-label', '台漫搶代幣接力賽');
    card.innerHTML = `
      <p class="relay-tag">${t('置頂活動', 'PINNED EVENT', '고정 이벤트')}　LINE WEBTOON × INTRVL</p>
      <h4>${t('台漫搶代幣接力賽', 'Taiwan Comics Token Relay', '대만 만화 코인 릴레이')}</h4>
      <p class="relay-period">${t('活動期間', 'Event period', '이벤트 기간')}：9/22 22:00 ～ 10/18 23:59${t('（台灣時間）', ' (Taiwan time)', ' (대만 시간)')}</p>
      ${next ? `<p class="relay-next">${t('下一波掉落', 'Next drop', '다음 드롭')}<strong data-countdown="${at(next).toISOString()}"></strong></p>
      <div class="relay-cta">
        <a class="relay-all" href="assets/events/token-relay-all.ics" data-track="ics-all">${t('一鍵加入全部提醒', 'Add all reminders', '알림 모두 추가')}</a>
        <small>${t('開搶前 10 分鐘與開搶當下各提醒一次', 'Alerts 10 minutes before and at drop time', '시작 10분 전과 시작 시 알림')}</small>
      </div>` : ''}
      <ol class="relay-list">${rows}</ol>
      ${next ? `<p class="relay-hint">${t('從 IG 開啟、按鈕沒反應？請點右上角「⋯」選「在瀏覽器中開啟」。', 'Buttons not working inside Instagram? Tap “⋯” at the top right and choose “Open in browser”.', '인스타그램에서 버튼이 작동하지 않나요? 오른쪽 위 「⋯」를 눌러 「브라우저에서 열기」를 선택하세요.')}</p>` : ''}
      <details class="relay-rules">
        <summary>${t('活動辦法', 'How it works', '참여 방법')}</summary>
        <h5>${t('第一重｜拚手速！限量代幣免費搶', 'Round 1｜Be quick: free limited tokens', '1단계｜선착순 무료 코인')}</h5>
        <p>${t(`每場 ${TIME} 準時掉落，到 IG 首頁連結或精選限動取得當天代碼，再到<a href="${REDEEM}" target="_blank" rel="noopener noreferrer">兌換網址</a>輸入。<br>獎勵：回饋型代幣 3 枚，每場限量 30 名，先搶先得。<br>若顯示「該兌換代碼已超過兌換期限」，代表當天代幣已被搶完。`,
          `Tokens drop at ${TIME} (Taiwan time). Get the day's code from our Instagram bio link or story highlights, then enter it at the <a href="${REDEEM}" target="_blank" rel="noopener noreferrer">redemption page</a>.<br>Reward: 3 bonus tokens, first 30 people per drop.<br>If the code shows as expired, that day's tokens are gone.`,
          `매회 ${TIME}(대만 시간)에 오픈. 인스타그램 프로필 링크나 하이라이트에서 코드를 확인한 뒤 <a href="${REDEEM}" target="_blank" rel="noopener noreferrer">교환 페이지</a>에 입력하세요.<br>보상: 보너스 코인 3개, 회당 선착순 30명.<br>코드가 만료로 표시되면 그날 코인은 모두 소진된 것입니다.`)}</p>
        <h5>${t('第二重｜留言加碼！代幣繼續抽', 'Round 2｜Comment to win more', '2단계｜댓글 추첨')}</h5>
        <p>${t('在活動貼文下方標記一位好友，並留言：@好友「一起來 Interval Studio 搶代幣啦！」<br>獎勵：回饋型代幣 10 枚，共抽出 10 名。<br>得獎名單將於 2026/10/30 前公布於活動貼文留言處。',
          'Tag a friend under the event post with: @friend "一起來 Interval Studio 搶代幣啦！"<br>Reward: 10 bonus tokens for 10 winners.<br>Winners will be announced in the post comments by 2026/10/30.',
          '이벤트 게시물에 친구를 태그하고 댓글을 남겨 주세요: @친구 「一起來 Interval Studio 搶代幣啦！」<br>보상: 보너스 코인 10개, 10명 추첨.<br>당첨자는 2026/10/30까지 게시물 댓글로 발표됩니다.')}</p>
        <h5>${t('終極加碼', 'Bonus', '추가 이벤트')}</h5>
        <p>${t(`<a href="${WEBTOON_IG}" target="_blank" rel="noopener noreferrer">@linewebtoontw</a> 官方帳號還有一人獨得 200 代幣的抽獎活動。`,
          `<a href="${WEBTOON_IG}" target="_blank" rel="noopener noreferrer">@linewebtoontw</a> is also giving away 200 tokens to one winner.`,
          `<a href="${WEBTOON_IG}" target="_blank" rel="noopener noreferrer">@linewebtoontw</a> 공식 계정에서도 200코인 추첨 이벤트가 진행 중입니다.`)}</p>
      </details>
      <p class="relay-links"><a href="${REDEEM}" target="_blank" rel="noopener noreferrer">${t('兌換網址', 'Redeem', '코인 교환')} ↗</a><a href="${IG}" target="_blank" rel="noopener noreferrer">@intrvl_studio ↗</a></p>`;
    board.querySelector('h3')?.after(card);
    card.addEventListener('click', e => { const a = e.target.closest('[data-track]'); if (a) track(a.dataset.track); });
    tick(card);
  }

  function tick(card) {
    const el = card.querySelector('[data-countdown]');
    if (!el) return;
    const target = new Date(el.dataset.countdown);
    const label = target.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric' }) + ' ' + TIME;
    const update = () => {
      const ms = target - Date.now();
      if (ms <= 0) { render(); return; }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      el.innerHTML = `${label}　${t(`還有 ${d ? d + ' 天 ' : ''}${h} 小時 ${m} 分`, `in ${d ? d + 'd ' : ''}${h}h ${m}m`, `${d ? d + '일 ' : ''}${h}시간 ${m}분 남음`)}`;
      clearTimeout(card._timer); card._timer = setTimeout(update, 30000);
    };
    update();
  }

  /* 分享連結 https://intrvlstudio.github.io/#token-relay：開場動畫結束後直接捲到活動卡。
     首頁是影片式捲動，瀏覽器原生的錨點跳轉不會生效，所以在這裡手動處理。 */
  function jumpToCard() {
    if (location.hash !== '#token-relay') return;
    const root = document.documentElement, started = Date.now();
    const go = () => {
      const card = document.getElementById('token-relay');
      if (!card) return;
      const top = () => card.getBoundingClientRect().top + scrollY - 80;
      scrollTo({ top: top(), behavior: 'instant' });
      setTimeout(() => { if (Math.abs(card.getBoundingClientRect().top - 80) > 4) scrollTo({ top: top(), behavior: 'instant' }); }, 600);
    };
    const wait = () => (root.classList.contains('intro-playing') && Date.now() - started < 9000) ? setTimeout(wait, 150) : go();
    wait();
  }

  window.INTRVLTokenRelay = { render };
  const init = () => { render(); jumpToCard(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
