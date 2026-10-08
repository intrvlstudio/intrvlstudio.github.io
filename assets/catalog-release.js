(() => {
  const cards=[...document.querySelectorAll('[data-release-at]')];
  let timer;
  function refresh(){
    for(let i=cards.length-1;i>=0;i--){
      const card=cards[i];
      if(Date.now()<Date.parse(card.dataset.releaseAt))continue;
      const img=card.querySelector('[data-release-src]');img.src=img.dataset.releaseSrc;img.hidden=false;
      card.querySelector('.catalog-teaser').hidden=true;
      card.querySelector('[data-release-status]').textContent='作品頁已上線';
      card.querySelector('.catalog-story-link').setAttribute('aria-label',img.alt.replace(' 封面','')+' — 作品介紹');
      cards.splice(i,1);
    }
    if(!cards.length&&timer)clearInterval(timer);
  }
  refresh();if(cards.length)timer=setInterval(refresh,1000);
  document.addEventListener('visibilitychange',refresh);
})();
