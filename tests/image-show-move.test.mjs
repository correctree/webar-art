import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ActionSequence,defaultAction,defaultSequence,validateSequence} from '../studio/action-sequence.js';
import {validateScene,toProject,requiredAssets,validatePackage} from '../studio/schema.js';
const seq=actions=>({...defaultSequence(),enabled:true,actions});
test('appearance and translation run together; next action waits for longer fade',()=>{
 const q=seq([{...defaultAction('showMove'),offset:[2,0,0],duration:1,fade:2}, {...defaultAction('move'),offset:[0,1,0]}]);
 validateSequence(q,new Set(),new Set());const s=new ActionSequence(q);s.tap();s.update(.5);assert.equal(s.pose.alpha,.25);assert.equal(s.pose.position[0],1);s.update(1);assert.equal(s.pose.alpha,.75);assert.deepEqual(s.pose.position,[2,0,0]);s.update(1);assert.deepEqual(s.pose.position,[2,.5,0]);assert.equal(s.pose.alpha,1);
});
test('movement continues during appearance delay; pingpong finishes without overshoot',()=>{
 const s=new ActionSequence(seq([{...defaultAction('showMove'),offset:[2,0,0],duration:1,pingpong:true,delay:1,fade:2}]));s.tap();s.update(.5);assert.equal(s.pose.visible,false);assert.equal(s.pose.position[0],1);s.update(1);assert.equal(s.pose.alpha,.25);assert.equal(s.pose.position[0],1);s.update(1);assert.equal(s.pose.position[0],0);assert.equal(s.pose.alpha,.75);s.update(.5);assert.equal(s.active,false);assert.equal(s.pose.alpha,1);
});
test('longer movement, instant appearance, schema bounds and JSON roundtrip',()=>{
 const a={...defaultAction('showMove'),fade:0,duration:2,offset:[0,4,0]};const q=JSON.parse(JSON.stringify(seq([a])));validateSequence(q,new Set(),new Set());const s=new ActionSequence(q);s.tap();s.update(1);assert.equal(s.pose.alpha,1);assert.equal(s.pose.position[1],2);assert.equal(s.active,true);s.update(1);assert.equal(s.active,false);assert.equal(s.pose.position[1],4);for(const patch of [{fade:-1},{offset:[NaN,0,0]},{duration:0},{repeat:0}])assert.throws(()=>validateSequence(seq([{...a,...patch}]),new Set(),new Set()));
});
test('JPG project survives validation/import and retains image in publishing asset set',async()=>{
 const p=JSON.parse(await readFile(new URL('../public/scenes/demo-interactive/scene.json',import.meta.url),'utf8'));const o=p.scenes[0].objects[0];o.kind='image';o.src='painting.jpg';delete o.fallback;delete o.sprite;o.interaction.sequence=seq([defaultAction('showMove')]);const restored=toProject(JSON.parse(JSON.stringify(p)));validateScene(restored);assert.equal(restored.scenes[0].objects[0].kind,'image');assert.ok(requiredAssets(restored).includes('painting.jpg'));assert.equal(restored.scenes[0].objects[0].interaction.sequence.actions[0].type,'showMove');
});
