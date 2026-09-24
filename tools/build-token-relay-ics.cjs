/* 產生《台漫搶代幣接力賽》提醒用 .ics（每場掉落一檔＋全部一檔）。改日期後重跑：node tools/build-token-relay-ics.cjs
   日期要和 assets/token-relay.js 的 DROPS 保持一致。 */
const fs = require('node:fs');
const drops = ['2026-09-29', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-18'];
const time = '21:00', redeem = 'https://lin.ee/jkrRSV8C/wttw', ig = 'https://www.instagram.com/intrvl_studio/';
const utc = (date, min = 0) => {
  const d = new Date(`${date}T${time}:00+08:00`); d.setUTCMinutes(d.getUTCMinutes() + min);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};
const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const desc = esc(`INTRVL 之間工作室 × LINE WEBTOON 限量代幣 ${time} 準時掉落！\n1. 到 IG @intrvl_studio 看當天貼文取得兌換代碼\n2. 前往兌換網址輸入代碼：${redeem}\n限量 30 名，先搶先得。\n${ig}`);
const event = date => [
  'BEGIN:VEVENT', `UID:intrvl-token-relay-${date}@intrvlstudio.github.io`, 'DTSTAMP:20260924T000000Z',
  `DTSTART:${utc(date)}`, `DTEND:${utc(date, 30)}`,
  'SUMMARY:INTRVL 搶代幣接力賽｜21:00 代幣掉落', `DESCRIPTION:${desc}`, `URL:${redeem}`,
  'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:10 分鐘後代幣掉落，準備搶！', 'TRIGGER:-PT10M', 'END:VALARM',
  'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:代幣掉落了！快去兌換', 'TRIGGER:PT0M', 'END:VALARM',
  'END:VEVENT'
];
const cal = events => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//INTRVL Studio//Token Relay//ZH', 'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH', 'X-WR-CALNAME:INTRVL 搶代幣接力賽', 'X-WR-TIMEZONE:Asia/Taipei', ...events.flat(), 'END:VCALENDAR'].join('\r\n') + '\r\n';
fs.mkdirSync('assets/events', { recursive: true });
fs.writeFileSync('assets/events/token-relay-all.ics', cal(drops.map(event)));
for (const d of drops) fs.writeFileSync(`assets/events/token-relay-${d}.ics`, cal([event(d)]));
console.log('ok', drops.length + 1, 'files');
