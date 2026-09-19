(() => {
  const button = document.getElementById('latest-story-cta');
  const countdown = document.getElementById('release-countdown');
  const countdownTime = document.getElementById('release-countdown-time');
  if (!button || !countdown || !countdownTime) return;

  // 2026-10-10 00:00 in Taiwan (UTC+08:00).
  const releaseAt = Date.parse('2026-10-10T00:00:00+08:00');
  const destination = button.dataset.href;
  let timer;

  function update() {
    const remaining = releaseAt - Date.now();
    if (remaining <= 0) {
      button.href = destination;
      button.classList.remove('is-locked');
      button.removeAttribute('aria-disabled');
      button.removeAttribute('aria-describedby');
      button.removeAttribute('data-tooltip');
      countdown.hidden = true;
      if (timer) clearInterval(timer);
      return;
    }

    const seconds = Math.ceil(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const lang = document.documentElement.lang;
    if (lang === 'en') {
      countdownTime.textContent = `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (lang === 'ko') {
      countdownTime.textContent = `${days}일 ${hours}시간 ${minutes}분 ${secs}초`;
    } else {
      countdownTime.textContent = `${days} 天 ${hours} 時 ${minutes} 分 ${secs} 秒`;
    }
  }

  button.addEventListener('click', event => {
    if (Date.now() < releaseAt) {
      event.preventDefault();
      button.focus();
    }
  });
  update();
  if (!button.href) timer = setInterval(update, 1000);
})();
