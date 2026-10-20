import test from 'node:test';import assert from 'node:assert/strict';import {moveActionLayer,defaultAction,ActionSequence,defaultSequence} from '../studio/action-sequence.js';
const group=actions=>({type:'parallel',actions});
test('drag ACTION and child layers before/after, across groups, and out to root without changing source',()=>{
 const a=[group([defaultAction('show'),defaultAction('move')]),group([defaultAction('rotate'),defaultAction('scale')])];const original=structuredClone(a);
 let b=moveActionLayer(a,{group:0,index:1},{group:1,index:1});assert.deepEqual(b[0].actions.map(a=>a.type),['show']);assert.deepEqual(b[1].actions.map(a=>a.type),['rotate','move','scale']);
 b=moveActionLayer(b,{group:1,index:1},{group:null,index:2});assert.equal(b[2].type,'move');b=moveActionLayer(b,{group:null,index:2},{group:null,index:0});assert.equal(b[0].type,'move');b=moveActionLayer(b,{group:2,index:1},{group:2,index:0});assert.deepEqual(b[2].actions.map(a=>a.type),['scale','rotate']);assert.deepEqual(a,original);
});
test('empty source ACTION removed; conflicting drops, nesting, paused layers and early scene rejected atomically',()=>{
 const a=[group([defaultAction('show')]),group([defaultAction('move')])];const b=moveActionLayer(a,{group:0,index:0},{group:1,index:1});assert.equal(b.length,1);assert.equal(b[0].actions.length,2);assert.throws(()=>moveActionLayer([defaultAction('move'),group([defaultAction('move')])],{group:null,index:0},{group:1,index:1}));assert.throws(()=>moveActionLayer(a,{group:null,index:0},{group:1,index:0}));assert.throws(()=>moveActionLayer([defaultAction('pause'),a[1]],{group:null,index:0},{group:1,index:1}));assert.throws(()=>moveActionLayer([defaultAction('move'),{type:'scene',sceneId:'a'}],{group:null,index:1},{group:null,index:0}));assert.equal(a.length,2);
});
test('XYZ expansion and reduction play concurrently with movement with independent factors',()=>{
 const runner=new ActionSequence({...defaultSequence(),actions:[group([{...defaultAction('scale'),factors:[2,.5,1],linked:false,duration:2}, {...defaultAction('move'),offset:[1,2,3],duration:2}])]});runner.tap();runner.update(2);assert.deepEqual(runner.pose.scale,[2,.5,1]);assert.deepEqual(runner.pose.position,[1,2,3]);assert.equal(runner.active,false);
});
