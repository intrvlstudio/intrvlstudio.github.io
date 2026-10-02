// 「減少動態」回歸測試：系統設定為減少動態時，首頁不得有任何持續播放的動畫或自動播放的影片。
// 不需要安裝任何套件：用本機 Edge／Chrome 的遠端除錯協定，內建一個靜態伺服器。
// 執行：node tests/reduced-motion.mjs
// 指定瀏覽器：EDGE_PATH="C:\path\to\msedge.exe" node tests/reduced-motion.mjs
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function findBrowser() {
  const candidates = [process.env.EDGE_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error('找不到 Edge 或 Chrome，請用 EDGE_PATH 指定瀏覽器路徑');
  return found;
}

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, p === '/' ? 'index.html' : p);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }).end(buf);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'intrvl-motion-'));
const browser = spawn(findBrowser(), [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--mute-audio', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

let ws;
const cleanup = async () => { try { ws?.close(); } catch {} browser.kill(); server.close(); await sleep(400); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} };

try {
  let page;
  for (let i = 0; i < 60 && !page; i++) { try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} if (!page) await sleep(250); }
  assert(page, '瀏覽器沒有啟動');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJS = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  await send('Page.enable'); await send('Runtime.enable');

  // 頁面內探測：把整頁從頭捲到尾，再回到各個停點靜止後檢查
  const probe = `(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const vh = innerHeight, H = document.documentElement.scrollHeight, running = {};
    for (let y = 0; y <= H - vh; y += Math.max(vh, 900)) {
      scrollTo(0, y); await sleep(1400);
      for (const a of document.getAnimations()) if (a.playState === 'running') { const el = a.effect && a.effect.target; const k = (el ? el.tagName.toLowerCase() + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).trim().split(/\\s+/)[0] : '?') + ' ' + (a.animationName || a.transitionProperty || ''); running[k] = (running[k] || 0) + 1; }
    }
    return { cls: document.documentElement.className, running, playingVideos: [...document.querySelectorAll('video')].filter(v => !v.paused).length };
  })()`;

  const run = async (file, width, height, reduced) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await send('Page.navigate', { url: base + file });
    await sleep(9500);                                   // 入場動畫最長約 8.5 秒
    return evalJS(probe);
  };

  const results = [];
  for (const file of ['index.html', 'index-en.html', 'index-ko.html']) {
    for (const [w, h] of [[1280, 720], [390, 844]]) {
      const r = await run(file, w, h, true);
      assert(r.cls.includes('film-reading'), `${file} ${w}px：減少動態應進入靜態閱讀模式（film-reading），實際 class：${r.cls}`);
      assert.deepEqual(r.running, {}, `${file} ${w}px：減少動態下仍有動畫在播放：${JSON.stringify(r.running)}`);
      assert.equal(r.playingVideos, 0, `${file} ${w}px：減少動態下影片不應自動播放`);
      results.push(`通過  ${file}  ${w}px  減少動態：靜態閱讀模式、0 個動畫、0 支影片播放`);
    }
  }
  // 對照組：一般動態下一定要偵測得到動畫，否則上面的「0 個動畫」可能只是偵測失效
  const control = await run('index.html', 1280, 720, false);
  assert(control.cls.includes('film-enabled'), '一般動態應為 film-enabled');
  assert(Object.keys(control.running).length > 0, '對照組：一般動態下應偵測到動畫（跑馬燈、Logo 閃爍）');
  results.push(`通過  index.html  1280px  一般動態（對照）：偵測到 ${Object.keys(control.running).join('、')}`);

  console.log(results.join('\n'));
  console.log(`\n全部通過（${results.length} 項）`);
  await cleanup();
  process.exit(0);
} catch (err) {
  console.error('\n失敗：' + (err.message || err));
  await cleanup();
  process.exit(1);
}
