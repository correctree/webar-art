import test from 'node:test';import assert from 'node:assert/strict';
import {ActionSequence,defaultSequence,defaultAction,validateSequence,validateGroup,groupActions,startsWithAppearance,actionCount} from '../studio/action-sequence.js';
const parallel=actions=>({type:'parallel',actions}),seq=actions=>({...defaultSequence(),enabled:true,actions});
const move=(offset=[2,0,0],duration=2)=>({...defaultAction('move'),offset,duration});
test('show, translation, rotation and size run together from same initial pose; next waits for longest',()=>{
 const s=new ActionSequence(seq([parallel([{type:'show',delay:0,fade:2},move(),{...defaultAction('rotate'),axis:'y',angle:180,duration:1},{...defaultAction('scale'),factors:[2,2,2],duration:1}]),move([0,1,0],1)]));s.tap();s.update(.5);assert.equal(s.pose.alpha,.25);assert.deepEqual(s.pose.position,[.5,0,0]);assert.ok(Math.abs(s.pose.rotation[1]-Math.PI/2)<1e-8);assert.ok(Math.abs(s.pose.scale[0]-Math.sqrt(2))<1e-8);s.update(1);assert.equal(s.pose.alpha,.75);assert.deepEqual(s.pose.position,[1.5,0,0]);assert.equal(s.pose.rotation[1],Math.PI);s.update(1);assert.deepEqual(s.pose.position,[2,.5,0]);s.update(.5);assert.equal(s.active,false);assert.deepEqual(s.pose.position,[2,1,0]);
});
test('parallel starts from accumulated transforms and leaves unrelated channels untouched',()=>{
 const s=new ActionSequence(seq([move([3,0,0],1),parallel([move([0,2,0],1),{...defaultAction('rotate'),axis:'x',angle:90,duration:1},{...defaultAction('rotate'),axis:'z',angle:180,duration:1}])]));s.tap();s.update(1.5);assert.deepEqual(s.pose.position,[3,1,0]);assert.equal(s.pose.rotation[0],Math.PI/4);assert.equal(s.pose.rotation[2],Math.PI/2);s.update(.5);assert.deepEqual(s.pose.position,[3,2,0]);
});
test('fade delay, short pingpong and long branch complete without overshoot',()=>{
 const s=new ActionSequence(seq([parallel([{...move([2,0,0],.5),pingpong:true},{type:'show',delay:1,fade:2}])]));s.tap();s.update(.5);assert.equal(s.pose.visible,false);assert.equal(s.pose.position[0],2);s.update(1);assert.equal(s.pose.position[0],0);assert.equal(s.pose.alpha,.25);s.update(1.5);assert.equal(s.active,false);assert.equal(s.pose.alpha,1);
});
test('parallel sound/camera events fire once, zero-time groups advance without consuming next time',()=>{
 const events=[],s=new ActionSequence(seq([parallel([{type:'sound',soundId:'a',volume:1},{type:'camera',enabled:true}]),move([1,0,0],1)]),a=>events.push(a.type));s.tap();s.update(.5);assert.deepEqual(events,['sound','camera']);assert.equal(s.pose.followCamera,true);assert.equal(s.pose.position[0],.5);s.update(.5);assert.deepEqual(events,['sound','camera']);assert.equal(s.active,false);
});
test('restart/ignore/stop/reset work for parallel runners',()=>{
 for(const retrigger of ['restart','ignore','stop']){const s=new ActionSequence({...seq([parallel([move(),{type:'show',delay:0,fade:2}])]),retrigger});s.tap();s.update(.5);s.tap();if(retrigger==='restart'){s.update(.5);assert.equal(s.pose.position[0],.5);assert.equal(s.pose.alpha,.25);}if(retrigger==='ignore'){s.update(.5);assert.equal(s.pose.position[0],1);}if(retrigger==='stop'){s.update(.5);assert.equal(s.pose.position[0],.5);assert.equal(s.active,false);}}
 const s=new ActionSequence({...seq([parallel([move(),{type:'hide',delay:0,fade:1}])]),finish:'reset'});s.tap();s.update(2);assert.deepEqual(s.pose.position,[0,0,0]);assert.equal(s.pose.visible,true);
});
test('conflicting channels, nested groups, pause, scene and excess actions are rejected',()=>{
 for(const children of [[move(),move()], [{...defaultAction('rotate')},{...defaultAction('rotate')}],[{type:'show'},{type:'hide'}],[defaultAction('camera'),defaultAction('rotate')],[defaultAction('pause'),move()],[{type:'scene',sceneId:'a'},move()],[parallel([move(),defaultAction('scale')]),move()]])assert.throws(()=>validateGroup(parallel(children)));
 assert.throws(()=>validateSequence(seq([parallel([move(),defaultAction('scale')]),...Array.from({length:23},()=>defaultAction('wait'))])));
 assert.throws(()=>validateSequence(seq([parallel([move(),{type:'sound',soundId:'absent',volume:1}])]),new Set(),new Set()));
});
test('grouping selected rows retains individual settings, non-selected order, and roundtrips',()=>{
 const actions=[defaultAction('show'),defaultAction('wait'),move(),defaultAction('scale')];const original=structuredClone(actions),grouped=groupActions(actions,[0,2]);assert.equal(grouped[0].type,'parallel');assert.equal(grouped[1].type,'wait');assert.deepEqual(grouped[0].actions,[original[0],original[2]]);assert.deepEqual(actions,original);assert.equal(actionCount(grouped),4);validateSequence(JSON.parse(JSON.stringify(seq(grouped))));assert.equal(startsWithAppearance(grouped),true);assert.equal(startsWithAppearance([parallel([move(),defaultAction('scale')])]),false);assert.throws(()=>groupActions(actions,[2]));assert.throws(()=>groupActions([move(),move()],[0,1]));
});
