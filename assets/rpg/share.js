/* Image-first achievement sharing. Native file share on supported devices,
   otherwise save a PNG that can be posted to any social app. */
window.RPGShare = (() => {
  const title = '成為我的作品吧';

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function send(blob, filename, text) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, text, files: [file] });
        return 'shared';
      } catch (error) {
        if (error.name === 'AbortError') return 'cancelled';
      }
    }
    download(blob, filename);
    return 'downloaded';
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('圖片載入失敗'));
      image.src = src;
    });
  }

  function png(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('圖片產生失敗')), 'image/png');
    });
  }

  async function episode(ep, src) {
    const art = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff5f1';
    ctx.fillRect(0, 0, 1200, 1100);
    ctx.strokeStyle = '#ae788a';
    ctx.lineWidth = 12;
    ctx.strokeRect(34, 34, 1132, 1032);
    ctx.fillStyle = '#6b4b62';
    ctx.font = 'bold 34px "Microsoft JhengHei", sans-serif';
    ctx.fillText('成為我的作品吧  ·  畫冊成就', 80, 113);
    ctx.fillStyle = '#b54e70';
    ctx.font = 'bold 38px monospace';
    ctx.fillText(`EP 0${ep.n}`, 80, 174);
    // The cover is framed at its original 3:2 ratio, like the unlocked album card.
    const x = 80, y = 205, w = 1040, h = 693;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const scale = Math.max(w / art.width, h / art.height);
    const iw = art.width * scale, ih = art.height * scale;
    ctx.drawImage(art, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    ctx.restore();
    ctx.fillStyle = '#382940';
    ctx.font = 'bold 44px "Microsoft JhengHei", sans-serif';
    ctx.fillText(ep.title, 80, 972);
    ctx.font = '26px "Microsoft JhengHei", sans-serif';
    ctx.fillText(ep.text, 80, 1025, 1040);
    return send(await png(canvas), `成為我的作品吧-畫冊-EP${ep.n}.png`, `我解鎖了第 ${ep.n} 話畫冊成就！`);
  }

  async function complete(src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error('任務完成圖片載入失敗');
    return send(await response.blob(), '成為我的作品吧-任務完成.png', '三本畫冊全完成，任務完成！');
  }

  async function celebration(sources) {
    const [background,...cast]=await Promise.all(['assets/rpg/ending-schoolyard.svg',...sources].map(loadImage));
    await document.fonts.load('36px PixelRPG');
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=810;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(background,0,0,1440,810);
    ctx.textAlign='center';ctx.font='52px PixelRPG, sans-serif';ctx.fillStyle='#6c5369';ctx.fillText('第一張素描，故事才剛開始',724,133);ctx.fillStyle='#fff8e5';ctx.fillText('第一張素描，故事才剛開始',720,129);
    cast.forEach((art,i)=>ctx.drawImage(art,85+i*250,240,260,440));
    ctx.fillStyle='#70576b';ctx.font='26px PixelRPG, sans-serif';ctx.fillText('成為我的作品吧 · 前三話任務完成',720,762);
    return send(await png(canvas),'成為我的作品吧-歡呼合照.png','第一張素描，故事才剛開始！');
  }
  return { episode, complete, celebration };
})();
