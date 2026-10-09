/* 統計與隱私同意橫幅（三語言）。由 analytics.js 在訪客還沒表態、或從頁尾「統計與隱私設定」重新開啟時才載入。
   「同意」與「拒絕」並排、大小相同；關閉（×）只代表這個分頁先不決定，不會被當成同意。 */
(() => {
  'use strict';
  if (window.INTRVLConsentBanner) return;
  const api = window.INTRVLAnalytics && window.INTRVLAnalytics.consent;
  if (!api) return;

  const TEXT = {
    'zh-TW': {
      label: '統計與隱私設定',
      body: '我們用 Google Analytics 和 Metricool 了解大家怎麼瀏覽這個網站，幫助我們改善內容。<br>按「同意」會在你的裝置存放 cookie，做更完整的統計。<br>按「拒絕」只會收到不含 cookie 的匿名統計，也不會載入 Metricool。<br>我們不會把這些資料用於廣告。',
      accept: '同意', decline: '拒絕', later: '先不決定，關閉'
    },
    en: {
      label: 'Analytics and privacy settings',
      body: 'We use Google Analytics and Metricool to see how this site is used and to improve it.<br>Choose Accept to allow cookies for fuller statistics.<br>Choose Decline and we only receive anonymous statistics without cookies, and Metricool is not loaded.<br>We do not use this data for advertising.',
      accept: 'Accept', decline: 'Decline', later: 'Decide later, close'
    },
    ko: {
      label: '통계 및 개인정보 설정',
      body: 'Google Analytics와 Metricool로 사이트 이용 방식을 파악해 콘텐츠를 개선합니다.<br>동의하시면 기기에 쿠키를 저장해 더 자세한 통계를 수집합니다.<br>거부하시면 쿠키 없이 익명 통계만 수집되며 Metricool은 불러오지 않습니다.<br>이 데이터를 광고에 사용하지 않습니다.',
      accept: '동의', decline: '거부', later: '나중에 결정, 닫기'
    }
  };
  const CSS = `
#intrvl-consent{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:760px;margin:0 auto;box-sizing:border-box;padding:16px 48px 16px 18px;background:#111210;color:#eceae3;border:1px solid #4a4b45;border-left:4px solid #ff9142;border-radius:2px;font:13px/1.75 'Noto Sans TC','Noto Sans KR',Manrope,system-ui,sans-serif;box-shadow:0 10px 36px rgba(0,0,0,.35)}
#intrvl-consent p{margin:0 0 12px}
#intrvl-consent .consent-actions{display:flex;gap:10px}
#intrvl-consent button{font:inherit;font-weight:700;cursor:pointer;min-height:40px;padding:0 22px;color:#eceae3;background:transparent;border:2px solid #ff9142;border-radius:2px;flex:1 1 0;max-width:180px}
#intrvl-consent button::before,#intrvl-consent button::after{content:none!important;display:none!important}
#intrvl-consent button{box-shadow:none!important;text-shadow:none!important;background-image:none!important;transform:none!important;text-transform:none;letter-spacing:normal}
#intrvl-consent button:hover{background:#ff9142;color:#111210}
#intrvl-consent button:focus-visible{outline:3px solid #fff;outline-offset:2px}
#intrvl-consent .consent-close{position:absolute;top:6px;right:6px;width:36px;min-height:36px;padding:0;border:0;font-size:22px;line-height:1;font-weight:400;max-width:none;flex:none}
#intrvl-consent .consent-close:hover{background:#2a2b27;color:#fff}
@media (prefers-reduced-motion:no-preference){#intrvl-consent{animation:intrvl-consent-in .35s ease-out}@keyframes intrvl-consent-in{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}}
@media (max-width:520px){#intrvl-consent{left:8px;right:8px;padding:14px 44px 14px 14px;font-size:12.5px}#intrvl-consent button{max-width:none}}
@media (max-height:460px){#intrvl-consent{padding:8px 44px 8px 14px;line-height:1.5}#intrvl-consent p{margin-bottom:8px}#intrvl-consent button{min-height:34px}}`;

  let el, opener;
  function show() {
    if (el) return;
    opener = document.activeElement;
    if (!document.getElementById('intrvl-consent-style')) {
      const style = document.createElement('style');
      style.id = 'intrvl-consent-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    const t = TEXT[api.lang] || TEXT['zh-TW'];
    el = document.createElement('div');
    el.id = 'intrvl-consent';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', t.label);
    el.innerHTML = `<p>${t.body}</p><div class="consent-actions"><button type="button" data-choice="granted">${t.accept}</button><button type="button" data-choice="denied">${t.decline}</button></div><button type="button" class="consent-close" data-choice="later" aria-label="${t.later}">×</button>`;
    el.addEventListener('click', event => {
      const choice = event.target.closest && event.target.closest('[data-choice]');
      if (!choice) return;
      if (choice.dataset.choice === 'later') api.later(); else api.set(choice.dataset.choice);
      hide(true);
    });
    document.body.append(el);
  }
  function hide(restoreFocus) {
    if (!el) return;
    el.remove();
    el = null;
    if (restoreFocus && opener && opener.isConnected && opener !== document.body && opener.focus) opener.focus({ preventScroll: true });
  }
  window.INTRVLConsentBanner = { show, hide };
})();
