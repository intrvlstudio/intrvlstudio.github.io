/* Prepare the completion file before a tap to retain native share activation. */
window.RPGShare = (() => {
  const title = '成為我的作品吧';
  const url = 'https://intrvlstudio.github.io/be-my-portfolio.html';
  const text = '我完成了《成為我的作品吧》前三話校園冒險，三本畫冊全解鎖！';
  let file, pending;
  function prepare() {
    if (file) return Promise.resolve(file);
    if (!pending) pending = fetch('assets/rpg/mission-complete-share.png').then(response => {
      if (!response.ok) throw new Error('通關插圖載入失敗');
      return response.blob();
    }).then(blob => file = new File([blob], '成為我的作品吧-任務完成.png', {type:'image/png'}))
      .finally(() => { pending = null; });
    return pending;
  }
  function download(value) {
    const objectURL = URL.createObjectURL(value), a = document.createElement('a');
    a.href = objectURL; a.download = value.name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
  }
  async function complete() {
    const ready = file || await prepare();
    if (navigator.share && navigator.canShare?.({files:[ready]})) {
      try { await navigator.share({title, text:`${text}\n${url}`, files:[ready]}); return 'shared'; }
      catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
    }
    download(ready); return 'downloaded';
  }
  async function saveImage() { download(file || await prepare()); }
  return {prepare, complete, saveImage, text, url};
})();
