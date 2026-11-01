import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {reflectionSettings,reflectionProfiles,playbackReflection,validateReflection} from '../studio/reflection-policy.js';
import {toProject} from '../studio/schema.js';
test('legacy defaults and finite intensity bounds',()=>{
 assert.deepEqual(reflectionSettings(),{profile:'classic',intensity:1.6});
 assert.equal(reflectionSettings({profile:'soft'}).intensity,1.4);
 for(const [input,expected] of [[0,0],[-1,0],[9,3],[NaN,1.6],[Infinity,1.6]])assert.equal(reflectionSettings({intensity:input}).intensity,expected);
 for(const invalid of [null,[],{profile:'oops',intensity:1},{profile:'classic',intensity:NaN},{profile:'soft',intensity:4}])assert.throws(()=>validateReflection(invalid));
});
test('URL overrides do not mutate saved settings and invalid queries fall back',()=>{
 const saved={profile:'soft',intensity:.8};
 assert.deepEqual(playbackReflection(saved,'?chromeProfile=bright'),{profile:'bright',intensity:1.9});
 assert.deepEqual(playbackReflection(saved,'?chromeProfile=bad&chromeIntensity=NaN'),saved);
 assert.equal(playbackReflection(saved,'?chromeIntensity=0').intensity,0);
 assert.equal(saved.intensity,.8);
});
test('all shipped projects keep reflection across JSON save/reload in all AR modes',async()=>{
 const base=new URL('../public/scenes/',import.meta.url);
 for(const name of await readdir(base)){
  let raw;try{raw=JSON.parse(await readFile(new URL(name+'/scene.json',base),'utf8'));}catch{continue;}
  const project=toProject(raw);
  for(const mode of ['marker','space','face']){
   // Face-only projects have no image targets, so retain their valid mode.
   if(project.experienceMode==='face'&&mode!=='face')continue;
   const changed={...project,experienceMode:mode,reflection:{profile:'studio',intensity:.75}};
   if(mode==='face')changed.scenes=structuredClone(changed.scenes).map(s=>({...s,objects:s.objects.map(o=>({...o,faceAnchor:o.faceAnchor||'nose'}))}));
   assert.deepEqual(toProject(JSON.parse(JSON.stringify(changed))).reflection,changed.reflection);
  }
 }
});
test('GLTF enhancement preserves animations, normal materials and releases disposed references',async()=>{
 class Material{
  constructor(name='chrome'){this.name=name;this.isMeshStandardMaterial=true;this.metalness=1;this.roughness=.08;this.color={r:1,g:1,b:1};this.events={};}
  clone(){const m=new Material(this.name);Object.assign(m,this);m.events={};return m;}
  addEventListener(type,fn){this.events[type]=fn;}
  dispose(){this.events.dispose?.();}
 }
 class Texture{constructor(){this.userData={};}}
 class Loader{parse(data,path,done){done(data);}}
 const context={THREE:{CanvasTexture:Texture},GLTFLoader:Loader,reflectionSettings,reflectionProfiles,window:{},console:{info(){},warn(){}},document:{createElement(){return {getContext(){return {createLinearGradient(){return {addColorStop(){}};},fillRect(){}};}};}}};
 vm.createContext(context);
 let code=await readFile(new URL('../studio/chrome-reflection-fix.js',import.meta.url),'utf8');
 code=code.replace(/^import .*;$/gm,'').replace('export function configureReflection','function configureReflection');
 vm.runInContext(code,context);
 const original=new Material(),normal=new Material('plastic');normal.metalness=0;
 const mesh={isMesh:true,material:[original,normal],morphTargetInfluences:[.3]};
 const root={name:'',traverse(fn){fn(mesh);}};const clip={name:'morph'};const gltf={scene:root,scenes:[root,root],animations:[clip]};
 new Loader().parse(gltf,'',result=>assert.equal(result,gltf));
 const chrome=mesh.material[0],api=context.window.ARARARTChromeFix;
 assert.notEqual(chrome,original);assert.equal(mesh.material[1],normal);assert.equal(gltf.animations[0],clip);assert.equal(mesh.morphTargetInfluences[0],.3);
 assert.equal(api.status().activeMaterials,1);assert.equal(chrome.envMapIntensity,1.6);
 const classic=chrome.envMap;assert.equal(classic.userData.ararartSharedReflection,true);
 api.configure({profile:'soft',intensity:.5});assert.notEqual(chrome.envMap,classic);assert.equal(chrome.envMapIntensity,.5);
 api.configure({profile:'classic',intensity:1.6});assert.equal(chrome.envMap,classic);
 chrome.dispose();assert.equal(api.status().activeMaterials,0);
 api.configure({profile:'bright',intensity:2});assert.equal(chrome.envMapIntensity,1.6);
});
