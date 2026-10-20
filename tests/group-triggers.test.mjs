import test from 'node:test';import assert from 'node:assert/strict';
import {ActionSequence,defaultAction,defaultSequence,validateSequence,usesTrigger,startsHidden,moveActionLayer} from '../studio/action-sequence.js';
import {Behavior} from '../studio/behavior.js';
const seq=actions=>({...defaultSequence(),enabled:true,actions});
const move=(trigger,offset=[1,0,0])=>({...defaultAction('move'),trigger,offset});
const runner=actions=>new ActionSequence(seq(actions),()=>{},{groupTriggers:true,firstTrigger:'tap'});
test('scene appearance completes then waits for a fresh tap; previous action chains normally',()=>{
 const s=runner([{type:'parallel',trigger:'scene',actions:[{type:'show',fade:1},move(undefined)]},move('tap',[0,2,0]),move('previous',[0,0,3])]);s.signal('scene');s.update(1);assert.equal(s.waitingFor,'tap');assert.deepEqual(s.pose.position,[1,0,0]);s.update(10);assert.deepEqual(s.pose.position,[1,0,0]);s.signal('tap');s.update(2);assert.deepEqual(s.pose.position,[1,2,3]);assert.equal(s.active,false);
});
test('scene event is latched when tap ACTION precedes scene ACTION; premature taps are not queued',()=>{
 const s=runner([move('tap'),move('scene',[0,1,0]),move('tap',[0,0,1])]);s.signal('scene');s.update(10);assert.equal(s.waitingFor,'tap');s.signal('tap');s.update(2);assert.deepEqual(s.pose.position,[1,1,0]);assert.equal(s.waitingFor,'tap');s.update(10);assert.equal(s.pose.position[2],0);s.signal('tap');s.update(1);assert.deepEqual(s.pose.position,[1,1,1]);
});
test('a tap used for ACTION-01 cannot also release ACTION-02 and ignore permits waiting taps',()=>{
 const q={...seq([move('tap'),move('tap',[0,1,0])]),retrigger:'ignore'},s=new ActionSequence(q,()=>{},{groupTriggers:true});s.signal('tap');s.update(1);assert.equal(s.waitingFor,'tap');assert.equal(s.signal('tap'),true);s.update(1);assert.deepEqual(s.pose.position,[1,1,0]);
});
test('scene-only groups reject taps, mixed groups dispatch both, automatic event runs once per scene entry',()=>{
 const object={id:'a',autoplay:true,interaction:{startTrigger:'scene',action:'none',sequence:seq([move('scene'),move('tap')])}},events=[];
 assert.equal(usesTrigger(object,'scene'),true);assert.equal(usesTrigger(object,'tap'),true);
 const b=new Behavior({scenes:[{id:'s',objects:[object]}]},{tap:(o,p,k)=>events.push(k)});b.enter('s');b.running=true;b.update(0);b.update(0);assert.deepEqual(events,['scene']);assert.equal(b.tap('a'),true);assert.deepEqual(events,['scene','tap']);object.interaction.sequence.actions=[move('scene')];assert.equal(b.tap('a'),false);
});
test('legacy sequence defaults retain scene/tap start and sequential continuation, first previous starts at scene',()=>{
 const o={interaction:{startTrigger:'scene',sequence:seq([{type:'show',fade:1},defaultAction('move')])}};assert.equal(startsHidden(o),true);assert.equal(usesTrigger(o,'tap'),false);const s=new ActionSequence(o.interaction.sequence,()=>{},{groupTriggers:true,firstTrigger:'scene',visible:false});s.signal('scene');s.update(2);assert.equal(s.active,false);assert.equal(s.pose.position[2],.25);const p=runner([move('previous')]);p.signal('scene');p.update(1);assert.equal(p.active,false);
});
test('group triggers survive JSON and layer movement, invalid trigger is rejected',()=>{
 const a=[move('scene'),{type:'parallel',trigger:'tap',actions:[defaultAction('rotate')]}];validateSequence(seq(JSON.parse(JSON.stringify(a))));const moved=moveActionLayer(a,{group:null,index:0},{group:1,index:1});assert.equal(moved[0].trigger,'tap');assert.equal(moved[0].actions[1].trigger,undefined);assert.throws(()=>validateSequence(seq([move('unknown')])));
});
test('waiting tap does not pause the media before a pause ACTION actually starts',()=>{const s=runner([move('scene'),{...defaultAction('pause'),trigger:'tap'}]);s.signal('scene');s.update(1);assert.equal(s.pose.paused,false);assert.equal(s.waitingFor,'tap');s.signal('tap');s.update(.5);assert.equal(s.pose.paused,true);});
