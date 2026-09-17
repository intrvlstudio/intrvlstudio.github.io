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
// Incoming and outgoing visuals move at one speed, without a centered hold.
const featureSetup=source.match(/const featureStarts=.*?;/)[0];
const feature=vm.runInNewContext(featureSetup+';({featureStarts,featureTransition})');
feature.featureStarts.forEach((arrive,i)=>{
  const next=i<2?feature.featureStarts[i+1]-feature.featureTransition:end-starts[4];
  near(next,arrive);
  if(i<2){
    const at=t=>1-Math.max(0,Math.min(1,(t-arrive+feature.featureTransition)/feature.featureTransition))-Math.max(0,Math.min(1,(t-next)/feature.featureTransition));
    const step=.001;
    near((at(arrive)-at(arrive-step))/step,(at(arrive+step)-at(arrive))/step);
  }
});
// The black front starts below the image and ends above it, covering text too.
const exitFn=source.match(/function featureExit\(panel,progress\)\{[\s\S]*?\n  \}/)[0];
const featureExit=vm.runInNewContext('('+exitFn+')');
let edge;
const panel={style:{setProperty:(name,value)=>{edge=parseFloat(value)}}};
featureExit(panel,0);assert(edge-30>=100);
featureExit(panel,.5);near(edge,0);
featureExit(panel,1);assert(edge+30<=0);
// Every section anchor lands on a full panel; final visual is ready for native flow.
starts.forEach((start,i)=>near(i?panelOffset(start,start,i<4?starts[i+1]-transition:null):0,0));
near(panelOffset(end-starts[4],1.95,null),0);
assert(end<10,'Keep the story timeline compact');
assert(!source.includes('easeTimeline'),'Do not add a second easing after native/wheel scroll');
assert(!source.includes('scale(${1+Math.min(t,2)'),'No scroll zoom on the stage logo');
console.log('Connected scroll: shared panel edges, continuous story motion and full gradient coverage, anchor landings and shorter travel verified.');
