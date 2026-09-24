/* Preserve each supplied animation and isolate exported SVG class names. */
(() => {
 const mascots=[['.member-mega .character-motion','MEGA-quick-ear.svg'],['.member-angela .character-motion','ANGELA-hop.svg']];
 for(const [selector,file] of mascots){
  const button=document.querySelector(selector);if(!button)continue;
  let loading=false,loaded=false;
  async function load(){
   if(loading||loaded)return;loading=true;
   try{
    const response=await fetch('assets/team/'+file);if(!response.ok)throw Error('Mascot unavailable');
    let source=await response.text();if(file==='ANGELA-hop.svg')source=source.replace(/cls-/g,'angela-cls-');
    const parsed=new DOMParser().parseFromString(source,'image/svg+xml');const svg=parsed.documentElement;
    if(svg.localName!=='svg'||parsed.querySelector('parsererror,script,foreignObject'))throw Error('Invalid mascot');
    if(file==='ANGELA-hop.svg')svg.setAttribute('viewBox','-47.5 -90 300 370');
    svg.setAttribute('aria-hidden','true');button.replaceChildren(document.importNode(svg,true));loaded=true;
   }catch{/* Keep the still fallback and retry on interaction. */}finally{loading=false}
  }
  button.addEventListener('pointerenter',load);button.addEventListener('focus',load);button.addEventListener('click',load);
  button.addEventListener('animationiteration',event=>{if(event.animationName==='angela-body'&&!button.classList.contains('looping')){button.classList.remove('playing');button.dataset.motionState='landed'}});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect()}},{rootMargin:'800px'});observer.observe(button)}else load();
 }
})();
