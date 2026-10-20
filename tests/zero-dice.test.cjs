const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const src=fs.readFileSync('scripts/soul-burn.js','utf8');
function setup(high=true,reduction=true) {
 const calls=[];
 const c=vm.createContext({game:{settings:{get:(_m,k)=>k==='highStakesMode'?high:reduction}},makeRoll:async f=>{calls.push(f);return {total:6,dice:[{results:[{result:2}]}]};}});
 for(const [start,end] of [['function aetherglowProgressionReductionEnabled','function burnoutFinale'],['function burnoutChance','function toleranceLine'],['async function rollSoulBurnActivation','async function aetherSurge']])vm.runInContext(src.slice(src.indexOf(start),src.indexOf(end)),c);
 return {c,calls};
}
test('banked AGDR 2 gives 0, 0, 1, 2 dice as lifetime uses increase',()=>{
 const {c}=setup();
 assert.deepEqual([0,1,2,3].map(uses=>c.highStakesProgression({uses,aetherglowDieReduction:2}).dice),[0,0,1,2]);
 assert.equal(c.nextAetherglowDieReduction({uses:0,aetherglowDieReduction:2}),3);
});
test('zero dice rolls duration only and adds no strain',async()=>{
 const {c,calls}=setup();const r=await c.rollSoulBurnActivation(8,0);
 assert.deepEqual(calls,['1d8']);assert.equal(r.gain,0);assert.equal(r.durationRounds,6);
 assert.equal(c.burnoutChance(8,0,0),0);
});
test('normal activation still uses total for strain and first die for duration',async()=>{
 const {c}=setup();const r=await c.rollSoulBurnActivation(8,3);
 assert.equal(r.gain,6);assert.equal(r.durationRounds,2);
});
test('disabled options retain existing dice rules and do not bank reduction',()=>{
 const {c}=setup(false);assert.equal(c.highStakesProgression({uses:4,aetherglowDieReduction:10}).dice,1);
 assert.equal(c.nextAetherglowDieReduction({aetherglowDieReduction:2}),2);
});
