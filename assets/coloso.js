/* Load the official public preview only when requested. */
document.getElementById('course-play')?.addEventListener('click', () => {
  const frame = document.createElement('iframe');
  /* enablejsapi：讓 GA4 的影片互動量測（開始、25／50／75%、播完）能辨識這支內嵌影片 */
  frame.src = 'https://www.youtube-nocookie.com/embed/35eDahVZjII?autoplay=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
  frame.title = 'PIANN 官方課程試看：第 07 堂「抓型」與漫畫';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  document.getElementById('course-player').replaceChildren(frame);
  frame.focus();
});
