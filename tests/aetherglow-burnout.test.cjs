const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const src=fs.readFileSync('scripts/soul-burn.js','utf8');
async function administer(total) {
 let saved,formula,rollData,card;
 const current={burn:45,burnout:true,active:true,tolerance:3,uses:2,aetherglowDieReduction:1};
 const actor={name:'Hero',system:{attributes:{hp:{value:10,max:30}}},async update(){}};
 const c=vm.createContext({
  state:()=>current,soundPath:()=>'',makeRoll:async(f,d)=>{formula=f;rollData=d;return {total};},
  cleanseAetherglowEffects:async()=>[],hasSoulBurnResource:()=>true,maximumBurn:()=>40,
  aetherglowProgressionReductionEnabled:()=>true,nextAetherglowDieReduction:()=>2,
  highStakesProgression:()=>({dice:1,normal:3}),saveState:async(_a,s)=>saved=s,
  chat:async(_a,_title,body)=>card=body,esc:s=>s,toleranceLine:()=>'Recovered'
 });
 vm.runInContext(src.slice(src.indexOf('async function applyAetherglow('),src.indexOf('async function consumeAetherglow(')),c);
 await c.applyAetherglow(actor);
 return {saved,formula,rollData,card};
}
test('recovery exactly to maximum cancels pending Burnout',async()=>{
 const {saved,card}=await administer(5);
 assert.equal(saved.burn,40);assert.equal(saved.burnout,false);assert.equal(saved.active,true);
 assert.match(card,/Burnout prevented/);
});
test('recovery below maximum cancels pending Burnout',async()=>{
 const {saved}=await administer(10);assert.equal(saved.burn,35);assert.equal(saved.burnout,false);
});
test('insufficient recovery keeps Burnout pending and uses current AGT',async()=>{
 const {saved,formula,rollData,card}=await administer(4);
 assert.equal(saved.burn,41);assert.equal(saved.burnout,true);
 assert.equal(formula,'max(1, 1d20 - @tolerance)');assert.equal(rollData.tolerance,3);
 assert.equal(saved.tolerance,4);assert.doesNotMatch(card,/Burnout prevented/);
});
