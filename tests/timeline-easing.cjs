const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/orken-film.js'),'utf8');
const setup=source.match(/const transition=.*?;/)[0];
const fn=source.match(/function panelOffset\(t,arrive,leave\)\{[\s\S]*?\n  \}/)[0];
const api=vm.runInNewContext('const clamp=v=>Math.max(0,Math.min(1,v));'+setup+fn+';({panelOffset,starts,end,transition})');
const {panelOffset,starts,end,transition}=api;
const scaleFn=source.match(/function scrollScale\(width,height\)\{[^\n]+\}/)[0];
const scrollScale=vm.runInNewContext('('+scaleFn+')');
for(const height of [720,1080,1440])assert(transition*height*scrollScale(1920,height)<=273.001);
assert(transition*844*scrollScale(390,844)<365);
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
// The top of each incoming section is always exactly the previous bottom.
for(let i=1;i<starts.length;i++){
  for(let step=0;step<=100;step++){
    const t=starts[i]-transition+transition*step/100;
    const outgoing=i===1?-Math.max(0,Math.min(1,t/transition)):panelOffset(t,starts[i-1],starts[i]-transition);
    const incoming=panelOffset(t,starts[i],i<4?starts[i+1]-transition:null);
    near(outgoing+1,incoming);
    assert(incoming>=-1e-9&&incoming<=1+1e-9);
  }
}
// Story A/B/C also push each other with the same shared edge.
for(let i=0;i<3;i++){
  const arrive=(i+1)*transition;
  for(let step=0;step<=100;step++){
    const t=arrive-transition+transition*step/100;
    const outgoing=i===0?-Math.max(0,Math.min(1,t/transition)):panelOffset(t,i*transition,i*transition);
    near(outgoing+1,panelOffset(t,arrive,i<2?arrive:null));
  }
}
// Every section anchor lands on a full panel; final visual is ready for native flow.
starts.forEach((start,i)=>near(i?panelOffset(start,start,i<4?starts[i+1]-transition:null):0,0));
near(panelOffset(end-starts[4],1.95,null),0);
assert(end<8,'The longer work reel should still avoid the old 25-screen timeline');
assert(!source.includes('easeTimeline'),'Do not add a second easing after native/wheel scroll');
assert(!source.includes('scale(${1+Math.min(t,2)'),'No scroll zoom on the stage logo');
console.log('Connected scroll: shared panel edges, story pushes, anchor landings and shorter travel verified.');
