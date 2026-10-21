import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultAction,defaultSequence,moveActionLayer,validateSequence} from '../studio/action-sequence.js';
const group=(...types)=>({type:'parallel',trigger:'tap',actions:types.map(defaultAction)});
const move=(source,from,to)=>{const before=structuredClone(source);const result=moveActionLayer(source,from,to);assert.deepEqual(source,before);return result;};
test('ACTION children reorder, transfer across groups, and move out to root without changing source',()=>{
 const source=[group('show','move'),group('rotate','scale')];
 const reordered=move(source,{group:0,index:0},{group:0,index:2});
 assert.deepEqual(reordered[0].actions.map(a=>a.type),['move','show']);
 const transferred=move(source,{group:1,index:0},{group:0,index:1});
 assert.deepEqual(transferred[0].actions.map(a=>a.type),['show','rotate','move']);
 assert.deepEqual(transferred[1].actions.map(a=>a.type),['scale']);
 const extracted=move(source,{group:0,index:1},{group:null,index:2});
 assert.equal(extracted[2].type,'move');
 const root=move(source,{group:null,index:0},{group:null,index:2});
 assert.deepEqual(root[0].actions.map(a=>a.type),['rotate','scale']);
});
test('empty source ACTION disappears; whole ACTION merges as flat children preserving destination trigger',()=>{
 const source=[group('show'),{...group('move','rotate'),trigger:'scene'}];
 const transferred=move(source,{group:0,index:0},{group:1,index:0});
 assert.equal(transferred.length,1);assert.equal(transferred[0].trigger,'scene');
 const merged=move(source,{group:null,index:0},{group:1,index:1});
 assert.equal(merged.length,1);assert.equal(merged[0].trigger,'scene');
 assert.deepEqual(merged[0].actions.map(a=>a.type),['move','show','rotate']);
 assert.ok(merged[0].actions.every(a=>a.type!=='parallel'));
});
test('conflicts, self drops, nested groups, pauses and early scene switches remain rejected atomically',()=>{
 const cases=[
  [[group('move'),group('move')],{group:null,index:0},{group:1,index:1}],
  [[group('show')],{group:null,index:0},{group:0,index:0}],
  [[defaultAction('pause'),group('move')],{group:null,index:0},{group:1,index:0}],
  [[group('move'),defaultAction('scene')],{group:null,index:1},{group:null,index:0}],
 ];
 for(const [source,from,to] of cases){const before=structuredClone(source);assert.throws(()=>moveActionLayer(source,from,to));assert.deepEqual(source,before);}
 assert.throws(()=>validateSequence({...defaultSequence(),actions:[{type:'parallel',actions:[group('move')]}]}),/同時再生/);
});
