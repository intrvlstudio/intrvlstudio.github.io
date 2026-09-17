(() => {
  const start=document.querySelector('.studio-play');
  if(!start)return;
  const stop=document.createElement('button');
  stop.className='studio-tour-stop';stop.type='button';stop.hidden=true;
  stop.innerHTML='<span class="lang-zh">暫停播放</span><span class="lang-en">Pause tour</span><span class="lang-ko">일시 정지</span>';
  document.body.append(stop);
  let frame=0,last=0,y=0;
  function pause(){cancelAnimationFrame(frame);frame=0;last=0;stop.hidden=true;start.setAttribute('aria-pressed','false')}
  function tick(time){
    const elapsed=last?Math.min(time-last,64):0;last=time;
    y=Math.min(document.documentElement.scrollHeight-innerHeight,y+elapsed*innerHeight*.00018);
    window.scrollTo({top:y,behavior:'instant'});
    if(y>=document.documentElement.scrollHeight-innerHeight-1){pause();return}
    frame=requestAnimationFrame(tick);
  }
  start.setAttribute('aria-pressed','false');
  start.addEventListener('click',()=>{pause();y=scrollY;stop.hidden=false;start.setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick)});
  stop.addEventListener('click',pause);
  for(const event of ['wheel','touchstart'])addEventListener(event,pause,{passive:true});
  document.addEventListener('pointerdown',event=>{if(!start.contains(event.target))pause()});
  document.addEventListener('keydown',event=>{if(['Escape','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))pause()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
})();
