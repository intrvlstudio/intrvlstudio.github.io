// 首頁手機版圖片瘦身：把手機實際用不到的解析度與多餘的壓縮量去掉。
// 原則：只在「新檔案比原檔小至少 15%」時才覆蓋；保留透明通道；不改檔名。
// 需要 sharp：在任一暫存資料夾 npm install sharp，再用 NODE_PATH 指到它，或在專案外執行。
// 用法：node tools/optimize-mobile-images.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(process.env.SHARP_FROM ? path.join(process.env.SHARP_FROM, 'x.js') : import.meta.url);
const sharp = require('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');

// [檔案, 輸出寬度, 品質]。寬度依「手機顯示寬度 × 2」與桌機顯示寬度取較大者決定
const jobs = [
  // 主視覺（手機版）：顯示寬約 470 CSS px，取 900 px 寬可涵蓋 2 倍螢幕
  ['assets/hero/stage-20260917/stage-02-mobile.webp', 900, 82],
  ['assets/hero/stage-20260917/stage-01-mobile.webp', 900, 82],
  ['assets/hero/stage-20260917/stage-03-mobile.webp', 900, 82],
  ['assets/hero/stage-20260917/stage-04-mobile.webp', 900, 82],
  // 作品卡：手機顯示 285 px、桌機 382 px，取 760 px 涵蓋桌機 2 倍螢幕
  ['assets/cards-20260917/steal.webp', 760, 80],
  ['assets/cards-20260917/delivery.webp', 760, 80],
  ['assets/cards-20260917/roommate.webp', 760, 80],
  ['assets/cards-20260917/pry.webp', 760, 80],
  ['assets/cards-20260917/kill.webp', 760, 80],
  // 手機版整頁背景：顯示 412 px 寬
  ['assets/update-20260924/visual-b-mobile.webp', 900, 80],
  ['assets/update-20260924/visual-c-mobile.webp', 900, 80],
];

let before = 0, after = 0;
for (const [rel, width, quality] of jobs) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { console.log('略過（不存在）', rel); continue; }
  const src = fs.readFileSync(file);
  const meta = await sharp(src).metadata();
  const w = Math.min(width, meta.width);
  const out = await sharp(src).resize({ width: w, kernel: 'lanczos3' }).webp({ quality, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
  const ok = out.length <= src.length * 0.85;
  console.log(`${ok ? '改' : '留'}  ${rel.padEnd(52)} ${meta.width}×${meta.height} ${(src.length / 1024).toFixed(0).padStart(4)}KB → ${w}×${Math.round(meta.height * w / meta.width)} ${(out.length / 1024).toFixed(0).padStart(4)}KB`);
  before += src.length; after += ok ? out.length : src.length;
  if (ok && !dry) fs.writeFileSync(file, out);
}
console.log(`\n合計 ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB（省 ${((1 - after / before) * 100).toFixed(0)}%）${dry ? '（試跑，沒有寫檔）' : ''}`);
