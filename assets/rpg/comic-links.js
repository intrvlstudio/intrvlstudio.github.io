/* Official LINE WEBTOON reading links for episodes 1-3.
   They stay hidden ("本話漫畫即將公開") until the launch, 2026-10-10 22:00 Taiwan time (same moment as the home card,
   the works list and the story page). The game reads these on demand, so the buttons switch on without a reload.
   The generic `url` fallback opens episode 1. */
(() => {
  const launch = Date.parse('2026-10-10T22:00:00+08:00');
  const links = {
    1: 'https://webtoons.onelink.me/Jzmu/6f3ked6d',
    2: 'https://webtoons.onelink.me/Jzmu/efxbvde4',
    3: 'https://webtoons.onelink.me/Jzmu/7tu4kque'
  };
  const live = () => Date.now() >= launch;
  window.RPGComicLinks = {
    get url() { return live() ? links[1] : ''; },
    get episodes() { return live() ? links : {}; }
  };
})();
