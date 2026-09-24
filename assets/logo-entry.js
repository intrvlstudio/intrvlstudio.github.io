(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = document.body.hasAttribute('data-logo-preview');
  const smooth = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const pieces = [
    {selector: '.hook-left', from: [-225, 255], start: 0},
    {selector: '.hook-middle', from: [0, 325], start: 65},
    {selector: '.hook-tip', from: [225, 255], start: 130}
  ];
  const pieceDuration = 520;
  const assemblyEnd = pieces.at(-1).start + pieceDuration;
  const arrowDelay = assemblyEnd + 30;
  const countAt = arrowDelay + 170;
  const departDuration = 360;
  const countDuration = 2000;
  // Presentation milestones add bursts and pauses; asset readiness still gates 100%.
  const countStops = [[0,0],[.10,17],[.23,17],[.36,54],[.48,54],[.58,76],[.76,76],[.85,91],[.94,94],[.97,94],[1,100]];
  function stagedCount(elapsed) {
    const t=Math.min(1,elapsed>=countDuration?1:Math.floor(elapsed/55)*55/countDuration);
    const next=countStops.findIndex(stop=>stop[0]>t);
    if(next<0)return 100;
    const [a,value]=countStops[Math.max(0,next-1)], [b,target]=countStops[next];
    return value+(target-value)*smooth((t-a)/(b-a));
  }
  const fadeDuration = 340;
  const maxHold = 7500;
  let safetyTimer, completed = 0, total = 0;
  let overlay, frame, ready = false, readyAt = Infinity, runId = 0;

  function finish() {
    runId++;
    cancelAnimationFrame(frame);
    clearTimeout(safetyTimer);
    if (overlay) performance.mark('site-intro-ready');
    overlay?.remove();
    overlay = null;
    document.documentElement.classList.remove('intro-playing');
  }

  // Decode images visible when the curtain opens; lower sections keep lazy loading.
  async function waitForFirstScreen(id) {
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true}));
    }
    if(id!==runId)return;
    const images = [
      ...document.querySelectorAll('.hero-art img'),
      ...document.querySelectorAll('.cover-title img')
    ];
    total=images.length;
    await Promise.all(images.map(async image=>{try{await image.decode()}catch{ /* A broken image must not block entry. */ }finally{if(id===runId)completed++}}));
    if (id !== runId) return;
    readyAt = performance.now();
    performance.mark('site-first-screen-ready');
    ready = true;
  }

  function play() {
    finish();
    if (reduced.matches) return;
    const id = ++runId;
    ready = false;
    completed=0;total=0;
    readyAt = Infinity;
    document.documentElement.classList.add('intro-playing');
    overlay = document.createElement('div');
    overlay.className = 'logo-entry';
    overlay.setAttribute('aria-label', 'INTRVL 開場動畫');
    overlay.innerHTML = `<div class="logo-entry-streak" aria-hidden="true"></div><div class="logo-entry-ring" aria-hidden="true"></div><div class="logo-entry-dock" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 303 263" fill="#fff"><g class="logo-entry-light"><g class="logo-entry-hook"><g class="hook-parts"><path class="hook-left" d="M151.854 263L55.3371 95.9273H124.214L151.854 143.799Z"/><path class="hook-middle" d="M151.854 263L151.854 143.799L177.8305 98.89315L227.427 132.36197Z"/><path class="hook-tip" d="M227.427 132.36197L177.8305 98.89315L203.807 53.9873L303 1.72394Z"/></g><path class="hook-whole" d="M151.854 263L55.3371 95.9273H124.214L151.854 143.799L203.807 53.9873L303 1.72394L151.854 263Z"/></g><g class="logo-entry-arrow"><path d="M38.2805 66.3006L0 0H203.807L38.2805 66.3006Z"/></g></svg></div>`;
    const counter=document.createElement('div');counter.className='logo-entry-counter';counter.setAttribute('role','progressbar');counter.setAttribute('aria-label','首頁圖片載入');counter.setAttribute('aria-valuemin','0');counter.setAttribute('aria-valuemax','100');counter.setAttribute('aria-valuenow','0');counter.hidden=true;
    counter.innerHTML='<span class="entry-code-label">LOAD_ASSETS()</span><div class="entry-code-value">[ <b>000</b><span>%</span> ]</div><span class="entry-code-status">INITIALIZING_</span>';
    overlay.append(counter);
    const digits=counter.querySelector('b'),status=counter.querySelector('.entry-code-status');
    const skip=document.createElement('button');skip.className='logo-entry-skip';skip.type='button';skip.textContent='跳過 / Skip';skip.addEventListener('click',finish);overlay.append(skip);
    if(preview)overlay.classList.add('logo-entry-preview');
    document.body.append(overlay);
    if(!preview)safetyTimer=setTimeout(finish,8500);
    const dock = overlay.querySelector('.logo-entry-dock');
    const svg = dock.querySelector('svg');
    const arrow = overlay.querySelector('.logo-entry-arrow');
    const arrowFace = arrow.querySelector('path');
    const whole = overlay.querySelector('.hook-whole');
    const partsGroup = overlay.querySelector('.hook-parts');
    const fragments = pieces.map(piece => ({...piece, node: overlay.querySelector(piece.selector)}));
    let start, destination, count=0, completeAt=Infinity;

    function paint(now) {
      start ??= now;
      const time = now - start;
      fragments.forEach(({node, from, start: begins}) => {
        const raw=Math.max(0,Math.min(1,(time-begins)/pieceDuration));
        const progress=1+2.2*Math.pow(raw-1,3)+1.2*Math.pow(raw-1,2);
        const arc = Math.sin(progress * Math.PI);
        const x = from[0] * (1 - progress) + (from[0] < 0 ? -24 : from[0] > 0 ? 24 : 0) * arc;
        const y = from[1] * (1 - progress) - 22 * arc;
        node.setAttribute('transform', `translate(${x} ${y}) rotate(${(from[0]<0?-14:from[0]>0?14:6)*(1-progress)} 151.5 131.5)`);
        node.style.opacity = Math.min(1, Math.max(0, (time - begins) / 95));
      });

      // Replace the joined fragments only once every seam is exactly aligned.
      const sealed = time >= assemblyEnd;
      whole.style.opacity = sealed ? 1 : 0;
      partsGroup.style.opacity = sealed ? 0 : 1;

      const flash=Math.max(0,Math.min(1,(time-arrowDelay)/160));
      arrow.style.opacity=time<arrowDelay?0:flash;
      arrow.style.transform=`translate(${(1-flash)*-70}px,${(1-flash)*-28}px)`;
      arrowFace.setAttribute('fill', time<countAt+100?'#FF9142':'#fff');
      overlay.classList.toggle('is-waiting', !ready&&time>=countAt);
      destination ??= document.querySelector('.nav-intro .emblem-menu svg, .nav-intro .nav-brand-logo')?.getBoundingClientRect();
      const target = destination;
      const width = dock.getBoundingClientRect().width;
      const targetWidth = target?.width || 50;
      const targetX = target ? target.left + target.width / 2 : innerWidth / 2;
      const targetY = target ? target.top + target.height / 2 : 16 + targetWidth * 263 / 303 / 2;
      const originY = innerHeight * .46;
      // Count in the center before moving the assembled mark to navigation.
      const elapsed=Math.max(0,time-countAt);
      counter.style.left=`${innerWidth/2}px`;
      counter.style.top=`${originY+width*263/303/2+18}px`;
      const limit=ready?100:Math.min(95,10+(total?completed/total:0)*80+elapsed/250);
      count=Math.max(count,Math.floor(Math.min(100,stagedCount(elapsed),limit)));
      digits.textContent=String(count).padStart(3,'0');counter.setAttribute('aria-valuenow',String(count));
      status.textContent=count===100?'READY;':time>=maxHold?'CONTINUING…':'LOADING'+'.'.repeat(Math.floor(elapsed/240)%4)+'_';
      if(count===100&&completeAt===Infinity)completeAt=time;
      const departAt=Math.min(completeAt+180,maxHold);
      const departure=smooth((time-departAt)/departDuration);
      const retract=smooth((time-departAt)/180);
      dock.style.left=`${innerWidth/2+(targetX-innerWidth/2)*departure}px`;
      dock.style.top=`${originY}px`;
      dock.style.transform=`translate(-50%, calc(-50% + ${(targetY-originY)*departure}px))`;
      svg.style.transform=`scale(${1-(1-targetWidth/width)*departure})`;
      counter.hidden=time<countAt||retract>=1;
      counter.style.opacity=1-retract;
      counter.style.transform=`translate(-50%, ${-14*retract}px) scale(${1-.12*retract})`;
      const gate=departAt+departDuration;
      const fade=smooth((time-gate)/fadeDuration);
      if (!preview) {overlay.style.opacity=1-fade;overlay.style.clipPath=`inset(0 0 ${fade*100}% 0)`;}
      if (preview) {if(time<gate+fadeDuration)frame=requestAnimationFrame(paint);}
      else if(fade<1)frame=requestAnimationFrame(paint);
      else finish();
    }
    frame = requestAnimationFrame(paint);
    waitForFirstScreen(id);
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Tab') finish();
  });
  reduced.addEventListener('change', finish);
  addEventListener('pagehide', finish);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-replay-logo]')) play();
  });
  play();
})();
