// Progressive enhancement: official account links remain usable if embeds are blocked.
(() => {
 const board=document.querySelector('.board-items');if(!board)return;
 function enhance(){board.querySelectorAll('a.announcement:not([data-embed-ready])').forEach(link=>{
  link.dataset.embedReady='true';let url;try{url=new URL(link.href)}catch{return}
  if(url.origin!=='https://www.instagram.com'||!/^\/(p|reel)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))return;
  const button=document.createElement('button');button.className='instagram-load';button.textContent=({'zh-TW':'顯示貼文',en:'Show post',ko:'게시물 보기'})[document.documentElement.lang]||'顯示貼文';link.after(button);
  button.addEventListener('click',()=>{const quote=document.createElement('blockquote');quote.className='instagram-media';quote.dataset.instgrmPermalink=url.origin+url.pathname;quote.dataset.instgrmVersion='14';const fallback=link.cloneNode(true);fallback.className='';quote.append(fallback);button.replaceWith(quote);
   if(window.instgrm?.Embeds){window.instgrm.Embeds.process();return}
   if(document.getElementById('instagram-embed-script'))return;
   const script=document.createElement('script');script.id='instagram-embed-script';script.src='https://www.instagram.com/embed.js';script.async=true;script.onload=()=>window.instgrm?.Embeds?.process();document.body.append(script);
  },{once:true});
 })}
 new MutationObserver(enhance).observe(board,{childList:true});enhance();
})();
