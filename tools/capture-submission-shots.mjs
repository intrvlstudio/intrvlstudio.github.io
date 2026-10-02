// 產生設計圖庫投稿用的截圖（Awwwards、S5-Style、Lapa Ninja、Reeoo、Dribbble 等）。
// 不需要安裝任何套件：用本機 Edge／Chrome 的遠端除錯協定。
// 用法：node tools/capture-submission-shots.mjs <網址> <輸出資料夾>
// 例如：node tools/capture-submission-shots.mjs https://intrvlstudio.github.io/ submission-shots
// 指定瀏覽器：EDGE_PATH="C:\path\to\msedge.exe" node tools/capture-submission-shots.mjs ...
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const [baseArg, outArg] = process.argv.slice(2);
if (!baseArg || !outArg) { console.error('用法：node tools/capture-submission-shots.mjs <網址> <輸出資料夾>'); process.exit(2); }
const base = baseArg.endsWith('/') ? baseArg : baseArg + '/';
const out = path.resolve(outArg);
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function findBrowser() {
  const c = [process.env.EDGE_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => fs.existsSync(p));
  if (!c) throw new Error('找不到 Edge 或 Chrome，請用 EDGE_PATH 指定瀏覽器路徑');
  return c;
}

const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'intrvl-shots-'));
const browser = spawn(findBrowser(), [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

let ws;
const done = async code => { try { ws?.close(); } catch {} browser.kill(); await sleep(400); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(code); };

try {
  let page;
  for (let i = 0; i < 60 && !page; i++) { try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} if (!page) await sleep(250); }
  if (!page) throw new Error('瀏覽器沒有啟動');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJS = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send('Page.enable'); await send('Runtime.enable');

  // 先把整頁捲過一遍，讓延遲載入的圖片與背景載入完，再捲到指定區塊的上緣
  const scrollTo = (sel, offset = 0) => `(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));for(let y=0;y<=document.documentElement.scrollHeight;y+=600){scrollTo(0,y);await sleep(50)}await sleep(600);const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;scrollTo(0,e.getBoundingClientRect().top+scrollY-${offset});return true})()`;

  const shots = [
    // [檔名, 路徑, 寬, 高, 縮放倍率, 要捲到的區塊, 說明]
    ['01-awwwards-thumbnail-1600x1200', 'index.html', 1600, 1200, 1, null, 'Awwwards 主縮圖規格 1600×1200'],
    ['02-首屏-1920x1080', 'index.html', 1920, 1080, 1, null, '一般首屏'],
    ['03-舞台中段-1920x1080', 'index.html', 1920, 1080, 1, '#works', '捲到 #works 的位置（舞台中段的故事畫面）'],
    ['04-團隊-1920x1080', 'index.html', 1920, 1080, 1, '#team', '團隊區'],
    ['05-消息-1920x1080', 'index.html', 1920, 1080, 1, '#news', '公告與 Instagram'],
    ['06-作品列表-1920x1080', 'works.html', 1920, 1080, 1, null, '作品列表頁'],
    ['07-手機首屏-390x844@2x', 'index.html', 390, 844, 2, null, '手機版首屏'],
    ['08-英文首屏-1920x1080', 'index-en.html', 1920, 1080, 1, null, '英文版首屏'],
  ];

  for (const [name, file, w, h, dpr, sel, note] of shots) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: w < 700 });
    await send('Page.navigate', { url: base + file });
    await sleep(9500);                                   // 等入場動畫結束
    if (sel) { const ok = await evalJS(scrollTo(sel)); if (!ok) console.warn('找不到區塊 ' + sel); await sleep(2200); }
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64'));
    console.log('完成', name + '.png', '—', note);
  }
  console.log('\n輸出資料夾：' + out);
  await done(0);
} catch (err) {
  console.error('失敗：' + (err.message || err));
  await done(1);
}
