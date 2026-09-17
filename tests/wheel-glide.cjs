const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/orken-film.js'),'utf8');
const block=source.slice(source.indexOf('  const wheelGlide='),source.indexOf('  function updateLogoShadow'));
const listeners={};
const context={
  Element:class {},root:{scrollHeight:10000},innerHeight:1000,scrollY:1000,
  reading:false,reduced:{matches:false},schedule(){},
  getComputedStyle:()=>({overflowY:'visible'}),
  addEventListener:(name,fn)=>{listeners[name]=fn},
  document:{body:{},querySelector:()=>null,addEventListener:(name,fn)=>{listeners[name]=fn}},
};
context.scrollTo=({top})=>{context.scrollY=top};
vm.createContext(context);
vm.runInContext(block+'\nthis.api={wheelGlide,tickWheel,stopWheel,easeWheel,wheelDestination};',context);
const {wheelGlide,tickWheel,stopWheel,easeWheel,wheelDestination}=context.api;
function wheel(deltaY,options={}){
  let prevented=false;
  listeners.wheel({deltaY,deltaX:0,deltaMode:0,cancelable:true,preventDefault(){prevented=true},...options});
  return prevented;
}
// A wheel gesture moves the actual page and keeps travelling after input ends.
assert(wheel(400));
assert.equal(wheelGlide.target,1480);
tickWheel(16);
const first=context.scrollY;
tickWheel(66);tickWheel(116);
assert(context.scrollY>first);
assert(wheelGlide.target-context.scrollY>300);
let last=context.scrollY;
for(let t=132;t<3000;t+=16){tickWheel(t);assert(context.scrollY>=last&&context.scrollY<=1480);last=context.scrollY}
assert.equal(context.scrollY,1480);assert.equal(wheelGlide.active,false);
// Opposite input immediately discards the unfinished forward glide.
wheel(400);tickWheel(3016);
const beforeReverse=context.scrollY;
wheel(-100);tickWheel(3032);
assert(context.scrollY<beforeReverse);
// Repeated large inputs stay bounded, and document edges never overshoot.
assert.equal(wheelDestination(1000,2000,9000,1000,9000),2500);
assert.equal(wheelDestination(8900,8900,900,1000,9000),9000);
assert.equal(wheelDestination(50,50,-900,1000,9000),0);
// High refresh displays cover the same distance in the same time.
const run=hz=>{let value=0;for(let i=0;i<hz/2;i++)value=easeWheel(value,500,1000/hz);return value};
assert(Math.abs(run(60)-run(120))<1e-9);
// Touch, keyboard and menu interaction hand control back immediately.
for(const action of [()=>listeners.touchstart(),()=>listeners.pointerdown(),()=>listeners.keydown({key:'PageDown'}),()=>listeners.blur()]){
  wheel(100);action();assert.equal(wheelGlide.active,false);
}
assert.equal(wheel(100,{ctrlKey:true}),false);
assert.equal(wheel(100,{deltaX:200}),false);
context.reduced.matches=true;assert.equal(wheel(100),false);
context.reduced.matches=false;context.reading=true;assert.equal(wheel(100),false);
context.reading=false;
context.document.querySelector=()=>({open:true});assert.equal(wheel(100),false);
context.document.querySelector=()=>null;
context.getComputedStyle=()=>({overflowY:'hidden'});assert.equal(wheel(100),false);
context.getComputedStyle=()=>({overflowY:'visible'});
stopWheel();const start=context.scrollY;wheel(3,{deltaMode:1});assert.equal(wheelGlide.target,start+57.6);
console.log('Wheel glide: continued page motion, immediate reversal, bounded travel, input handoff and reduced-motion checks passed.');
