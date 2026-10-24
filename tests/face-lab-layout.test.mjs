import test from 'node:test';import assert from 'node:assert/strict';import {containRect} from '../public/face-lab/layout.js';
test('portrait camera fills portrait frame',()=>assert.deepEqual(containRect(480,640,300,400),{width:300,height:400,left:0,top:0}));
test('landscape restart preserves source aspect inside same portrait frame',()=>{const r=containRect(640,480,300,400);assert.equal(r.width/r.height,640/480);assert.equal(r.width,300);assert.equal(r.top,87.5);});
test('orientation switch uses same contained rectangle for overlay',()=>assert.deepEqual(containRect(480,640,400,300),{width:225,height:300,left:87.5,top:0}));
test('metadata not ready does not overwrite layout',()=>assert.equal(containRect(0,0,300,400),null));
