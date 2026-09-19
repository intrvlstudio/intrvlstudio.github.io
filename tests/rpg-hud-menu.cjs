const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = process.cwd();
const roots = process.env.RPG_OVERLAY_DIR
  ? [path.resolve(process.env.RPG_OVERLAY_DIR),path.join(root,'output/release-r2'),root]
  : [root];
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  const relative = '.' + decodeURIComponent(url.pathname);
  const file = roots.map(base => path.resolve(base,relative))
    .find(candidate => roots.some(base => candidate.startsWith(base + path.sep)) && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const base = process.env.RPG_TEST_URL || `http://127.0.0.1:${server.address().port}/be-my-portfolio.html`;
    for (const scenario of [{name:'portrait-to-landscape-dialogue',saved:false,rotate:true},{name:'during-dialogue',saved:false},{name:'free-roam',saved:true}]) {
      const viewport = {width:844,height:390};
      const context = await browser.newContext({viewport:scenario.rotate?{width:390,height:844}:viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror',error => errors.push(error.message));
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.evaluate(saved => {
        localStorage.setItem('bmp-rpg-tutorial-v1','done');
        if (saved) localStorage.setItem('bmp-rpg-save-v3',JSON.stringify({version:3,mapRevision:1,storyRevision:2,scene:'campus',x:21,y:10,dir:'up',f:{intro:true},eps:[],signed:false,dialogue:null}));
      },scenario.saved);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator(scenario.saved ? '#continue' : '#start').tap();
      await page.locator('#gameScreen').waitFor({state:'visible'});
      if (!scenario.saved) await page.locator('#talk').waitFor({state:'visible'});
      if(scenario.rotate) await page.setViewportSize(viewport);
      const before = await page.evaluate(() => {
        const button = document.querySelector('#hudMenuToggle');
        const rect = button.getBoundingClientRect();
        return {
          x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
          display: getComputedStyle(button).display,
          hit: document.elementFromPoint(rect.x + rect.width / 2,rect.y + rect.height / 2)?.id,
          expanded: button.getAttribute('aria-expanded')
        };
      });
      await page.touchscreen.tap(before.x,before.y);
      const after = await page.evaluate(() => ({
        open: document.querySelector('#gameScreen .hud').classList.contains('menu-open'),
        expanded: document.querySelector('#hudMenuToggle').getAttribute('aria-expanded'),
        castVisible: getComputedStyle(document.querySelector('#castBook')).display !== 'none'
      }));
      console.log(JSON.stringify({scenario:scenario.name,viewport,before,after,errors}));
      assert.equal(after.open,true,'Mobile HUD should open after tapping its icon');
      assert.equal(after.expanded,'true');
      assert.equal(after.castVisible,true);
      fs.mkdirSync(path.join(root,'output/menu-fix'),{recursive:true});
      await page.screenshot({path:path.join(root,'output/menu-fix',scenario.name+(process.env.RPG_TEST_URL?'-live':'-local')+'.png')});
      if (!scenario.saved) {
        const dialogue = await page.evaluate(() => RPGGame.inspect().state.dialogue);
        const position = await page.evaluate(() => {const s=RPGGame.inspect().state;return [s.x,s.y]});
        await page.keyboard.press('ArrowDown');
        assert.deepEqual(await page.evaluate(() => {const s=RPGGame.inspect().state;return [s.x,s.y]}),position,'Dialogue still blocks movement');
        await page.locator('#castBook').tap();
        assert.equal(await page.locator('#panel').evaluate(el=>el.open),true);
        await page.keyboard.press('e');
        assert.deepEqual(await page.evaluate(() => RPGGame.inspect().state.dialogue),dialogue,'Panel keyboard input must not advance the dialogue');
        await page.locator('#panelClose').tap();
        assert.equal(await page.locator('#talk').evaluate(el=>el.open),true);
        await page.locator('#hudMenuToggle').tap();
        assert.equal(await page.locator('#hudMenuToggle').getAttribute('aria-expanded'),'false');
        await page.locator('#hudMenuToggle').tap();
        assert.equal(await page.locator('#hudMenuToggle').getAttribute('aria-expanded'),'true');
        if(scenario.rotate){
          await page.setViewportSize({width:390,height:844});
          await page.locator('#castBook').tap();
          assert.equal(await page.locator('#panel').evaluate(el=>el.open),true);
          await page.locator('#panelClose').tap();
          await page.setViewportSize(viewport);
          await page.locator('#hudMenuToggle').tap();
          assert.equal(await page.locator('#hudMenuToggle').getAttribute('aria-expanded'),'true');
        }
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {console.error(error);process.exitCode = 1});
