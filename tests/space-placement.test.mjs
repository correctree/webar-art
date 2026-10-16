import test from 'node:test';
import assert from 'node:assert/strict';
import {studioToWorld,placementCheck,spaceGate} from '../studio/space-policy.js';
import {Behavior} from '../studio/behavior.js';
import {validateScene,toProject} from '../studio/schema.js';
import {readFile} from 'node:fs/promises';
test('common parent preserves pairwise distances with uniform scale and leaves specs unchanged',()=>{
 const specs=[{kind:'glb',position:[-1,2,.4],rotation:[10,20,30],scale:[.5,.7,.8]},{kind:'video',position:[2,-1,.9]},{kind:'sprite',position:[0,.5,1]}],before=structuredClone(specs),origin=[3,4,5],factor=.35;
 const world=specs.map(o=>studioToWorld(o.position,origin,factor));
 for(let i=0;i<3;i++)for(let k=i+1;k<3;k++){const distance=(a,b)=>Math.hypot(...a.map((v,n)=>v-b[n]));assert.ok(Math.abs(distance(world[i],world[k])-distance(specs[i].position,specs[k].position)*factor)<1e-12);}
 assert.deepEqual(specs,before);assert.deepEqual(studioToWorld([1,2,3],[10,20,30],2),[12,26,26]);
});
test('space gate blocks media before placement, on tracking loss and in other scenes',()=>{
 assert.equal(spaceGate('one','one',false,'NORMAL'),false);assert.equal(spaceGate('one','one',true,'LIMITED'),false);assert.equal(spaceGate('two','one',true,'NORMAL'),false);assert.equal(spaceGate('one','one',true,'NORMAL'),true);
});
test('placement rejects back/near/side/invalid hits and accepts forward hits',()=>{
 for(const p of [[0,0,1],[0,0,-.1],[1,0,-.1],[NaN,0,-2]])assert.equal(placementCheck(p).accepted,false);assert.equal(placementCheck([0,0,-2]).accepted,true);
});
test('mode and group scale survive save validation and old projects remain valid',async()=>{
 const demo=JSON.parse(await readFile(new URL('../public/scenes/demo/scene.json',import.meta.url))),p=toProject(demo);validateScene(p);p.experienceMode='space';p.spaceScale=.35;const saved=toProject(JSON.parse(JSON.stringify(p)));assert.equal(saved.experienceMode,'space');assert.equal(saved.spaceScale,.35);assert.deepEqual(saved.scenes,p.scenes);assert.throws(()=>validateScene({...p,spaceScale:0}));assert.throws(()=>validateScene({...p,experienceMode:'invalid'}));
});
test('scene-start waits for placement then fires all media and scene transitions',()=>{
 let placed=false;const calls=[];const object=id=>({id,autoplay:true,interaction:{startTrigger:'scene',action:'none'}});
 const p={scenes:[{id:'a',objects:[object('glb'),object('sprite'),object('video')]},{id:'b',objects:[object('next')]}]};const b=new Behavior(p,{eligible:()=>placed,tap:o=>calls.push(o.id)});b.enter('a');b.running=true;b.update(0);assert.equal(calls.length,0);placed=true;b.update(0);assert.deepEqual(calls,['glb','sprite','video']);b.enter('b');b.update(0);assert.deepEqual(calls,['glb','sprite','video','next']);
});
test('runtime placement moves only the common anchor; stale/behind taps cannot place artwork',async()=>{
 const vm=await import('node:vm');let now=1000;
 class Node {constructor(){this.children=[];this.rotation={};this.visible=true;this.position={values:[0,0,0],copy(p){this.values=[...p.values];return this;},toArray(){return this.values;}};this.scale={setScalar:n=>{this.factor=n;}};}add(...children){this.children.push(...children);}}
 const container={clientWidth:320,clientHeight:480,append(){}};
 const ctx={THREE:{Group:Node,Scene:Node,PerspectiveCamera:Node,PCFShadowMap:1},SPACE_SCALE:.35,document:{createElement:()=>({style:{}})},window:{addEventListener(){}},devicePixelRatio:1,performance:{now:()=>now},Date};
 vm.createContext(ctx);const source=await readFile(new URL('../studio/space-runtime.js',import.meta.url),'utf8');vm.runInContext(source.replace(/^import .*;\n/gm,'').replace('export class SpaceRuntime','class SpaceRuntime')+';globalThis.Runtime=SpaceRuntime;',ctx);
 const r=new ctx.Runtime({container});assert.equal(r.canvas.width,320);assert.equal(r.canvas.height,480);r.running=true;r.canvas.width=640;r.resize();assert.equal(r.canvas.width,640);r.running=false;assert.equal(r.contentRoot.rotation.x,-Math.PI/2);assert.equal(r.anchor.factor,.35);r.capture=()=>{};r.check=()=>({accepted:true});r.running=true;r.tracking='NORMAL';r.candidate={values:[1,2,3]};r.candidateAt=now;
 const artwork=new Node();r.contentRoot.add(artwork);const unchanged=JSON.stringify(artwork.position.values);assert.equal(r.place(),true);assert.deepEqual(Array.from(r.anchor.position.values),[1,2,3]);assert.equal(JSON.stringify(artwork.position.values),unchanged);assert.equal(r.anchor.visible,true);
 r.reset();r.candidate={values:[4,5,6]};r.candidateAt=now-251;assert.equal(r.place(),false);assert.equal(r.placed,false);r.candidate={values:[4,5,6]};r.candidateAt=now;r.check=()=>({accepted:false,reason:'BEHIND_CAMERA'});assert.equal(r.place(),false);assert.equal(r.anchor.visible,false);
});
