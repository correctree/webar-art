import test from 'node:test';
import assert from 'node:assert/strict';
import {ActionSequence,defaultSequence,defaultAction,validateSequence} from '../studio/action-sequence.js';
const spec=actions=>({...defaultSequence(),enabled:true,actions});
test('infinite repeat survives JSON validation for each motion and rejects invalid values',()=>{
 for(const type of ['move','rotate','scale','showMove']){
  const q=JSON.parse(JSON.stringify(spec([{...defaultAction(type),repeat:'infinite'}])));
  validateSequence(q);assert.equal(q.actions[0].repeat,'infinite');
  for(const repeat of [0,21,-1,1.5,null,Infinity,'Infinity'])assert.throws(()=>validateSequence(spec([{...defaultAction(type),repeat}])));
 }
});
test('infinite rotation continues past twenty cycles without advancing and can stop/reset/restart',()=>{
 const r=new ActionSequence({...spec([{...defaultAction('rotate'),repeat:'infinite'},defaultAction('move')]),retrigger:'stop'});
 r.tap();r.update(100.5);assert.equal(r.active,true);assert.equal(r.index,0);
 assert.ok(Math.abs(r.pose.rotation[2]-100.5*Math.PI/2)<1e-8);
 r.tap();const pose=r.update(10);assert.equal(r.active,false);assert.deepEqual(r.update(10),pose);
 r.tap();assert.equal(r.pose.rotation[2],0);r.update(.5);r.reset();assert.equal(r.active,false);assert.equal(r.pose.rotation[2],0);
});
test('infinite pingpong move and scale stay bounded over many cycles',()=>{
 for(const type of ['move','scale']){
  const r=new ActionSequence(spec([{...defaultAction(type),repeat:'infinite',pingpong:true}]));
  r.tap();r.update(200);assert.deepEqual(r.pose.position,[0,0,0]);assert.deepEqual(r.pose.scale,[1,1,1]);
  r.update(1);assert.equal(r.active,true);
  if(type==='move')assert.deepEqual(r.pose.position,[0,0,.25]);else assert.deepEqual(r.pose.scale,[1.5,1.5,1.5]);
 }
});
test('parallel finite appearance finishes while infinite motion keeps its ACTION active',()=>{
 const r=new ActionSequence(spec([{type:'parallel',actions:[{...defaultAction('show'),fade:1},{...defaultAction('rotate'),repeat:'infinite'}]},defaultAction('hide')]));
 validateSequence(r.spec);r.tap();r.update(.5);assert.equal(r.pose.alpha,.5);
 r.update(100);assert.equal(r.pose.alpha,1);assert.equal(r.pose.visible,true);assert.equal(r.active,true);assert.equal(r.index,0);
 r.reset();assert.equal(r.active,false);
});
