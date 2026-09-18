/* Intro loads on arrival, never on Start. Game state is owned by rpg-core. */
(() => {
  const $ = selector => document.querySelector(selector), game = window.RPGGame;
  const hud = $('#gameScreen .hud');
  for (const id of ['episodeCount','castBook','fullscreen','sfx','music','gameHelp','home','hudMenuToggle']) hud.append($('#'+id));
  $('#exitGame')?.remove(); $('#gameHelp').textContent='i';
  const home = () => game.entryHost ? game.entryHost.close() : location.assign('index.html');
  $('#home').setAttribute('aria-label','儲存進度並回到官網首頁'); $('#home').onclick=home;
  document.querySelectorAll('a[href="index.html"]').forEach(a=>a.onclick=e=>{e.preventDefault();home()});
  const actors=document.createElement('canvas');actors.id='actorLayer';actors.width=1280;actors.height=768;actors.setAttribute('aria-hidden','true');$('#portalMarkers').after(actors);
  document.addEventListener('pointerdown',()=>document.body.classList.add('cursor-pressed'));
  for(const event of ['pointerup','pointercancel','blur'])window.addEventListener(event,()=>document.body.classList.remove('cursor-pressed'));
  const controls=document.createElement('div');controls.className='intro-audio';
  controls.innerHTML='<button id="introMusic" aria-label="切換背景音樂">♫ 音樂</button><label for="introVolume">音量 <output id="volumeValue">50%</output></label><input id="introVolume" type="range" min="0" max="100" value="50" aria-label="音樂音量">';
  $('#titleScreen .actions').before(controls);
  const icon=(selector,name,iconOnly=false)=>document.querySelectorAll(selector).forEach(button=>{
    button.dataset.uiIcon=name;button.style.setProperty('--ui-image',`url('${new URL(`assets/rpg/ui/${name}.svg`,document.baseURI).href}')`);
    if(!button.getAttribute('aria-label'))button.setAttribute('aria-label',button.textContent.trim());
    button.title=button.getAttribute('aria-label');if(iconOnly)button.classList.add('ui-icon-only');
  });
  const instructions=document.createElement('button');instructions.id='introHelp';instructions.textContent='操作說明';instructions.onclick=()=>$('#gameHelp').click();$('#titleScreen .actions').append(instructions);
  const back=document.createElement('button');back.id='backToIntro';back.textContent='儲存並回遊戲介紹頁';back.onclick=game.returnToIntro;$('#gameTutorial .tutorial-actions').after(back);
  icon('#music,#introMusic','music');icon('#sfx','sfx');icon('#gameHelp','information');icon('#home,.top a[href="index.html"]','home');
  icon('#introHelp','how-to');icon('#backToIntro','game-start');icon('#newGame,#loadingRetry','refresh');
  icon('#panelClose,#miniExit,#tutorialClose,#homeGuideClose,#homeHintClose','close',true);
  const syncAudio=()=>{const on=!game.music.paused;$('#introMusic').textContent=on?'♫ 音樂播放中':'♫ 播放音樂';$('#introMusic').setAttribute('aria-pressed',String(on));$('#loadingSound').textContent=on?'♫ 音樂 50% · 點按靜音':'♫ 點按播放音樂';};
  $('#introMusic').onclick=$('#loadingSound').onclick=game.toggleMusic;
  $('#introVolume').oninput=e=>{game.music.volume=Number(e.target.value)/100;$('#volumeValue').textContent=e.target.value+'%'};
  document.addEventListener('rpg-music-change',syncAudio);game.music.addEventListener('playing',syncAudio);game.music.addEventListener('pause',syncAudio);syncAudio();
  const loader=$('#gameLoader');let loading=false;
  const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>reject(new Error(src)),15000);img.onload=()=>{clearTimeout(timer);resolve()};img.onerror=()=>{clearTimeout(timer);reject(new Error(src))};img.src=src;});
  async function loadIntro(){
    if(loading)return;loading=true;$('#loadingRetry').hidden=true;const start=performance.now();
    let saved;try{saved=JSON.parse(localStorage.getItem('bmp-rpg-save-v3'))}catch{}
    const critical=[DATA.art.assets.title,DATA.art.maps.studio,DATA.art.sheets.思于,DATA.art.sheets.曉彤,DATA.art.portraits.思于.neutral,DATA.art.portraits.思于.cry,DATA.art.portraits.曉彤.neutral,DATA.art.maps[saved?.scene]].filter(Boolean);
    const images=[...new Set(critical)];let done=0;
    const progress=()=>{const n=Math.round(++done/(images.length+1)*100);$('#introProgress').value=n;$('#loadingPercent').textContent=n+'%';loader.style.setProperty('--fill',n/100)};
    try{
      $('#loadingCopy').textContent='正在準備冒險素材';
      await Promise.all([...images.map(src=>loadImage(src).then(progress)),document.fonts.load('16px PixelRPG').then(progress)]);
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,700-(performance.now()-start))));
      $('#loadingCopy').textContent='一起開始冒險';await new Promise(resolve=>setTimeout(resolve,240));
      loader.hidden=true;document.body.dataset.introReady='true';performance.mark('rpg-intro-ready');game.introReady();
      const later=[...new Set([...Object.values(DATA.art.maps),...Object.values(DATA.art.sheets),...Object.values(DATA.art.portraits).flatMap(Object.values)])].filter(src=>!images.includes(src));
      const warm=async()=>{while(later.length){await Promise.all(later.splice(0,2).map(src=>loadImage(src).catch(()=>{})));await new Promise(r=>setTimeout(r,80))}};
      setTimeout(warm,1200);
    }catch{ $('#loadingCopy').textContent='素材載入未完成，請重試';$('#loadingRetry').hidden=false; }
    finally{loading=false}
  }
  $('#loadingRetry').onclick=loadIntro;game.entryHost?.showFrame();loadIntro();

  let encounterCount=0;
  function playEncounter(){
    if($('#sfx').getAttribute('aria-pressed')==='false')return;encounterCount++;
    try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;const context=new Context();
      [760,1080,540].forEach((frequency,i)=>{const o=context.createOscillator(),g=context.createGain(),at=context.currentTime+i*.065;o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(.045,at);g.gain.exponentialRampToValueAtTime(.001,at+.12);o.connect(g);g.connect(context.destination);o.start(at);o.stop(at+.13)});
      setTimeout(()=>context.close().catch(()=>{}),450);
    }catch{}
  }
  window.RPGUI={playEncounter,get encounterCount(){return encounterCount}};
  const mini=$('#mini');let observedGauge;
  new MutationObserver(()=>{
    if(mini.dataset.game==='contract'){
      const paper=mini.querySelector('.contract');
      if(paper&&!paper.querySelector('.approve-stamp')){const stamp=new Image();stamp.className='approve-stamp';stamp.src='assets/rpg/approve-stamp.webp';stamp.alt='Approve 貓咪合格印章';paper.append(stamp)}
      if(paper&&mini.querySelector('#signedBy')?.textContent.includes('✓'))paper.classList.add('approved');
    }
    if(mini.dataset.game==='sketch'){
      const columns=mini.querySelector('.mini-columns'),reason=mini.querySelector('#reason');
      if(columns&&reason&&!columns.contains(reason)){const label=reason.closest('label');label.classList.add('reason-gauge');columns.insertBefore(label,mini.querySelector('#sketchPaper'))}
      if(reason&&reason!==observedGauge){observedGauge=reason;let previous=Number(reason.value);new MutationObserver(()=>{const next=Number(reason.value);if(next<previous){reason.classList.remove('hit');void reason.offsetWidth;reason.classList.add('hit')}previous=next}).observe(reason,{attributes:true,attributeFilter:['value']})}
    }
  }).observe(mini,{childList:true,subtree:true,attributes:true,attributeFilter:['data-game']});
  const celebration=document.createElement('div');celebration.className='ending-celebration';
  celebration.innerHTML='<h2>第一張素描，故事才剛開始</h2><div class="celebration-cast"></div>';
  const cast=[['kaixiang','凱翔'],['siyu','思于'],['xiaotong','曉彤'],['yating','亞廷'],['chenghan','江承翰']];
  for(const[id,name]of cast){const figure=document.createElement('div');figure.className='celebration-character';figure.setAttribute('aria-label',name+'微笑舉起雙手歡呼');figure.innerHTML=`<img class="pose-idle" loading="lazy" src="assets/rpg/ending-${id}-idle.svg" alt=""><img class="pose-cheer" loading="lazy" src="assets/rpg/ending-${id}-cheer.svg" alt="">`;celebration.querySelector('.celebration-cast').append(figure)}
  $('#endingScreen').prepend(celebration);
  const share=document.createElement('button');share.id='shareCelebration';share.textContent='分享歡呼合照';share.onclick=()=>RPGShare.celebration(cast.map(([id])=>`assets/rpg/ending-${id}-cheer.svg`)).catch(()=>{$('#readStatus').textContent='圖片暫時無法產生，請再試一次。'});$('#endingScreen .actions').prepend(share);
})();
