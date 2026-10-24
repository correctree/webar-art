import test from 'node:test';import assert from 'node:assert/strict';
import {loadVision,sources} from '../public/face-lab/loader.js';
const good={FaceLandmarker:{},FilesetResolver:{forVisionTasks:async url=>({url})}};
test('first CDN failure falls back and pairs WASM version',async()=>{const calls=[];const result=await loadVision({importer:async url=>{calls.push(url);if(calls.length===1)throw new Error('network');return good;}});assert.equal(calls.length,2);assert.equal(result.files.url,sources[1]+'/wasm');});
test('both failures report URLs and errors',async()=>{await assert.rejects(loadVision({importer:async()=>{throw new Error('blocked');}}),e=>sources.every(s=>e.message.includes(s))&&e.message.includes('blocked'));});
test('cancel avoids another request',async()=>{let cancelled=false,calls=0;await assert.rejects(loadVision({isCancelled:()=>cancelled,importer:async()=>{calls++;cancelled=true;return good;}}));assert.equal(calls,1);});
