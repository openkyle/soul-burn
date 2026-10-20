const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('scripts/soul-burn.js','utf8');
async function save(formData) {
 let current = { burn: 4, uses: 2, tolerance: 1, aetherglowDieReduction: 0, active: false };
 const actor = { id: 'pc', type: 'character', hasPlayerOwner: true, async update() {} };
 const context = vm.createContext({
  FormApplication: class {}, game: { actors: [actor] },
  state: () => current, ui: { notifications: { info() {} } },
  async saveState(_a,next) { current = next; },
  async saveMetadataOnly(_a,next) { current = next; },
  renderActorSheetSoon() {},
 });
 vm.runInContext(source.slice(source.indexOf('class SoulBurnPlayerManager'), source.indexOf('\nHooks.once("init"')) + '\nthis.Manager=SoulBurnPlayerManager;',context);
 vm.runInContext(source.slice(source.indexOf('async function clearSoulBurnFromSheet'), source.indexOf('async function consumeHitDie')),context);
 await new context.Manager()._updateObject(null,formData);
 return current;
}
test('AGDR saves for characters without a Soul Burn resource', async () => {
 assert.equal((await save({'actors.pc.aetherglowDieReduction': '3'})).aetherglowDieReduction,3);
});
test('zero-burn clearing preserves the edited AGDR', async () => {
 const next=await save({'actors.pc.burn':'0','actors.pc.aetherglowDieReduction':'2'});
 assert.equal(next.aetherglowDieReduction,2);
 assert.equal(next.resourceCleared,true);
});
test('AGDR saves alongside Soul Burn and accepts zero', async () => {
 assert.equal((await save({'actors.pc.burn':'4','actors.pc.aetherglowDieReduction':'0'})).aetherglowDieReduction,0);
});
test('negative and fractional values become nonnegative integers', async () => {
 assert.equal((await save({'actors.pc.aetherglowDieReduction':'-2'})).aetherglowDieReduction,0);
 assert.equal((await save({'actors.pc.aetherglowDieReduction':'2.9'})).aetherglowDieReduction,2);
});
