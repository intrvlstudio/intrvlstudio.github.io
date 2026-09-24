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

  let publicPosts = [], category = 'all';
  const board = document.querySelector('.board-items');
  if (!board) return;
  const empty = board.innerHTML;
  function render() {
    board.replaceChildren();
    publicPosts.filter(post => category === 'all' || post.category === category).forEach(post => board.append(window.INTRVLNews.renderPost(post)));
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
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){refreshPublic();observer.disconnect()}},{rootMargin:'600px'}):null;
  if(observer)observer.observe(board);else refreshPublic();
  setInterval(()=>{if(!document.hidden)refreshPublic()},60000);
})();
