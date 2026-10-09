import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spriteSpec,spriteFrame,validateScene,validatePackage,requiredAssets,assetPath} from '../studio/schema.js';
const demo=JSON.parse(await readFile(new URL('../public/scenes/demo/scene.json',import.meta.url)));
const packageFor=scene=>({scene,files:requiredAssets(scene).map(name=>({name,content:Buffer.from('fixture').toString('base64')}))});
test('supplied sprite schema plays only five frames in a four-by-two atlas, top-left origin',async()=>{
 const source=JSON.parse(await readFile(new URL('./fixtures/157-sprite.json',import.meta.url)));const s=spriteSpec(source);assert.equal(s.fps,12);assert.deepEqual(spriteFrame(0,s),{frame:0,x:0,y:.5});assert.deepEqual(spriteFrame(4/12+.00001,s),{frame:4,x:0,y:0});assert.equal(spriteFrame(5/12+.00001,s).frame,0);assert.equal(spriteFrame(100,{...s,loop:false}).frame,4);
 assert.throws(()=>spriteSpec({...source,frames:9}),/フレーム/);assert.throws(()=>spriteSpec({...source,origin:'bottom-left'}),/top-left/);
});
test('demo contains all three simultaneous media types and every required file',async()=>{
 validateScene(demo);assert.deepEqual(demo.objects.map(o=>o.kind).sort(),['glb','sprite','video']);for(const name of requiredAssets(demo))assert.ok((await readFile(new URL('../public/scenes/demo/'+name,import.meta.url))).length);
 const p=packageFor(demo);validatePackage(p.scene,p.files);assert.throws(()=>validatePackage(p.scene,p.files.slice(1)),/不足/);
});
test('publication refuses traversal, duplicate IDs, missing Safari fallback and invalid transforms',()=>{
 for(const name of ['../x','a/b.png','.env','a..png'])assert.equal(assetPath(name),false);
 const s=structuredClone(demo);s.id='../bad';assert.throws(()=>validateScene(s));
 const t=structuredClone(demo);t.objects[1].id=t.objects[0].id;assert.throws(()=>validateScene(t),/重複/);
 const u=structuredClone(demo);delete u.objects[1].fallback;assert.throws(()=>validateScene(u),/Safari/);
 const v=structuredClone(demo);v.objects[0].scale[0]=0;assert.throws(()=>validateScene(v),/サイズ/);
 const p=packageFor(demo);p.files.push(p.files[0]);assert.throws(()=>validatePackage(p.scene,p.files),/不正/);
 const bad=packageFor(demo);bad.files[0].content='invalid\nbase64';assert.throws(()=>validatePackage(bad.scene,bad.files),/不正/);
});
