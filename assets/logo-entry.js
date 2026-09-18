(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = document.body.hasAttribute('data-logo-preview');
  let overlay, frame;
  const clamp = t => Math.max(0, Math.min(1, t));
  const out = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => { t = clamp(t); return t*t*t*(t*(t*6-15)+10); };
  const arrival = 1450;
  const playbackRate = .55;
  const assemblyEnd = 3200;
  const parkingEnd = assemblyEnd + 850;
  const arrowDelay = parkingEnd;
  // Real milliseconds: short, short, long; each light/dark state is under 50 ms.
  const flicker = [20,20,40].flatMap(duration => [
    {duration, opacity:0, color:'#fff'},
    {duration, opacity:1, color:'#FF9142'},
    {duration, opacity:0, color:'#FF9142'},
    {duration, opacity:1, color:'#fff'}
  ]);
  const bezier = (p, t) => {
    const s = 1 - t;
    return [0, 1].map(axis => s*s*s*p[0][axis] + 3*s*s*t*p[1][axis] + 3*s*t*t*p[2][axis] + t*t*t*p[3][axis]);
  };
  function finish() {
    cancelAnimationFrame(frame);
    overlay?.remove();
    overlay = null;
    document.documentElement.classList.remove('intro-playing');
  }
  function play() {
    finish();
    if (reduced.matches) return;
    document.documentElement.classList.add('intro-playing');
    overlay = document.createElement('div');
    overlay.className = 'logo-entry';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="logo-entry-dock"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 303 263" fill="#fff"><defs><path id="hook-solid" d="M151.854 263L55.3371 95.9273H124.214L151.854 143.799L203.807 53.9873L303 1.72394L151.854 263Z"/></defs><g class="logo-entry-light"><g class="logo-entry-hook"><g class="hook-parts"></g><use class="hook-whole" href="#hook-solid"/></g><g class="logo-entry-arrow"><path d="M38.2805 66.3006L0 0H203.807L38.2805 66.3006Z"/></g></g></svg></div>`;
    document.body.append(overlay);
    const hook = overlay.querySelector('.logo-entry-hook');
    const hookParts = hook.querySelector('.hook-parts');
    // Tessellated diamond windows reveal the original silhouette without altering its edge.
    const svg = overlay.querySelector('svg');
    const defs = svg.querySelector('defs');
    const feathers = [];
    const centers = [];
    const ns = 'http://www.w3.org/2000/svg';
    for (let cy = 0; cy <= 300; cy += 50) for (let cx = 40; cx <= 340; cx += 50) {
      const id = `hook-diamond-${cx}-${cy}`;
      const clip = document.createElementNS(ns, 'clipPath');
      clip.id = id;
      clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
      const diamond = document.createElementNS(ns, 'rect');
      diamond.setAttribute('x', cx - 36);
      diamond.setAttribute('y', cy - 36);
      diamond.setAttribute('width', 72);
      diamond.setAttribute('height', 72);
      diamond.setAttribute('transform', `rotate(45 ${cx} ${cy})`);
      clip.append(diamond);
      defs.append(clip);
      const shard = document.createElementNS(ns, 'g');
      shard.classList.add('hook-shard');
      const shape = document.createElementNS(ns, 'use');
      shape.setAttribute('href', '#hook-solid');
      shape.setAttribute('clip-path', `url(#${id})`);
      shard.append(shape);
      hookParts.append(shard);
      feathers.push(shard);
      centers.push([cx, cy]);
    }

    const hookWhole = hook.querySelector('.hook-whole');
    const arrow = overlay.querySelector('.logo-entry-arrow');
    const arrowFace = arrow.querySelector('path');
    const dock = overlay.querySelector('.logo-entry-dock');
    let start;
    function paint(now) {
      start ??= now;
      const time = (now - start) * playbackRate;
      const width = dock.getBoundingClientRect().width;
      const x = innerWidth * 303 / width;
      const y = innerHeight * 303 / width;
      // Red guide: sweep inward from bottom-right, then rise into place.
      const travel = clamp(time / arrival);
      const h = 1 - Math.pow(1 - travel, 1.5);
      const hp = bezier([[x*.7,y*.62],[x*.08,y*.52],[-x*.03,y*.34],[0,0]], h);
      // Cross left of the target, reverse smoothly, then accelerate back to center.
      const overshoot = 36;
      const returnAt = .72;
      const returnProgress = clamp((travel-returnAt)/(1-returnAt));
      const hookX = travel < returnAt
        ? x*.7 + (-overshoot-x*.7)*out(travel/returnAt)
        : -overshoot*(1-smooth(returnProgress));
      // Assemble below the destination before parking the complete hook as one object.
      const groupParking = smooth((time-assemblyEnd)/(parkingEnd-assemblyEnd));
      const stagingOffset = 55*smooth(travel)*(1-groupParking);
      hook.style.transform = `translate(${hookX}px,${hp[1]+stagingOffset}px) rotate(${-45*(1-h)}deg) scale(${1 + 3.2*Math.pow(1-h,1.2)})`;
      hook.style.opacity = clamp(time / 80);
      // Diamond shards trail the curved flight path; the tail lengthens, then settles.
      const recovery = 1-smooth((time-1750)/1450);
      const vx = travel < returnAt
        ? (-overshoot-x*.7)*3*Math.pow(1-travel/returnAt,2)/returnAt
        : 30*overshoot*returnProgress*returnProgress*Math.pow(1-returnProgress,2)/(1-returnAt);
      const beforeH = 1-Math.pow(1-Math.max(0,travel-.002),1.5);
      const beforeY = bezier([[x*.7,y*.62],[x*.08,y*.52],[-x*.03,y*.34],[0,0]],beforeH)[1];
      const vy = (hp[1]-beforeY)/.002;
      const angle = (Math.atan2(vy,vx)*180/Math.PI + 45*(1-h))*recovery;
      const tension = clamp(Math.hypot(vx/x,vy/y)*.24 + returnProgress*.65)*recovery;
      // Flight pulls the pieces apart mid-course, then closes the gaps on approach.
      feathers.forEach((feather,i) => {
        const [cx,cy] = centers[i];
        const order = clamp((cx + 303 - cy) / 606);
        const joinAt = 1150 + (1-order)*1050;
        const spread = time < 500 ? smooth(time/500) : 1-smooth((time-joinAt)/900);
        const lag = (1-order)*160*spread + 18*spread;
        const fan = (cy-132)*.28*spread;
        const narrow = 1-tension*(.45+order*.18);
        // Blend the flight trail into a vertical parking approach below each slot.
        const parking = smooth((time-1550)/1200);
        const radians = angle*Math.PI/180;
        const trailX = -lag*Math.cos(radians)-fan*Math.sin(radians);
        const trailY = -lag*Math.sin(radians)+fan*Math.cos(radians);
        const offsetX = trailX*(1-parking);
        const offsetY = trailY*(1-parking)+(70+(1-order)*170)*spread*parking;
        feather.setAttribute('transform', `translate(${offsetX} ${offsetY}) translate(${cx} ${cy}) rotate(${angle}) scale(${1+tension*.28} ${narrow}) rotate(${-angle}) translate(${-cx} ${-cy})`);
      });
      // Seal the now-aligned seams gradually instead of swapping visible geometry.
      const seal = smooth((time-assemblyEnd)/70);
      hookParts.style.opacity = seal < 1 ? 1 : 0;
      hookWhole.style.opacity = seal;
      // Switch the upper-left triangle on in place; it has no entrance trajectory.
      arrow.style.transform = 'none';
      arrow.style.opacity = time < arrowDelay ? 0 : 1;
      // Abrupt electrical flicker, with no geometric flip or fade.
      let flickerTime = (time-arrowDelay)/playbackRate;
      let bulb = {opacity:1, color:'#fff'};
      if (flickerTime >= 0) {
        for (const state of flicker) {
          if (flickerTime < state.duration) { bulb = state; break; }
          flickerTime -= state.duration;
        }
      }
      arrowFace.style.opacity = bulb.opacity;
      arrowFace.setAttribute('fill', bulb.color);
      // A short forward/downward startup pulse before receding into the dock.
      const startup = clamp((time-(parkingEnd+680))/230);
      const push = startup*startup*(3-2*startup);
      const d = out(clamp((time-(parkingEnd+910))/590));
      const thrust = push*(1-d);
      const target = document.querySelector('.nav-intro .emblem-menu svg, .nav-intro .nav-brand-logo')?.getBoundingClientRect();
      const targetWidth = target?.width || 50;
      const targetX = target ? target.left+target.width/2 : innerWidth/2;
      const targetY = target ? target.top+target.height/2 : 16+targetWidth*263/303/2;
      const originY = innerHeight*.4;
      dock.style.position="absolute";dock.style.left=targetX+"px";dock.style.top=originY+"px";
      const lift = targetY-originY;
      dock.style.transform = `translate(-50%,calc(-50% + ${lift*d + Math.min(18,width*.07)*thrust}px))`;
      // Whole-logo rotation composes with, rather than replaces, each part's rotation.
      const entryRotation = -540*(1-h);
      dock.querySelector('svg').style.transform = `rotate(${entryRotation}deg) scale(${1+.1*thrust-(1-targetWidth/width)*d})`;
      // Reveal the page beneath the mark without fading the mark itself.
      if (!preview) overlay.style.backgroundColor = `rgba(16,16,16,${1-smooth((time-(parkingEnd+1400))/550)})`;
      if (time < parkingEnd+(preview ? 1500 : 1950)) frame = requestAnimationFrame(paint);
      else if (!preview) finish();
    }
    frame = requestAnimationFrame(paint);
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
