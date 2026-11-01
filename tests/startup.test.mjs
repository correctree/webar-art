import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {withDeadline} from '../studio/startup.js';
test('startup resolves a completed operation',async()=>assert.equal(await withDeadline(()=>42,100,'素材'),42));
test('startup preserves a load error',async()=>{const error=new Error('404');await assert.rejects(withDeadline(()=>Promise.reject(error),100,'素材'),e=>e===error);});
test('startup reports the stalled stage',async()=>{await assert.rejects(withDeadline(()=>new Promise(()=>{}),5,'作品 A'),/作品 A.*待機時間/);});
test('face and space do not statically load image tracking',async()=>{const source=await readFile(new URL('../studio/player.js',import.meta.url),'utf8');assert.doesNotMatch(source,/import \{MindARThree\} from/);assert.match(source,/if\(!faceMode&&!worldMode\)/);});
