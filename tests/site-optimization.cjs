const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUTPUT||path.join(root,'output/optimization-qa');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.woff2':'font/woff2','.json':'application/json'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const base=process.env.SITE_URL||`http://127.0.0.1:${server.address().port}/`;
 const errors=[],missing=[],report=[];
 try {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',acceptDownloads:true});
  await context.route(/https:\/\/(fonts\.|www\.googletagmanager)/,route=>route.abort());
  const p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))missing.push(r.url())});
  for(const [file,lang] of [['index.html','zh-TW'],['index-en.html','en'],['index-ko.html','ko']]){
   await p.goto(base+file);await p.waitForFunction(()=>!document.querySelector('.logo-entry'));
   assert.equal(await p.locator('html').getAttribute('lang'),lang);
   const other=lang==='zh-TW'?'.lang-en,.lang-ko':lang==='en'?'.lang-zh,.lang-ko':'.lang-zh,.lang-en';
   assert.equal(await p.locator(other).count(),0,'Other language remains in '+file);
   assert.match(await p.locator('.footer-bottom').innerText(),new RegExp('2025–'+new Date().getFullYear()));
   assert.equal(await p.locator('.lang-toggle a').count(),3);
   assert.equal(await p.locator('link[rel=canonical]').count(),1);
   assert.equal(await p.locator('link[hreflang]').count(),4);
   const game=p.locator('.game-entry');
   assert.equal(await game.evaluate(el=>getComputedStyle(el,'::before').boxShadow),'none');
   assert.equal(await game.evaluate(el=>getComputedStyle(el,'::before').filter),'none');
   assert.equal(await game.evaluate(el=>getComputedStyle(el,'::before').opacity),'1');
   assert.match(await game.evaluate(el=>getComputedStyle(el,'::before').backgroundImage),/game-star.svg/);
   assert.equal(await game.getAttribute('aria-disabled'),'true','Preserve the scheduled release');
   await p.screenshot({path:path.join(out,`home-${lang}.png`)});
   report.push({page:file,language:lang,ok:true});
  }
  await p.locator('.lang-toggle a[hreflang=en]').click();await p.waitForURL('**/index-en.html');await p.reload();assert.equal(await p.locator('html').getAttribute('lang'),'en');
  for(const width of [390,768]){await p.setViewportSize({width,height:844});await p.goto(base+'index.html');await p.waitForFunction(()=>!document.querySelector('.logo-entry'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,`home-${width}.png`)})}
  await p.setViewportSize({width:1000,height:800});await p.goto(base+'be-my-portfolio.html');
  await p.waitForFunction(()=>document.body.dataset.introReady==='true');
  await p.evaluate(()=>localStorage.setItem('bmp-rpg-tutorial-v1','done'));await p.reload();await p.waitForFunction(()=>document.body.dataset.introReady==='true');
  assert(await p.locator('#gameLoader').isHidden());
  await p.locator('#start').click();assert(await p.locator('#talk').isVisible());
  await p.locator('#next').click();const progress=await p.evaluate(()=>RPGGame.inspect().state.dialogue);
  await p.reload();await p.waitForFunction(()=>document.body.dataset.introReady==='true');await p.locator('#continue').click();assert.deepEqual(await p.evaluate(()=>RPGGame.inspect().state.dialogue),progress);
  async function checkpoint(n){
   await p.evaluate(n=>{RPGGame.returnToIntro();const f={intro:true};const task=DATA.flow.find(t=>t.unlock===n);for(const t of DATA.flow){if(t.id===task.id)break;f[t.id]=true}const goal=DATA.layout[task.scene].npcs.find(t=>t[0]===task.npc)||DATA.layout.campus.storyNpcs.farewell;localStorage.setItem('bmp-rpg-save-v3',JSON.stringify({version:3,mapRevision:1,storyRevision:DATA.revision,scene:task.scene,x:goal[2],y:goal[3]+2,dir:'up',f,signed:n>1,dialogue:{id:task.id,index:DATA.events[task.id].length-1}}))},n);
   await p.reload();await p.waitForFunction(()=>document.body.dataset.introReady==='true');await p.locator('#continue').click();
   await p.locator('#talk').waitFor({state:'visible'});
   for(let j=0;j<4&&!await p.locator('#chapterAchievement').isVisible();j++){if(!await p.locator('#next').isVisible())throw Error(JSON.stringify({n,errors,inspect:await p.evaluate(()=>RPGGame.inspect()),dialogs:await p.locator('dialog[open]').evaluateAll(els=>els.map(e=>e.id))}));await p.locator('#next').click()}
   assert(await p.locator('#chapterAchievement').isVisible(),'chapter popup '+n);
   assert.equal(await p.locator('#achievementTitle').textContent(),`第 ${n} 話成就取得！`);
   assert.equal(await p.locator('#chapterAchievement button').count(),1);
   assert(await p.locator('#achievementPending').isVisible());
   assert(await p.locator('#achievementComic').isHidden());
   assert.equal(await p.evaluate(()=>RPGGame.inspect().state.pendingAchievement),n);
  }
  for(const n of [1,2,3]){
   await checkpoint(n);
   await p.reload();await p.waitForFunction(()=>document.body.dataset.introReady==='true');await p.locator('#continue').click();assert(await p.locator('#chapterAchievement').isVisible());
   await p.screenshot({path:path.join(out,`chapter-${n}.png`)});
   await p.locator('#achievementContinue').click();
   assert.equal(await p.evaluate(()=>RPGGame.inspect().state.pendingAchievement),null);
  }
  assert(await p.locator('#endingScreen').isVisible());assert.equal(await p.getByRole('button',{name:'分享成就',exact:true}).count(),0);
  assert(await p.locator('#endingComicPending').isVisible());
  await p.evaluate(async()=>{await RPGShare.prepare();navigator.canShare=()=>true;navigator.share=async data=>{window.shared={name:data.files[0].name,type:data.files[0].type,size:data.files[0].size,text:data.text}}});
  await p.locator('#shareComplete').click();assert.match(await p.evaluate(()=>window.shared.name),/任務完成.png$/);
  assert.equal(await p.evaluate(()=>window.shared.size),fs.statSync(path.join(root,'assets/rpg/mission-complete-share.png')).size);
  await p.evaluate(()=>{navigator.canShare=()=>false});const dl=p.waitForEvent('download');await p.locator('#downloadComplete').click();assert.match((await dl).suggestedFilename(),/任務完成.png$/);
  assert.match(await p.locator('#shareThreads').getAttribute('href'),/^https:\/\/www.threads.com\/intent\/post\?text=/);
  assert.match(await p.locator('#shareX').getAttribute('href'),/^https:\/\/twitter.com\/intent\/tweet/);
  await p.reload();await p.waitForFunction(()=>document.body.dataset.introReady==='true');await p.locator('#continue').click();assert(await p.locator('#endingScreen').isVisible(),'completed save returns to ending');
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
   await p.setViewportSize(viewport);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,`ending-${viewport.width}.png`),fullPage:true});
   await p.locator('#roam').click();assert(await p.locator('#rotateHint').isHidden());
   const sizes=await p.locator('#gameScreen button:visible').evaluateAll(els=>els.map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter(e=>e.w<43.9||e.h<43.9));assert.deepEqual(sizes,[],'touch targets '+viewport.width);
   await p.screenshot({path:path.join(out,`game-${viewport.width}.png`),fullPage:true});
   await p.reload();await p.waitForFunction(()=>document.body.dataset.introReady==='true');await p.locator('#continue').click();
  }
  // Actual touch emulation uses different media queries from resized desktop windows.
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));await mp.goto(base+'be-my-portfolio.html');await mp.waitForFunction(()=>document.body.dataset.introReady==='true');await mp.locator('#tutorialClose').click();await mp.locator('#start').tap();assert(await mp.locator('#talk').isVisible());assert(await mp.locator('#rotateHint').isHidden());await mp.screenshot({path:path.join(out,'mobile-portrait-dialogue.png')});
  await mp.setViewportSize({width:844,height:390});assert(await mp.locator('#talk').isVisible());await mp.screenshot({path:path.join(out,'mobile-landscape-dialogue.png')});await mobile.close();
  // Failed critical assets expose Retry, then recover without a stuck loading screen.
  const failure=await browser.newContext({reducedMotion:'reduce'});const fp=await failure.newPage();
  await fp.route('**/assets/rpg/title.webp',r=>r.abort());await fp.goto(base+'be-my-portfolio.html');await fp.locator('#loadingRetry').waitFor({state:'visible'});assert(await fp.locator('#gameLoader').isVisible());
  await fp.unroute('**/assets/rpg/title.webp');await fp.locator('#loadingRetry').click();await fp.waitForFunction(()=>document.body.dataset.introReady==='true');assert.equal(await fp.locator('#introProgress').getAttribute('value'),'100');await failure.close();
  // Normal motion exercises dynamic counters and animated title letter rendering.
  const motion=await browser.newContext({viewport:{width:1280,height:800}});const ap=await motion.newPage();ap.on('pageerror',e=>errors.push(e.message));
  for(const file of ['index.html','index-en.html','index-ko.html']){await ap.goto(base+file);await ap.waitForFunction(()=>!document.querySelector('.logo-entry'));await ap.locator('.timeline-toggle').click();await ap.locator('[data-chapter="3"]').click();await ap.waitForFunction(()=>document.querySelector('.numbers-value').textContent==='200+');}
  await motion.close();
  assert.deepEqual(errors,[],'JavaScript errors');assert.deepEqual(missing,[],'Missing local resources');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report,errors,missing,game:'three achievements, reload, final-only share, downloads, orientations passed'},null,2));console.log('All optimization checks passed. Screenshots: '+out);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
