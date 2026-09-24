/* Run with Node + Playwright. The detached DOM is parsed without loading the site. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const template=fs.readFileSync(path.join(__dirname,'home.template.html'),'utf8');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage();
  for(const lang of ['zh-TW','en','ko']) {
   const html=await page.evaluate(({template,lang})=>{
    const doc=new DOMParser().parseFromString(template,'text/html');
    const pick=(zh,en,ko)=>({'zh-TW':zh,en,ko})[lang];
    const suffix=pick('zh','en','ko');
    doc.documentElement.lang=lang;doc.documentElement.dataset.singleLanguage='true';
    doc.querySelectorAll('.lang-zh,.lang-en,.lang-ko').forEach(el=>{if(!el.classList.contains('lang-'+suffix))el.remove()});
    const title=pick('之間工作室 INTRVL Studio｜200+ 話持續週更的台灣漫畫團隊','INTRVL Studio | Taiwan Webtoon Studio, 200+ Episodes','INTRVL Studio | 200화 이상 매주 연재하는 대만 웹툰 스튜디오');
    const desc=pick('之間工作室 INTRVL Studio，來自台灣的漫畫製作團隊。累積 200+ 話連載、每週穩定更新，歡迎出版、品牌 IP 與企業合作。','A Taiwan-based webtoon studio with 200+ published episodes and uninterrupted weekly releases. Explore our stories and publishing, brand IP and business partnerships.','누적 200화 이상, 매주 꾸준히 연재하는 대만 웹툰 제작팀 INTRVL Studio. 작품과 출판, 브랜드 IP 및 기업 협업을 만나보세요.');
    const file=pick('index.html','index-en.html','index-ko.html');
    const url='https://intrvlstudio.github.io/'+(lang==='zh-TW'?'':file);
    const meta=(kind,name,content)=>{let el=doc.querySelector(`meta[${kind}="${name}"]`);if(!el){el=doc.createElement('meta');el.setAttribute(kind,name);doc.head.append(el)}el.content=content};
    doc.title=title;meta('name','description',desc);meta('property','og:title',title);meta('property','og:description',desc);meta('property','og:url',url);meta('property','og:locale',pick('zh_TW','en_US','ko_KR'));meta('name','twitter:title',title);meta('name','twitter:description',desc);
    const imageAlt=pick('INTRVL 之間工作室標誌','INTRVL Studio logo','INTRVL Studio 로고');
    meta('property','og:image:alt',imageAlt);meta('name','twitter:image:alt',imageAlt);
    const canonical=doc.createElement('link');canonical.rel='canonical';canonical.href=url;doc.head.append(canonical);
    for(const [locale,name] of [['zh-TW',''],['en','index-en.html'],['ko','index-ko.html'],['x-default','']]){const link=doc.createElement('link');link.rel='alternate';link.hreflang=locale;link.href='https://intrvlstudio.github.io/'+name;doc.head.append(link)}
    const nav=doc.querySelector('.lang-toggle');nav.replaceChildren();nav.setAttribute('aria-label',pick('選擇語言','Choose language','언어 선택'));
    for(const [locale,name,label] of [['zh-TW','index.html','中文'],['en','index-en.html','EN'],['ko','index-ko.html','한국어']]){const a=doc.createElement('a');a.href=name;a.hreflang=locale;a.lang=locale;a.textContent=label;if(locale===lang)a.setAttribute('aria-current','page');nav.append(a)}
    const labels=[['.skip-link','跳至作品','Skip to stories','작품으로 건너뛰기','text'],['.menu-open','開啟選單','Open menu','메뉴 열기'],['#chapter-menu','章節目錄','Chapter menu','메뉴'],['.menu-close','關閉目錄','Close menu','메뉴 닫기'],['.works,.works-grid','作品','Stories','작품'],['#feature','主打故事','Featured story','추천 이야기'],['.board-filter','公告分類','Announcement categories','소식 분류'],['#scrollTop','回到頂端','Back to top','맨 위로'],['.activity-board>.eyebrow','工作室公告 / INSTAGRAM','STUDIO BULLETIN / INSTAGRAM','스튜디오 소식 / INSTAGRAM','text'],['.menu-head>span','章節目錄','CHAPTERS','메뉴','text']];
    for(const [sel,zh,en,ko,type] of labels)doc.querySelectorAll(sel).forEach(el=>type==='text'?el.textContent=pick(zh,en,ko):el.setAttribute('aria-label',pick(zh,en,ko)));
    const works=[['扒進你心裡','Steal Your Heart','너의 마음을 훔치다','2026 · 執著死板攻 × 輕浮扒手受','2026 · A rigid pursuer × a carefree pickpocket','2026 · 고지식한 추격자 × 자유분방한 소매치기'],['外送夥伴即將抵達','Delivery Partner Is on the Way','배달 파트너가 곧 도착합니다','2025 · 衷心乖狗攻 × 網黃無助受','2025 · A devoted sweetheart × a vulnerable adult creator','2025 · 헌신적인 순정남 × 위태로운 성인 크리에이터'],['我的室友帥哥學長','My Handsome Roommate','잘생긴 선배 룸메이트','2021 · 創傷包袱攻 × 陽光療癒受','2021 · A troubled past × a healing presence','2021 · 상처를 품은 마음 × 따뜻한 위로'],['窺 PRY','PRY','엿보다 PRY','2023 · 禁慾老男攻 × 受虐騷氣受','2023 · A restrained older man × a provocative partner','2023 · 절제하는 연상 × 도발적인 연인'],['就要弄死你',"I’m Going to Kill You",'너를 죽여줄게',null,null,null]];
    doc.querySelectorAll('.works .work').forEach((el,i)=>{const w=works[i];if(!w)return;const title=pick(...w.slice(0,3));el.querySelector('.work-caption>span').textContent=title;el.setAttribute('aria-label',title+' — '+pick('作品介紹','Story details','작품 소개'));el.querySelector('img').alt=title;const year=el.querySelector('.work-year');if(w[3])year.textContent=pick(...w.slice(3));else if(lang!=='zh-TW')year.textContent=pick('', 'A collaboration with JIANRAN','JIANRAN과의 협업 작품')});
    doc.querySelectorAll('.character-motion').forEach(el=>{const name=el.closest('.member').querySelector('.member-name')?.textContent.trim()||'INTRVL';el.setAttribute('aria-label',pick(`播放 ${name} 角色動畫`,`Play ${name} animation`,`${name} 애니메이션 재생`));el.querySelectorAll('svg[aria-label]').forEach(svg=>{svg.removeAttribute('aria-label');svg.setAttribute('aria-hidden','true')})});
    const proof=pick('200+ 話不斷更。從腳本、作畫到交稿，以穩定的每週連載節奏，讓出版與品牌合作放心推進。','200+ episodes, without interruption. A dependable weekly production rhythm—from scripts and artwork to delivery—supports our publishing and brand partnerships.','200화 이상, 중단 없는 연재. 각본과 작화부터 납품까지 꾸준한 주간 제작 리듬으로 출판과 브랜드 협업을 이어갑니다.');
    for(const sel of ['.about-grid','.partnership']){const block=doc.querySelector(sel);if(block){const p=doc.createElement('p');p.className='capacity-proof';p.textContent=proof;block.append(p)}}
    const game=doc.querySelector('#latest-story-cta');game?.classList.add('game-entry');
    doc.querySelectorAll('.footer-bottom>div:first-child span').forEach(el=>{el.innerHTML=el.innerHTML.replace('© 2025','© <span data-copyright-year>2025–2026</span>')});
    doc.querySelectorAll('script[src]').forEach(s=>{if(/interval-ui|orken-film|instagram-posts/.test(s.src))s.setAttribute('src',s.getAttribute('src').split('?')[0]+'?v=20260924-newslink')});
    const script=doc.createElement('script');script.src='assets/home-language.js?v=20260920';script.defer=true;doc.body.append(script);
    const css=doc.createElement('link');css.rel='stylesheet';css.href='assets/site-optimization.css?v=20260920';doc.head.append(css);
    return '<!DOCTYPE html>\n'+doc.documentElement.outerHTML;
   },{template,lang});
   fs.writeFileSync(path.join(root,lang==='zh-TW'?'index.html':`index-${lang}.html`),html.replace(/[\t ]+$/gm,'')+'\n');
  }
 }finally{await browser.close()}
 console.log('Built three single-language homepages.');
})().catch(e=>{console.error(e);process.exitCode=1});
