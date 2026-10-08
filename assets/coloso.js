/* Load the official public preview only when requested. */
document.getElementById('course-play')?.addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.src = 'https://www.youtube-nocookie.com/embed/35eDahVZjII?autoplay=1';
  frame.title = 'PIANN 官方課程試看：第 07 堂「抓型」與漫畫';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  document.getElementById('course-player').replaceChildren(frame);
  frame.focus();
});
