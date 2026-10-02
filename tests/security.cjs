/* 安全回歸測試（純 Node，不需瀏覽器）：node tests/security.cjs
   守住三件事：1) 程式碼與資料庫不再存明文密碼  2) 成員頁面的 CSP 與防嵌入設定
   3) members.html 的內嵌模組語法沒壞（過去曾因壞合併讓後台卡白）。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const MEMBER_PAGES = ['login.html', 'members.html', 'news-admin.html'];
const queue = [];
const test = (name, fn) => queue.push([name, fn]);

/* ---------- 1. 不得有明文密碼 ---------- */
test('追蹤中的檔案不含舊的種子密碼', () => {
  const needles = ['intrvlmem' + '_0', 'admin' + '_000@'];   // 拆開寫，避免本檔自己命中
  const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n')
    .filter(f => f && /\.(html|js|cjs|mjs|json|css|rules)$/.test(f) && f !== 'tests/security.cjs');
  for (const f of files) {
    const s = read(f);
    for (const n of needles) assert(!s.includes(n), `${f} 含有疑似明文密碼樣式 "${n}"`);
  }
});

test('員工表單不再有密碼欄位，也不再寫入 loginPassword', () => {
  const s = read('members.html');
  assert(!s.includes('f_loginPassword'), '員工表單仍有 f_loginPassword');
  assert(!s.includes('STAFF_SEED') && !s.includes('seedStaff'), '仍有員工種子資料');
  const writes = [...s.matchAll(/loginPassword\s*:\s*([^,}\s]+)/g)].map(m => m[1]);
  assert(writes.every(v => v.startsWith('deleteField')), 'loginPassword 只能以 deleteField() 出現，實際：' + writes);
});

test('firestore.rules 的 validStaff 不允許 loginPassword', () => {
  const rules = read('firestore.rules');
  const start = rules.indexOf('function validStaff()');
  assert(start > -1, '找不到 validStaff');
  const body = rules.slice(start, rules.indexOf('function validProfile()'));
  assert(!body.includes('loginPassword'), 'validStaff 仍允許 loginPassword');
});

test('purgeLegacyPasswords：只清有舊欄位的文件，失敗不丟錯', async () => {
  const src = read('members.html').match(/async function purgeLegacyPasswords\(docs\) \{[\s\S]*?\n\}\n/);
  assert(src, '找不到 purgeLegacyPasswords');
  const calls = [], toasts = [], DEL = Symbol('deleteField');
  const mk = (ref, data) => ({ ref, data: () => data });
  const build = (updateDoc) => new Function('updateDoc', 'deleteField', 'toast', 'console',
    src[0] + '; return purgeLegacyPasswords;')(updateDoc, () => DEL, m => toasts.push(m), { warn() {} });
  const purge = build(async (ref, patch) => { calls.push([ref, patch]); });
  return Promise.resolve(purge([mk('a', { name: 'x', loginPassword: 'p' }), mk('b', { name: 'y' }), mk('c', { loginPassword: '' })]))
    .then(async () => {
      assert.deepEqual(calls.map(c => c[0]), ['a', 'c'], '應只更新有舊欄位的兩筆');
      assert(calls.every(c => c[1].loginPassword === DEL), '應使用 deleteField()');
      assert.equal(toasts.length, 1);
      await build(async () => { throw new Error('denied'); })([mk('a', { loginPassword: 'p' })]);   // 不得丟錯
    });
});

/* ---------- 2. CSP 與防嵌入 ---------- */
const cspOf = f => {
  const m = read(f).match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert(m, `${f} 缺少 CSP meta`);
  return Object.fromEntries(m[1].split(';').map(d => d.trim()).filter(Boolean)
    .map(d => { const [k, ...v] = d.split(/\s+/); return [k, v]; }));
};

test('成員頁面都有 CSP，且關鍵指令不寬鬆', () => {
  for (const f of MEMBER_PAGES) {
    const c = cspOf(f);
    assert.deepEqual(c['object-src'], ["'none'"], `${f} object-src`);
    assert.deepEqual(c['base-uri'], ["'self'"], `${f} base-uri`);
    assert.deepEqual(c['form-action'], ["'self'"], `${f} form-action`);
    for (const d of ['script-src', 'connect-src', 'default-src']) {
      for (const bad of ['*', 'https:', 'http:', 'data:']) assert(!c[d].includes(bad), `${f} ${d} 不應含 ${bad}`);
    }
    assert(!c['script-src'].includes("'unsafe-eval'"), `${f} 不應允許 unsafe-eval`);
  }
});

test('頁面與 auth.js 用到的外部網域都在 CSP 白名單內（新增 CDN 時這裡會提醒）', () => {
  const origin = u => new URL(u).origin;
  const allowed = (list, o) => list.includes(o);
  const authImports = [...read('assets/auth.js').matchAll(/from\s+"(https:\/\/[^"]+)"/g)].map(m => m[1]);
  for (const f of MEMBER_PAGES) {
    const c = cspOf(f), s = read(f);
    const scripts = [...s.matchAll(/<script[^>]*\ssrc="(https:\/\/[^"]+)"/g)].map(m => m[1]).concat(authImports);
    const styles = [...s.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="(https:\/\/[^"]+)"/g)].map(m => m[1]);
    for (const u of scripts) assert(allowed(c['script-src'], origin(u)), `${f}: script-src 缺 ${origin(u)}`);
    for (const u of styles) assert(allowed(c['style-src'], origin(u)), `${f}: style-src 缺 ${origin(u)}`);
  }
  const fontCss = read('members.html').includes('fonts.gstatic.com');
  if (fontCss) assert(cspOf('members.html')['font-src'].includes('https://fonts.gstatic.com'));
});

test('成員頁面都有防嵌入（frame-guard），且放在任何外部腳本之前', () => {
  for (const f of MEMBER_PAGES) {
    const s = read(f);
    const g = s.indexOf('id="frame-guard"');
    assert(g > -1, `${f} 缺少 frame-guard`);
    const firstExternal = s.search(/<script[^>]*\ssrc=/);
    assert(firstExternal === -1 || g < firstExternal, `${f} frame-guard 應在外部腳本之前`);
    assert(s.indexOf('Content-Security-Policy') < (firstExternal === -1 ? Infinity : firstExternal), `${f} CSP 應在外部腳本之前`);
  }
});

/* ---------- 3. 內嵌模組語法 ---------- */
test('members.html 與 login.html 的內嵌模組可通過語法檢查', () => {
  for (const f of ['members.html', 'login.html']) {
    const m = read(f).match(/<script type="module">([\s\S]*?)<\/script>/);
    assert(m, `${f} 找不到內嵌模組`);
    const tmp = path.join(os.tmpdir(), `sec-check-${process.pid}-${f}.mjs`);
    fs.writeFileSync(tmp, m[1]);
    try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); }
    catch (e) { assert.fail(`${f} 內嵌模組語法錯誤：\n${e.stderr}`); }
    finally { fs.rmSync(tmp, { force: true }); }
  }
});

(async () => {
  for (const [name, fn] of queue) { await fn(); console.log('ok  -', name); }
  console.log(`\n${queue.length} 項安全檢查通過`);
})().catch(e => { console.error('\nFAIL:', e.message); process.exit(1); });
