(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = document.body.hasAttribute('data-logo-preview');
  const smooth = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const pieces = [
    {selector: '.hook-left', from: [-225, 255], start: 0},
    {selector: '.hook-middle', from: [0, 325], start: 180},
    {selector: '.hook-tip', from: [225, 255], start: 360}
  ];
  const pieceDuration = 2600;
  const assemblyEnd = pieces.at(-1).start + pieceDuration;
  const arrowDelay = assemblyEnd + 260;
  const flicker = [
    [0, 85, 0, '#fff'], [85, 155, 1, '#fff'],
    [155, 215, 0, '#fff'], [215, 295, 1, '#FF9142'],
    [295, 345, 0, '#FF9142'], [345, Infinity, 1, '#fff']
  ];
  const departAt = arrowDelay + 450;
  const departDuration = 550;
  const fadeAt = departAt + departDuration + 40;
  const fadeDuration = 400;
  let overlay, frame, ready = false, readyAt = Infinity, runId = 0;

  function finish() {
    runId++;
    cancelAnimationFrame(frame);
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
    const images = [
      ...document.querySelectorAll('.hero-art img'),
      ...document.querySelectorAll('.cover-title img')
    ];
    await Promise.all(images.map(image => image.decode().catch(() => {})));
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
    readyAt = Infinity;
    document.documentElement.classList.add('intro-playing');
    overlay = document.createElement('div');
    overlay.className = 'logo-entry';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `<div class="logo-entry-dock"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 303 263" fill="#fff"><g class="logo-entry-light"><g class="logo-entry-hook"><g class="hook-parts"><path class="hook-left" d="M151.854 263L55.3371 95.9273H124.214L151.854 143.799Z"/><path class="hook-middle" d="M151.854 263L151.854 143.799L177.8305 98.89315L227.427 132.36197Z"/><path class="hook-tip" d="M227.427 132.36197L177.8305 98.89315L203.807 53.9873L303 1.72394Z"/></g><path class="hook-whole" d="M151.854 263L55.3371 95.9273H124.214L151.854 143.799L203.807 53.9873L303 1.72394L151.854 263Z"/></g><g class="logo-entry-arrow"><path d="M38.2805 66.3006L0 0H203.807L38.2805 66.3006Z"/></g></svg></div>`;
    document.body.append(overlay);
    const dock = overlay.querySelector('.logo-entry-dock');
    const svg = dock.querySelector('svg');
    const arrow = overlay.querySelector('.logo-entry-arrow');
    const arrowFace = arrow.querySelector('path');
    const whole = overlay.querySelector('.hook-whole');
    const partsGroup = overlay.querySelector('.hook-parts');
    const fragments = pieces.map(piece => ({...piece, node: overlay.querySelector(piece.selector)}));
    let start;

    function paint(now) {
      start ??= now;
      const time = now - start;
      fragments.forEach(({node, from, start: begins}) => {
        const progress = smooth((time - begins) / pieceDuration);
        const arc = Math.sin(progress * Math.PI);
        const x = from[0] * (1 - progress) + (from[0] < 0 ? -24 : from[0] > 0 ? 24 : 0) * arc;
        const y = from[1] * (1 - progress) - 22 * arc;
        node.setAttribute('transform', `translate(${x} ${y})`);
        node.style.opacity = Math.min(1, Math.max(0, (time - begins) / 320));
      });

      // Replace the joined fragments only once every seam is exactly aligned.
      const sealed = time >= assemblyEnd;
      whole.style.opacity = sealed ? 1 : 0;
      partsGroup.style.opacity = sealed ? 0 : 1;

      const flash = time - arrowDelay;
      const state = flicker.find(([from, to]) => flash >= from && flash < to);
      arrow.style.opacity = flash < 0 ? 0 : 1;
      arrowFace.style.opacity = state?.[2] ?? 1;
      arrowFace.setAttribute('fill', state?.[3] ?? '#fff');

      const target = document.querySelector('.nav-intro .emblem-menu svg, .nav-intro .nav-brand-logo')?.getBoundingClientRect();
      const width = dock.getBoundingClientRect().width;
      const targetWidth = target?.width || 50;
      const targetX = target ? target.left + target.width / 2 : innerWidth / 2;
      const targetY = target ? target.top + target.height / 2 : 16 + targetWidth * 263 / 303 / 2;
      const originY = innerHeight * .4;
      const departure = smooth((time - departAt) / departDuration);
      dock.style.left = `${targetX}px`;
      dock.style.top = `${originY}px`;
      dock.style.transform = `translate(-50%, calc(-50% + ${(targetY - originY) * departure}px))`;
      svg.style.transform = `scale(${1 - (1 - targetWidth / width) * departure})`;

      // Keep the curtain in place if first-screen images are still decoding.
      const fade = ready ? smooth((time - Math.max(fadeAt, readyAt - start)) / fadeDuration) : 0;
      if (!preview) overlay.style.backgroundColor = `rgba(16, 16, 16, ${1 - fade})`;
      if (preview || fade < 1) frame = requestAnimationFrame(paint);
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
