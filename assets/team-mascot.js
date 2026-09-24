/* Preserve the supplied SVG animation, loading it only near the team cards. */
(() => {
 const button=document.querySelector('.member-mega .character-motion');if(!button)return;
 let loading=false,loaded=false;
 async function load(){
  if(loading||loaded)return;loading=true;
  try{const response=await fetch('assets/team/MEGA-quick-ear.svg');if(!response.ok)throw Error('Mascot unavailable');
   const documentSvg=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
   const svg=documentSvg.documentElement;if(svg.localName!=='svg'||documentSvg.querySelector('parsererror,script,foreignObject'))throw Error('Invalid mascot');
   button.replaceChildren(document.importNode(svg,true));loaded=true;
  }catch{ /* Keep the original mascot as a visible fallback; user interaction retries. */ }
  finally{loading=false}
 }
 button.addEventListener('pointerenter',load);button.addEventListener('focus',load);button.addEventListener('click',load);
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect()}},{rootMargin:'800px'});observer.observe(button)}else load();
})();
