(() => {
  'use strict';
  const $=s=>document.querySelector(s), root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');
  const people={
    siyu:{name:'陳思于',roman:'SI-YU CHEN / 01',quote:'哭什麼？能解決問題嗎？',bio:'美術系的行動派。精準排程、濃縮咖啡和貓咪梗圖，都是她的日常。看似冷靜，表情卻常常比本人先說出心事。'},
    kai:{name:'王凱翔',roman:'KAI-XIANG WANG / 02',quote:'好麻煩。',bio:'機械系，喜歡游泳與冰美式。不善言辭的他，卻會注意到那些很小、很小的細節。'},
    yating:{name:'陳亞廷',roman:'YA-TING CHEN / 03',quote:'我的妹妹是全世界最可愛也是最恐怖的。',bio:'思于的哥哥，也是凱翔的室友與好兄弟。讀物理治療系、喜歡健身，還會幫妹妹帶便當。'},
    ruby:{name:'林曉彤',roman:'RUBY LIN / 04',quote:'不要試著對我說謊，你會失敗。',bio:'雕塑系，思于的閨蜜兼吐槽擔當。擅長把什麼都拍成梗圖，更擅長看穿朋友的心事。'}
  };
  function biography(id){
    const p=people[id];$('#portrait').dataset.person=id;$('#portraitNumber').textContent=p.roman.slice(-2);
    const bio=$('#bio');bio.replaceChildren();
    for(const [tag,text,cls] of [['h3',p.name],['p',p.roman,'roman'],['blockquote','「'+p.quote+'」'],['p',p.bio]]){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;bio.append(el)}
    document.querySelectorAll('[data-person].cast-tabs button,.cast-tabs [data-person]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.person===id)));
  }
  document.querySelectorAll('.cast-tabs button').forEach(b=>b.addEventListener('click',()=>biography(b.dataset.person)));biography('siyu');
  let lowMotion=reduced.matches;
  function motion(value){lowMotion=value;root.classList.toggle('low-motion',value);$('#motion').setAttribute('aria-pressed',String(value));$('#motion').textContent=value?'動態已減少':'減少動態';if(value)completeLine()}
  $('#motion').addEventListener('click',()=>motion(!lowMotion));reduced.addEventListener('change',e=>motion(e.matches));
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  let frame=0;
  function paint(){frame=0;const box=$('.opening').getBoundingClientRect();root.style.setProperty('--scroll',Math.max(0,Math.min(1,-box.top/innerHeight)))}
  addEventListener('scroll',()=>{if(!frame&&!lowMotion)frame=requestAnimationFrame(paint)},{passive:true});
  const observations={pencil:'鉛筆的筆尖磨得很細。她似乎連最小的線條，也不想錯過。',coffee:'空了的咖啡杯，旁邊還留著趕稿的痕跡。思于需要咖啡。',schedule:'課表上留著泳隊練習的時間。原來安靜的他，也有自己的節奏。'};
  let state, timer=0, fullLine='';
  function completeLine(){clearTimeout(timer);timer=0;$('#line').textContent=fullLine;$('#finishLine').hidden=true}
  function typeLine(text){clearTimeout(timer);fullLine=text;$('#line').textContent=text;$('#finishLine').hidden=true;
    // Keep the accessible line complete; animate a separate visual layer only.
    if(lowMotion)return;
    const spoken=document.createElement('span');spoken.className='sr-only';spoken.textContent=text;
    const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');$('#line').replaceChildren(spoken,visual);
    const chars=[...text];let i=0;$('#finishLine').hidden=false;
    const tick=()=>{visual.textContent=chars.slice(0,++i).join('');if(i<chars.length)timer=setTimeout(tick,26);else completeLine()};tick();
  }
  function say(who,text){$('#speaker').textContent=people[who].name;$('#game').dataset.speaker=who;$('#characterLabel').textContent=people[who].name+' · 立繪預留';state.history.push(people[who].name+'：'+text);typeLine(text)}
  function buttons(items){$('#choices').replaceChildren();items.forEach(item=>{const b=document.createElement('button');b.textContent=item.label;b.addEventListener('click',item.action);$('#choices').append(b)})}
  function showStep(focus=false){
    const steps=[
      {who:'siyu',chapter:'01 · 初次見面',line:'你來得剛好。今天的畫室還少一點靈感。要先看看，還是陪我聊聊？',options:[['先看看你的畫。','observe','siyu','好，那你站這邊。每個人看到的線條都不一樣，我想聽聽你的。'],['先介紹一下自己吧。','connect','siyu','我是陳思于，美術系。至於今天能不能準時收工……可能要看咖啡還剩多少。']]},
      {who:'kai',chapter:'02 · 目光停留',line:'……你好。思于還在準備畫具。你也喜歡畫畫？',options:[['我比較喜歡觀察。','observe','kai','這樣啊。她也是。明明沒說什麼，好像還是會被看出來。'],['要不要先休息一下？','connect','kai',state.seen.has('coffee')?'你也注意到那個空杯子了？……等一下，一起去買咖啡吧。':'嗯。稍微休息一下也好。她畫起來，常常就忘記時間。']]},
      {who:'siyu',chapter:'03 · 留下一筆',line:'好了，今天最後一個問題。如果要替這次相遇留下一筆，你想畫什麼？',options:[['畫下此刻的光線。','observe','siyu','那就趁太陽還沒下山。光線會變，這一刻可不會等我們。'],['畫下剛才的笑容。','connect','kai','……剛才有笑得那麼明顯嗎？那你要畫得像一點。']]}
    ];
    const scene=steps[state.step];$('#chapter').textContent=scene.chapter;$('#progress').textContent=`對話 ${state.step+1} / 3`;say(scene.who,scene.line);
    buttons(scene.options.map(([label,kind,who,response])=>({label,action:()=>{completeLine();state.history.push('你：'+label);state[kind]++;say(who,response);buttons([{label:state.step===2?'收下這次相遇 ↗':'繼續對話 →',action:()=>{completeLine();if(state.step===2)finish();else{state.step++;showStep(true)}}}]);$('#choices button').focus({preventScroll:true})}})));
    if(focus)$('#choices button').focus({preventScroll:true});
  }
  function reset(focus=false){clearTimeout(timer);state={step:0,observe:0,connect:0,seen:new Set(),history:[]};$('#ending').hidden=true;$('#copyStatus').textContent='';$('#objectNote').textContent='先看看畫室裡的三個小物件，也可以直接開始對話。';document.querySelectorAll('[data-object]').forEach(b=>b.setAttribute('aria-pressed','false'));showStep(focus)}
  function finish(){
    state.done=true;$('#chapter').textContent='相遇完成';$('#progress').textContent='3 / 3 · 完成';
    const observerRoute=state.observe>state.connect;
    state.title=observerRoute?'光線的收藏家':'笑容的同謀';
    state.summary=observerRoute?'你把目光留給細節。在畫室的光影裡，一條線、一個停頓，都值得被好好記住。':'你把距離留給對話。一句關心、一個笑容，讓這間畫室比剛才更溫暖了一點。';
    $('#endingTitle').textContent=state.title;$('#endingCopy').textContent=state.summary+' 你發現了 '+state.seen.size+' / 3 個畫室小細節。';$('#ending').hidden=false;
    buttons([{label:'重新相遇 ↺',action:()=>reset(true)}]);$('#ending').focus({preventScroll:true});$('#ending').scrollIntoView({behavior:lowMotion?'instant':'smooth',block:'center'});
  }
  document.querySelectorAll('[data-object]').forEach(b=>b.addEventListener('click',()=>{state.seen.add(b.dataset.object);b.setAttribute('aria-pressed','true');$('#objectNote').textContent=observations[b.dataset.object];if(state.done)$('#endingCopy').textContent=state.summary+' 你發現了 '+state.seen.size+' / 3 個畫室小細節。'}));
  $('#finishLine').addEventListener('click',completeLine);$('#restart').addEventListener('click',()=>reset(true));$('#replay').addEventListener('click',()=>{reset(true);$('#play').scrollIntoView({behavior:lowMotion?'instant':'smooth'})});
  $('#historyOpen').addEventListener('click',()=>{completeLine();$('#historyList').replaceChildren();state.history.forEach(text=>{const li=document.createElement('li');li.textContent=text;$('#historyList').append(li)});$('#history').showModal()});$('#historyClose').addEventListener('click',()=>$('#history').close());
  $('#copyResult').addEventListener('click',async()=>{const text=`《成為我的作品吧！》我的畫室相遇：${state.title}\n${state.summary}`;try{await navigator.clipboard.writeText(text);$('#copyStatus').textContent='相遇卡片已複製，可以貼給朋友。'}catch{$('#copyStatus').textContent='無法自動複製，請選取這段文字：'+text}});
  reset();motion(lowMotion);addEventListener('pagehide',()=>{clearTimeout(timer);cancelAnimationFrame(frame)});
})();
