(() => {
  const buttons = [...document.querySelectorAll('[data-lang]')];
  function setLanguage(lang) {
    if (!['zh-TW', 'en', 'ko'].includes(lang)) return;
    document.documentElement.lang = lang;
    buttons.forEach(button => {
      const active = button.dataset.lang === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('intrvl_lang', lang); } catch {}
  }
  let language = 'zh-TW';
  try { language = localStorage.getItem('intrvl_lang') || language; } catch {}
  if(!document.documentElement.dataset.singleLanguage)setLanguage(language);
  buttons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  const top = document.getElementById('scrollTop');
  const syncTop = () => top.classList.toggle('visible', scrollY > 600);
  addEventListener('scroll', syncTop, { passive: true });
  syncTop();
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));

  let posts = [], publicPosts = [], category = 'all';
  const board = document.querySelector('.board-items');
  const empty = board.innerHTML;
  function render() {
    board.replaceChildren();
    publicPosts.filter(post => category === 'all' || post.category === category).forEach(post => {
      const article=document.createElement('article');article.className='public-announcement';
      if(/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(post.image||'')){
        const img=new Image();img.src=post.image;img.alt=post.title;img.loading='lazy';article.append(img);
      }
      const heading=document.createElement('h3');heading.textContent=post.title;
      const date=document.createElement('time');date.textContent=post.date;date.dateTime=post.date;
      const body=document.createElement('p');body.textContent=post.body;article.append(date,heading,body);
      if(/^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/$/.test(post.url||'')){
        const link=document.createElement('a');link.href=post.url;link.textContent='Instagram ↗';link.target='_blank';link.rel='noopener noreferrer';article.append(link);
      }
      board.append(article);
    });
    posts.filter(post => category === 'all' || post.category === category).forEach(post => {
      let url;
      try { url = new URL(post.url); } catch { return; }
      if (url.protocol !== 'https:' || url.hostname !== 'www.instagram.com' || !/^\/(p|reel)\/[^/]+\/?$/.test(url.pathname)) return;
      const link = document.createElement('a');
      link.className = 'announcement';
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = (post.title || 'Instagram') + ' ↗';
      board.append(link);
    });
    if (!board.childElementCount) board.innerHTML = empty;
  }
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  }));
  async function refresh() {
    try {
      const response = await fetch('assets/announcements.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      posts = Array.isArray(data.posts) ? data.posts : [];
      render();
    } catch { /* Keep the official account link usable when offline. */ }
  }
  let publicLoading=false;
  async function refreshPublic(){
    if(publicLoading)return;publicLoading=true;
    try{
      const response=await fetch('https://firestore.googleapis.com/v1/projects/intrvl-studio/databases/(default)/documents/publicAnnouncements?pageSize=30&orderBy=createdAt%20desc');
      if(!response.ok)throw Error('Public announcements unavailable');
      const data=await response.json();
      publicPosts=(data.documents||[]).map(doc=>Object.fromEntries(Object.entries(doc.fields||{}).map(([key,value])=>[key,value.stringValue||''])));
      render();
    }catch{ /* Preserve last successful posts and the static Instagram fallback. */ }
    finally{publicLoading=false;}
  }
  refresh();
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){refreshPublic();observer.disconnect()}},{rootMargin:'600px'}):null;
  if(observer)observer.observe(board);else refreshPublic();
  setInterval(()=>{if(!document.hidden)refreshPublic()},60000);
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
