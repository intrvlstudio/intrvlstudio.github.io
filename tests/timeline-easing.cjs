const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/orken-film.js'),'utf8');
const body=source.match(/function easeTimeline\(value,target,elapsed,mobile\)\{([\s\S]*?)\n  \}/)[1];
const ease=vm.runInNewContext('(function(value,target,elapsed,mobile){'+body+'})');
for(const mobile of [true,false]){
  // After input stops, the visible timeline continues in the same direction.
  let p=5;
  const first=ease(p,5.12,1000/60,mobile);
  assert(first>5&&first<5.12);
  p=first;
  for(let i=0;i<90;i++){
    const next=ease(p,5.12,1000/60,mobile);
    assert(next>=p&&next<=5.12);p=next;
  }
  assert.equal(p,5.12);
  // Large flicks cannot accumulate a long catch-up animation.
  assert(Math.abs(20-ease(0,20,16,mobile))<.16);
  // Reversing direction responds on the next frame, with no overshoot.
  const reverse=ease(5.1,4.9,16,mobile);
  assert(reverse<5.1&&reverse>4.9);
  // Equal elapsed time behaves the same on 60 Hz and 120 Hz displays.
  const run=hz=>{let v=5;for(let i=0;i<hz/4;i++)v=ease(v,5.12,1000/hz,mobile);return v};
  assert(Math.abs(run(60)-run(120))<1e-10);
}
assert(ease(5,5.12,16,true)>ease(5,5.12,16,false));
console.log('Timeline easing: bounded, reversible, frame-rate independent, and settles exactly.');
