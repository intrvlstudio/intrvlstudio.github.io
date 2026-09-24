(() => {
 const feed=document.querySelector('.instagram-feed');if(!feed)return;
 let started=false;
 function render(urls){feed.replaceChildren();for(const url of urls){
  const frame=document.createElement('iframe');frame.className='instagram-post-frame';frame.src=url+'embed/';frame.title='@intrvl_studio Instagram 貼文';frame.loading='eager';frame.setAttribute('allowfullscreen','');feed.append(frame);
 }}
 async function start(){
  if(started)return;started=true;
  let urls=[...feed.querySelectorAll('[data-instgrm-permalink]')].map(e=>e.dataset.instgrmPermalink);
  try{const response=await fetch('assets/announcements.json',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();const latest=[...new Set((data.posts||[]).map(p=>p.url).filter(url=>/^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/$/.test(url)))].slice(0,2);if(latest.length)urls=latest}catch{/* Preserve the last known post. */}
  render(urls);
 }
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();start()}},{rootMargin:'600px'});observer.observe(feed)}else start();
})();
