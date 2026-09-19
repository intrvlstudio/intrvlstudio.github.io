(() => {
  const done = () => [1,2,3].every(n => RPGGame.inspect().state.eps.includes(n));
  const hint = document.getElementById('shareHint');
  const message = text => { hint.textContent = text; };
  document.getElementById('shareInstagram').onclick = async () => {
    if (!done()) return;
    try {
      const result = await RPGShare.complete();
      if (result === 'downloaded') message('通關插圖已下載。開啟 Instagram，選擇這張圖片發布貼文或限時動態。');
    } catch { message('圖片暫時無法載入，請再試一次。'); }
  };
  document.getElementById('downloadComplete').onclick = async () => {
    if (!done()) return;
    try { await RPGShare.saveImage(); message('通關插圖已下載，可在 IG、Threads 或 X 發文時附上。'); }
    catch { message('圖片暫時無法載入，請再試一次。'); }
  };
  const shareText = `${RPGShare.text}\n${RPGShare.url}`;
  document.getElementById('shareThreads').href = 'https://www.threads.com/intent/post?text=' + encodeURIComponent(shareText);
  document.getElementById('shareX').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(RPGShare.text) + '&url=' + encodeURIComponent(RPGShare.url);
  for (const id of ['shareThreads','shareX']) document.getElementById(id).onclick = e => {
    if (!done()) {e.preventDefault();return;}
    message('已開啟發文頁。若要附上通關插圖，請先按「下載插圖」，再將圖片加入貼文。');
  };
  const prepare = () => { if (done()) RPGShare.prepare().catch(() => {}); };
  new MutationObserver(prepare).observe(document.body, {attributes:true,attributeFilter:['data-screen']});
})();
