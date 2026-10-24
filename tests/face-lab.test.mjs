import test from 'node:test';import assert from 'node:assert/strict';import {facePlacement} from '../public/face-lab/geometry.js';
const p=[];p[1]={x:.5,y:.5};p[234]={x:.25,y:.5};p[454]={x:.75,y:.5};p[10]={x:.5,y:.2};p[152]={x:.5,y:.8};
test('nose aligns to video center',()=>assert.deepEqual(facePlacement(p,640,480),{x:0,y:0,span:320}));
test('head is above forehead',()=>assert.ok(facePlacement(p,640,480,'head').y>144));
test('portrait uses video coordinates',()=>assert.equal(facePlacement(p,480,640).span,240));
test('invalid face hides attachment',()=>{assert.equal(facePlacement([],640,480),null);assert.equal(facePlacement(null,640,480),null);const q=p.slice();q[1]={x:NaN,y:0};assert.equal(facePlacement(q,640,480),null);});
