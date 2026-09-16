(() => {
  history.scrollRestoration='manual';
  const reloaded=performance.getEntriesByType('navigation')[0]?.type==='reload';
  if(reloaded){history.replaceState(null,'','#top');scrollTo({top:0,behavior:'instant'})}
  const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const shots=['.cover','.works','.about','.numbers','.story-scene'].map(s=>document.querySelector(s));
  const starts=[0,1.6,8.6,12.4,15.2], end=25.2;
  const stops=[0,2.1,10.3,14.45,16.8];
  const featureStarts=[3.4,5.65,7.6];
  const cards=[...document.querySelectorAll('.works .work')];
  const runway=document.createElement('div'), stage=document.createElement('div');
  runway.className='film-runway';stage.className='film-stage';shots[0].before(runway);runway.append(stage);
  shots.forEach(s=>{s.classList.add('film-shot');stage.append(s)});
  const words=(zh,en,ko)=>`<span class="lang-zh">${zh}</span><span class="lang-en">${en}</span><span class="lang-ko">${ko}</span>`;
  const controls=document.createElement('div');controls.className='film-controls';
  controls.innerHTML=`<div class="film-chapters">${[['開場','Intro','시작'],['作品','Stories','작품'],['之間','Studio','소개'],['足跡','Numbers','기록'],['故事','Feature','이야기']].map((a,i)=>`<button data-chapter="${i}">${String(i+1).padStart(2,'0')} ${words(...a)}</button>`).join('')}</div><input class="film-progress" type="range" min="0" max="2520" step="1" value="0" aria-label="故事播放進度 / Story timeline" aria-orientation="vertical"><div class="film-controls-right"><span class="film-position">0%</span><button class="film-mode">${words('閱讀模式','Reading mode','읽기 모드')}</button></div>`;
  document.body.append(controls);
  const timelineToggle=document.createElement('button');timelineToggle.className='timeline-toggle';timelineToggle.innerHTML=words('故事軸 ＋','Timeline +','타임라인 +');timelineToggle.setAttribute('aria-expanded','false');controls.prepend(timelineToggle);
  const hiringShortcut=document.createElement('button');hiringShortcut.className='timeline-hiring';hiringShortcut.innerHTML=words('人才招募 ↗','Join us ↗','채용 ↗');controls.append(hiringShortcut);
  const timelineItems=[...controls.children].filter(el=>el!==timelineToggle);let pinned=false;
  function expandTimeline(open){controls.classList.toggle('is-expanded',open);timelineToggle.setAttribute('aria-expanded',String(open));timelineItems.forEach(el=>{el.inert=!open})}
  timelineToggle.addEventListener('click',()=>{pinned=!pinned;expandTimeline(pinned)});
  controls.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')expandTimeline(true)});
  controls.addEventListener('pointerleave',()=>{if(!pinned)expandTimeline(false)});
  controls.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=false;expandTimeline(false);timelineToggle.focus()}});
  document.addEventListener('pointerdown',e=>{if(!controls.contains(e.target)){pinned=false;expandTimeline(false)}});
  hiringShortcut.addEventListener('click',()=>{go(document.querySelector('.hiring'));pinned=false;expandTimeline(false)});expandTimeline(false);
  const range=controls.querySelector('input'), mode=controls.querySelector('.film-mode');
  const clamp=v=>Math.max(0,Math.min(1,v)), smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const more=document.querySelector('.more-works'), collage=[...document.querySelectorAll('.studio-blocks>div')], copy=document.querySelector('.about-grid');
  const intro=document.querySelector('.feature-intro'), visuals=[...document.querySelectorAll('.feature-visual')];
  const values=[...document.querySelectorAll('.numbers-value')], footer=document.querySelector('.footer'), topButton=document.querySelector('.scroll-top');
  const backdrop=document.querySelector('.reel-backdrop');
  const mesh=document.createElement('div');mesh.className='work-mesh';mesh.setAttribute('aria-hidden','true');
  const tiles=Array.from({length:48},(_,i)=>{const tile=document.createElement('i');tile.style.setProperty('--tile-order',i);mesh.append(tile);return tile});backdrop.append(mesh);
  const backgrounds=cards.map((card,i)=>{
    const layer=document.createElement('div');layer.className='work-background';layer.dataset.work=new URL(card.href).searchParams.get('id');layer.style.setProperty('--background-index',i);
    const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.tabIndex=-1;video.setAttribute('aria-hidden','true');
    video.addEventListener('timeupdate',()=>{if(video.currentTime>=3)video.currentTime=0});
    layer.append(video);backdrop.append(layer);return {layer,video};
  });
  fetch('assets/work-backgrounds.json').then(response=>response.ok?response.json():[]).then(items=>{
    for(const item of items){
      const slot=backgrounds.find(({layer})=>layer.dataset.work===item.id);if(!slot||!item.src)continue;
      const url=new URL(item.src,location.href);
      if(url.origin!==location.origin||!(/\.(mp4|webm)$/i).test(url.pathname))continue;
      if(item.poster){const poster=new URL(item.poster,location.href);if(poster.origin===location.origin){slot.video.poster=poster.href;slot.layer.style.background=`center / cover url("${poster.href}")`}}
      slot.video.addEventListener('error',()=>{slot.video.hidden=true});
      slot.video.src=url.href;
    }
    schedule();
  }).catch(()=>{});
  function paintBackgrounds(local){
    backgrounds.forEach(({layer,video},i)=>{
      const enter=i===0?1:smooth((local-(i*1.24-.72))/.22);
      const exit=i===4?1:1-smooth((local-(i*1.24+.50))/.22);
      const opacity=enter*exit*(1-smooth((local-5.6)/.65)*.65);
      layer.style.opacity=opacity;
      const playing=current===1&&opacity>.001&&!reading&&!document.hidden&&!reduced.matches;
      if(playing&&video.getAttribute('src')&&video.paused&&!video.dataset.playPending&&!video.dataset.playBlocked){
        video.dataset.playPending='true';video.play().catch(()=>{video.dataset.playBlocked='true'}).finally(()=>{delete video.dataset.playPending;if(reading||current!==1||document.hidden||reduced.matches||Number(layer.style.opacity)<=.001)video.pause()});
      }else if(!playing)video.pause();
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)backgrounds.forEach(({video})=>video.pause());else schedule()});
  const animated=new Set();
  function pose(el,y=0,opacity=1,extra=''){animated.add(el);el.style.transform=`translate3d(0,${y}px,0) ${extra}`;el.style.opacity=opacity;}
  function split(selector){return [...document.querySelectorAll(selector+' > span')].map(parent=>{
    const label=parent.textContent;parent.setAttribute('aria-label',label);parent.textContent='';
    return [...label].map((letter,i)=>{const el=document.createElement('span');el.className='motion-letter';el.textContent=letter===' '?'\u00a0':letter;el.setAttribute('aria-hidden','true');parent.append(el);return {el,delay:((i*7+3)%11)/11,travel:120+((i*53)%190)};});
  });}
  const aboutLetters=split('.about-title'), featureLetters=split('.feature-title');
  function letters(groups,t){groups.flat().forEach(({el,delay,travel})=>{const p=smooth((t-delay*.7)/.7);pose(el,(1-p)*travel,p)})}
  const confetti=document.createElement('div');confetti.className='milestone-confetti';confetti.setAttribute('aria-hidden','true');values[1].append(confetti);
  let burstPlayed=false;
  function burst(anchor=values[1]){
    if(reduced.matches)return;
    const host=anchor===values[1]?confetti:confetti.cloneNode(false);
    if(host!==confetti){anchor.append(host);setTimeout(()=>host.remove(),1900)}
    host.replaceChildren();
    const colors=['#ff9142','#89d9ef','#fbd852','#ec7a9e','#b7d88d'];
    for(let i=0;i<28;i++){
      const bit=document.createElement('i');
      const spread=Math.min(95,innerWidth*.2),vx=(Math.random()-.5)*spread*2;
      const lift=65+Math.random()*95,gravity=45+Math.random()*45;
      const spin=(Math.random()-.5)*650,drift=(Math.random()-.5)*18;
      bit.style.cssText='width:'+(2+Math.random()*2)+'px;height:'+(3+Math.random()*3)+'px;background:'+colors[i%colors.length]+';border-radius:'+(i%4===0?'50%':'1px');
      host.append(bit);
      const frames=Array.from({length:19},(_,j)=>{const t=j/18;return {transform:'translate3d('+(vx*t+drift*Math.sin(t*Math.PI*2))+'px,'+(-lift*t+gravity*t*t)+'px,0) rotate('+(spin*t)+'deg) scaleX('+(Math.cos(t*Math.PI*3+i)*.65)+')',opacity:t<.12?t/.12:Math.min(1,(1-t)/.3)}});
      bit.animate(frames,{duration:950+Math.random()*650,delay:Math.random()*110,fill:'both',easing:'linear'}).finished.then(()=>bit.remove()).catch(()=>bit.remove());
    }
  }
  function count(p){values[0].textContent=Math.round(200*p)+'+';values[1].querySelector('.lang-zh').textContent=Math.round(2800*p).toLocaleString('en-US')+'萬';values[1].querySelector('.lang-en').textContent=(28*p).toFixed(p===1?0:1)+'M';values[1].querySelector('.lang-ko').textContent=Math.round(2800*p).toLocaleString('en-US')+'만';values[2].textContent=Math.round(2*p)+'×';values[3].textContent=Math.round(4*p);}
  let reading=reduced.matches, unit=innerHeight, current=0, pending=false;
  function position(){return clamp(-runway.getBoundingClientRect().top/(unit*end))*end}
  function updateLogoShadow(){
    const logo=document.querySelector('.emblem-menu');
    const y=logo.getBoundingClientRect().top+logo.offsetHeight/2;
    const contact=document.querySelector('.contact').getBoundingClientRect();
    const team=document.querySelector('.team').getBoundingClientRect();
    const white=(y>=contact.top&&y<contact.bottom)||(y>=team.top&&y<team.top+team.height*.02);
    logo.classList.toggle('on-white',white);
  }
  function paint(){pending=false;updateLogoShadow();document.body.classList.toggle("past-film",runway.getBoundingClientRect().bottom<100);topButton.classList.toggle('on-footer',footer.getBoundingClientRect().top<topButton.getBoundingClientRect().bottom);
    if(reading)return;
    const t=position();current=starts.reduce((last,start,i)=>t>=start?i:last,0);
    shots.forEach((shot,i)=>{const enter=i?smooth((t-starts[i])/.5):1, exit=i<4?smooth((t-starts[i+1])/.5):0;const opacity=enter*(1-exit);pose(shot,(1-enter)*innerHeight*.25-exit*innerHeight*.25,opacity);shot.classList.toggle('is-visible',opacity>.001);shot.classList.toggle('is-current',i===current);shot.inert=i!==current;shot.setAttribute('aria-hidden',String(i!==current));});
    pose(document.querySelector('.cover-title'),-t*12,1,`scale(${1+Math.min(t,2)*.055})`);
    const local=t-starts[1]-.5;
    paintBackgrounds(local);
    // Hold each card at the reading position, then cross the transition threshold.
    const cardTravel=innerWidth*.65+cards[0].offsetWidth/2;
    cards.forEach((card,i)=>{
      const phase=local-i*1.24;
      const enter=smooth((phase+.72)/.22),exit=smooth((phase-.50)/.22);
      const opacity=enter*(1-exit);
      const visible=opacity>.001;
      const x=(1-enter-exit)*cardTravel;
      card.style.transform=`translate3d(calc(-50% + ${x}px),-50%,0)`;
      card.style.opacity=opacity;
      card.classList.toggle('is-visible',visible);
      card.classList.toggle('is-current',visible);
      card.inert=!visible;card.setAttribute('aria-hidden',String(!visible));
    });
    tiles.forEach((tile,i)=>{const delay=((i%8)+Math.floor(i/8))*.018;const orange=smooth((local-5.38-delay)/.3),black=smooth((local-5.7-delay)/.3);tile.style.backgroundColor=black>0?`rgb(${Math.round(255*(1-black))} ${Math.round(145*(1-black))} ${Math.round(66*(1-black))})`:`rgba(255,145,66,${orange})`;tile.style.transform=`perspective(600px) rotateY(${orange>0&&orange<1?(1-orange)*90:black>0&&black<1?(1-black)*90:0}deg)`;tile.style.backgroundImage=black===1?'none':'';tile.style.borderColor=`rgba(255,255,255,${.18*(1-black)})`});
    const mp=smooth((local-6.1)/.3);pose(more,(1-mp)*80,mp);more.inert=mp<.7;
    const a=t-starts[2];letters(aboutLetters,a-.25);collage.forEach((el,i)=>{const p=smooth((a-1.15-i*.4)/.65);pose(el,(1-p)*(250+i*60),p,`rotate(${(1-p)*(i%2?12:-9)}deg)`)});const cp=smooth((a-2.65)/.7);pose(copy,(1-cp)*100,cp);shots[2].style.setProperty("--copy-progress",cp);
    const n=smooth((t-starts[3]-.3)/1.7);count(n);if(current===3&&n===1&&!burstPlayed){burstPlayed=true;burst()}if(n<.75)burstPlayed=false;if(n<1||current!==3)confetti.replaceChildren();
    const f=t-starts[4];letters(featureLetters,f-.1);
    const dock=smooth((f-1.65)/1);intro.style.setProperty('--title-dock',dock);
    const push=smooth((f-featureStarts[0])/.9);
    pose(intro,-push*innerHeight,1);
    const reveal=smooth((f-1.2)/1.1);
    pose(document.querySelector('.plane-front'),(1-reveal)*innerHeight*.7,reveal);pose(document.querySelector('.plane-back'),(1-reveal)*100,reveal,`scale(${1.14-reveal*.14})`);
    visuals.forEach((visual,i)=>{const vstart=featureStarts[i], enter=smooth((f-vstart)/.9), exit=i<2?smooth((f-featureStarts[i+1])/.9):0;pose(visual,i===0?(1-enter)*innerHeight:0,i===0?1-exit:enter*(1-exit));visual.inert=enter<.8||exit>.2;const text=smooth((f-vstart-.8)/.85);pose(visual.querySelector('p'),i===2?0:(1-text)*80-exit*90,text,i===2?`scale(${.5+text*.5})`:'');});
    range.value=Math.round(t*100);controls.querySelector('.film-position').textContent=Math.round(t/end*100)+'%';controls.querySelectorAll('[data-chapter]').forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));controls.hidden=runway.getBoundingClientRect().bottom<innerHeight*.35;
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(paint)}}
  let snapTimer;
  function queueCardSnap(){clearTimeout(snapTimer);snapTimer=setTimeout(()=>{if(reading||reduced.matches||current!==1)return;const local=position()-2.1;if(local<-.2||local>5.6)return;const index=Math.max(0,Math.min(4,Math.floor((local+.74)/1.24)));const target=2.1+index*1.24;if(Math.abs(position()-target)>.03)seek(target,'smooth')},160)}
  addEventListener('wheel',queueCardSnap,{passive:true});addEventListener('touchend',queueCardSnap,{passive:true});
  function seek(t,behavior='instant'){window.scrollTo({top:scrollY+runway.getBoundingClientRect().top+unit*t,behavior:reduced.matches?'instant':behavior});if(behavior==='instant'||reduced.matches)paint()}
  function go(target,behavior='smooth'){const i=shots.indexOf(target);if(!reading&&i>=0)seek(stops[i],behavior);else target.scrollIntoView({behavior:reduced.matches?'instant':behavior})}
  function resize(){const t=position(),box=runway.getBoundingClientRect(),preserve=!reading&&box.top<0&&box.bottom>=innerHeight;unit=innerHeight;runway.style.setProperty('--film-length',`${(end+1)*unit}px`);if(preserve)seek(t);schedule()}
  function setMode(value){backgrounds.forEach(({video})=>video.pause());confetti.replaceChildren();const saved=current;reading=value;root.classList.toggle('film-enabled',!reading);root.classList.toggle('film-reading',reading);mode.innerHTML=reading?words('滾動演出','Scroll mode','스크롤 모드'):words('閱讀模式','Reading mode','읽기 모드');controls.hidden=false;[...animated,...cards].forEach(el=>{el.style.transform='';el.style.opacity=''});[...shots,...cards,...visuals,more].forEach(el=>{el.inert=false;el.removeAttribute('aria-hidden')});if(reading){count(1);shots[saved].scrollIntoView({behavior:'instant'})}else{unit=innerHeight;runway.style.setProperty('--film-length',`${(end+1)*unit}px`);seek(starts[saved]+(saved?.65:0))}}
  mode.addEventListener('click',()=>setMode(!reading));reduced.addEventListener('change',()=>setMode(reduced.matches));range.addEventListener('input',()=>seek(Number(range.value)/100));controls.querySelectorAll('[data-chapter]').forEach((b,i)=>b.addEventListener('click',()=>{if(i===3){burstPlayed=false;burst(b)}go(shots[i]);schedule()}));addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);
  const menu=document.getElementById('chapter-menu'), opener=document.querySelector('.menu-open');
  opener.addEventListener('click',()=>{if(opener.classList.contains('splitting'))return;opener.classList.add('splitting');setTimeout(()=>{menu.showModal();document.body.classList.add('menu-visible');opener.classList.remove('splitting')},reduced.matches?0:280)});
  function closeMenu(){if(!menu.open||menu.classList.contains('closing'))return;menu.classList.add('closing');setTimeout(()=>{menu.close();menu.classList.remove('closing')},reduced.matches?0:420)}
  document.querySelector('.menu-close').addEventListener('click',closeMenu);menu.addEventListener('cancel',event=>{event.preventDefault();closeMenu()});menu.addEventListener('close',()=>document.body.classList.remove('menu-visible'));
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{const target=document.getElementById(link.getAttribute('href').slice(1));if(!target)return;event.preventDefault();if(menu.open)closeMenu();go(target);history.replaceState(null,'',link.getAttribute('href'));if(menu.contains(link)){target.tabIndex=-1;setTimeout(()=>target.focus({preventScroll:true}),450)}}));
  const heroArt=document.querySelector('.hero-art');
  function resetHero(){heroArt.style.setProperty('--hero-x','0px');heroArt.style.setProperty('--hero-y','0px')}
  shots[0].addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;const box=shots[0].getBoundingClientRect();heroArt.style.setProperty('--hero-x',((e.clientX-box.left)/box.width-.5)*32+'px');heroArt.style.setProperty('--hero-y',((e.clientY-box.top)/box.height-.5)*22+'px')});
  shots[0].addEventListener('pointerleave',resetHero);reduced.addEventListener('change',resetHero);
  document.querySelectorAll('.glitch-mark').forEach(mark=>{mark.append(mark.firstElementChild.cloneNode(true),mark.firstElementChild.cloneNode(true))});
  document.querySelectorAll('.character-motion').forEach(button=>{
    button.removeAttribute('aria-pressed');
    const reset=()=>{button.classList.remove('playing','looping');button.dataset.motionState='idle'};
    const play=()=>{if(reduced.matches||button.classList.contains('playing'))return;button.classList.add('playing');button.dataset.motionState='playing'};
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!reduced.matches){button.classList.add('looping');play()}});
    button.addEventListener('pointerleave',reset);
    button.addEventListener('focus',play);button.addEventListener('blur',reset);
    button.addEventListener('click',play);
    button.addEventListener('animationend',event=>{if(!button.classList.contains('looping')&&['jump','bird-bird','piann-tail2','day18-rest'].includes(event.animationName)){reset();button.dataset.motionState='landed'}});
    reduced.addEventListener('change',reset);reset();
  });
  document.querySelector('.scene-pause').hidden=true;
  root.classList.add(reading?'film-reading':'film-enabled');resize();if(reading)count(1);else paint();
  const restore=()=>{const target=document.getElementById(location.hash.slice(1));if(target)go(target,'instant')};requestAnimationFrame(restore);addEventListener('load',()=>requestAnimationFrame(restore),{once:true});addEventListener('hashchange',restore);
})();

