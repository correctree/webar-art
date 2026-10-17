import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {validateBoxMask,maskPointVisible,maskPose,normalizedMaskInside,defaultMaskAnimation,portalPointInside,sceneMaskSources} from '../studio/box-mask-policy.js';
import {validateScene,toProject,requiredAssets} from '../studio/schema.js';
const mask=()=>({type:'box',enabled:true,mode:'inside',position:[0,0,.25],rotation:[0,0,0],size:[.5,.5,.5]});
test('box mask schema validates both modes and rejects invalid dimensions or coordinates',()=>{
 validateBoxMask(undefined);validateBoxMask(mask());validateBoxMask({...mask(),mode:'outside'});
 for(const change of [{enabled:1},{scope:'invalid'},{scope:'scene'},{mode:'other'},{type:'sphere'},{position:[0,0]},{rotation:[0,Infinity,0]},{size:[1,0,1]},{size:[1,-1,1]}])assert.throws(()=>validateBoxMask({...mask(),...change}));
});
test('all three media retain independent mask settings through project save/load with no new asset dependency',async()=>{
 const input=JSON.parse(await readFile(new URL('../public/scenes/demo-interactive/scene.json',import.meta.url)));const p=toProject(input),before=requiredAssets(p),objects=p.scenes.flatMap(s=>s.objects);
 assert.deepEqual([...new Set(objects.map(o=>o.kind))].sort(),['glb','sprite','video']);
 for(const o of objects)o.boxMask=mask();validateScene(p);const restored=toProject(JSON.parse(JSON.stringify(p)));assert.deepEqual(requiredAssets(restored),before);
 for(const o of restored.scenes.flatMap(s=>s.objects))assert.deepEqual(o.boxMask,mask());
 const first=restored.scenes.flatMap(s=>s.objects)[0];first.boxMask.size[0]=0;assert.throws(()=>validateScene(restored));
});
test('inside/outside picking rejects clipped fragments but accepts visible portions',()=>{
 assert.equal(maskPointVisible([.1,.9,.2,.8,.3,.7]),true);
 assert.equal(maskPointVisible([-.1,1.1,.2,.8,.3,.7]),false);
 assert.equal(maskPointVisible([-.1,1.1,.2,.8,.3,.7],'outside'),true);
 assert.equal(maskPointVisible([.1,.9,.2,.8,.3,.7],'outside'),false);
});
async function runtime(){
 const source=await readFile(new URL('../studio/box-mask.js',import.meta.url),'utf8'),ctx={maskPointVisible,maskPose,normalizedMaskInside,portalPointInside};vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.api={applyBoxMask,boxMaskAllows,updateBoxMask};',ctx);return ctx.api;
}
test('all visible materials and custom shadow materials receive clipping; disable restores full rendering',async()=>{
 const api=await runtime(),materials=[{},{isShaderMaterial:true}],depth={},distance={},node={material:materials,customDepthMaterial:depth,customDistanceMaterial:distance},root={traverse:fn=>fn(node)},planes=Array.from({length:6},()=>({})),state={enabled:true,planes,mode:'inside'};
 api.applyBoxMask(root,state);for(const m of [...materials,depth,distance]){assert.equal(m.clippingPlanes,planes);assert.equal(m.clipShadows,true);assert.equal(m.clipIntersection,false);}assert.equal(materials[1].clipping,true);
 state.mode='outside';api.applyBoxMask(root,state);assert.equal(depth.clipIntersection,true);
 state.enabled=false;api.applyBoxMask(root,state);for(const m of [...materials,depth,distance])assert.equal(m.clippingPlanes,null);
});
test('runtime hit filtering uses the same world planes for both mask modes',async()=>{
 const api=await runtime();const state={enabled:true,mode:'inside',planes:[{distanceToPoint:p=>p.x+1},{distanceToPoint:p=>1-p.x}]};assert.equal(api.boxMaskAllows(state,{x:0}),true);assert.equal(api.boxMaskAllows(state,{x:2}),false);
 state.mode='outside';state.planes=state.planes.map(plane=>({distanceToPoint:p=>-plane.distanceToPoint(p)}));assert.equal(api.boxMaskAllows(state,{x:0}),false);assert.equal(api.boxMaskAllows(state,{x:2}),true);state.enabled=false;assert.equal(api.boxMaskAllows(state,{x:0}),true);
});
test('box frame follows marker/group parent but excludes the artwork motion transform',async()=>{
 const source=await readFile(new URL('../studio/box-mask.js',import.meta.url),'utf8'),calls=[];
 const state={position:{fromArray:v=>calls.push(['position',...v])},size:{fromArray:v=>calls.push(['size',...v])},rotation:{set:(...v)=>calls.push(['rotation',...v])},quaternion:{setFromEuler(){}},matrix:{compose(){},premultiply:m=>calls.push(['parent',m])},planes:Array.from({length:6},()=>({set(n,c){this.n=n;this.c=c;return this;},applyMatrix4(m){this.matrix=m;return this;},negate(){this.c=-this.c;return this;}}))};
 const ctx={THREE:{MathUtils:{degToRad:d=>d*Math.PI/180},Vector3:class{constructor(...v){this.values=v;}}},maskPointVisible,maskPose,normalizedMaskInside,portalPointInside};vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.update=updateBoxMask;',ctx);
 const parent={matrixWorld:'shared marker anchor',updateWorldMatrix(){}};ctx.update(state,{boxMask:{...mask(),rotation:[0,0,90]}},parent);
 assert.deepEqual(calls.find(c=>c[0]==='parent'),['parent','shared marker anchor']);assert.ok(Math.abs(calls.find(c=>c[0]==='rotation')[3]-Math.PI/2)<1e-10);assert.equal(state.planes.length,6);assert.ok(state.planes.every(p=>p.matrix===state.matrix&&p.c===.5));
});
test('MediaScene GLB, Sprite and packed-alpha video constructors all connect visible and shadow clipping',async()=>{
 const api=await runtime();class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}setScalar(n){return this.set(n,n,n);}fromArray(a){return this.set(...a);}sub(){return this;}divideScalar(){return this;}}
 class Group{constructor(){this.children=[];this.position=new V();this.scale=new V(1,1,1);this.rotation=new V();this.userData={};}add(o){o.parent=this;this.children.push(o);}traverse(fn){fn(this);for(const o of this.children)o.traverse?o.traverse(fn):fn(o);}}
 class Material{constructor(p={}){Object.assign(this,{opacity:1,transparent:false,depthWrite:true,userData:{}},p);}}
 class ShaderMaterial extends Material{constructor(p){super(p);this.isShaderMaterial=true;}}
 class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material,isMesh:true});}}
 const texture=()=>({image:{width:64,height:64},repeat:{set(){}},offset:{set(){}}});
 const THREE={Group,Vector3:V,Box3:class{setFromObject(){return this;}getSize(){return new V(1,1,1);}getCenter(){return new V();}},TextureLoader:class{async loadAsync(){return texture();}},VideoTexture:class{constructor(){Object.assign(this,texture());}},MeshBasicMaterial:Material,ShaderMaterial,MeshDepthMaterial:Material,Mesh,PlaneGeometry:class{},MathUtils:{degToRad:d=>d*Math.PI/180}};
 const video={videoWidth:128,videoHeight:64,setAttribute(){},load(){this.onloadedmetadata?.();},pause(){},play(){return Promise.resolve();}};
 const ctx={THREE,URL,setTimeout,clearTimeout,document:{createElement:()=>({...video})},GLTFLoader:class{setDRACOLoader(){}async loadAsync(){const scene=new Group();scene.add(new Mesh({},new Material()));return {scene,animations:[]};}},DRACOLoader:class{setDecoderPath(){}},createBoxMask:()=>({enabled:false,planes:Array.from({length:6},()=>({}))}),updateBoxMask:(state,spec)=>{state.enabled=spec.boxMask.enabled;state.mode=spec.boxMask.mode;},applyBoxMask:api.applyBoxMask,patchPackedAlphaDepth(){},spriteSpec:s=>s,spriteFrame:()=>({x:0,y:0})};
 vm.createContext(ctx);const source=await readFile(new URL('../studio/media.js',import.meta.url),'utf8');vm.runInContext(source.replace(/^import .*;\n/gm,'').replace('export class MediaScene','class MediaScene').replace("new URL('../', import.meta.url)","new URL('https://example.test/')")+';globalThis.Media=MediaScene;',ctx);
 const media=new ctx.Media(()=>'',new URL('https://example.test/'));
 for(const kind of ['glb','sprite','video']){
  const item=await media.add({id:kind,kind,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],boxMask:mask(),shadow:true,interaction:{loop:true},sprite:{columns:1,rows:1,frameWidth:64,frameHeight:64,frames:1,fps:1},fallback:{src:'a.mp4',packedAlpha:true}});
  let meshes=0;item.motion.traverse(node=>{if(!node.isMesh)return;meshes++;assert.equal(node.material.clippingPlanes,item.mask.planes);assert.equal(node.material.clipShadows,true);if(node.customDepthMaterial)assert.equal(node.customDepthMaterial.clippingPlanes,item.mask.planes);if(kind==='video'){assert.match(node.material.vertexShader,/#include <clipping_planes_vertex>/);assert.match(node.material.fragmentShader,/#include <clipping_planes_fragment>/);assert.match(node.material.fragmentShader,/0\.5\+vUv.x\*0\.5/);}});assert.ok(meshes>0);
 }
});
test('analytic masks distinguish box, ellipsoid, cylinder and planar windows in normalized coordinates',()=>{
 assert.equal(normalizedMaskInside('ellipsoid',[.4,.4,0]),false);assert.equal(normalizedMaskInside('box',[.4,.4,0]),true);
 assert.equal(normalizedMaskInside('ellipsoid',[0,0,.6]),false);assert.equal(normalizedMaskInside('cylinder',[.1,.1,.6]),false);
 assert.equal(normalizedMaskInside('circle',[.1,.1,100]),true);assert.equal(normalizedMaskInside('circle',[.4,.4,0]),false);
 assert.equal(normalizedMaskInside('rectangle',[.4,.4,-100]),true);assert.equal(normalizedMaskInside('rectangle',[.6,0,0]),false);
});
test('mask animation moves, rotates and scales independently, including loop and pingpong endpoints',()=>{
 const m={...mask(),animation:{...defaultMaskAnimation(),enabled:true,duration:2,move:[1,0,0],rotate:[0,0,90],scale:[2,1,.5]}};
 const before=structuredClone(m),start=maskPose(m,0),end=maskPose(m,2),returning=maskPose(m,3),loop=maskPose(m,4);
 assert.deepEqual(start.position,m.position);assert.equal(end.position[0],1);assert.equal(end.rotation[2],90);assert.equal(end.size[0],1);assert.equal(end.size[2],.25);assert.equal(returning.position[0],.5);assert.deepEqual(loop,start);assert.deepEqual(m,before);
 m.animation.loop=false;assert.deepEqual(maskPose(m,10),start);m.animation.pingpong=false;assert.equal(maskPose(m,10).position[0],1);
 assert.throws(()=>validateBoxMask({...m,animation:{...m.animation,duration:0}}));
});
test('curve mask shader hooks preserve existing alpha/depth hooks and share uniforms for animated matrices',async()=>{
 const source=await readFile(new URL('../studio/box-mask.js',import.meta.url),'utf8'),ctx={};vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.install=installShapeShader;',ctx);
 const state={uniforms:{artMaskActive:{value:1},artMaskInverse:{value:'animated inverse'}}},material={userData:{},onBeforeCompile(shader){shader.fragmentShader+='\n// original packed alpha depth';},customProgramCacheKey(){return 'original-key';}};ctx.install(material,state);
 for(const vertexShader of ['void main(){vec3 transformed=position;\n#include <project_vertex>\n}','void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;}']){
 const shader={uniforms:{},vertexShader,fragmentShader:'void main(){gl_FragColor=vec4(1.0);}'};material.onBeforeCompile(shader);assert.match(shader.vertexShader,/vArtMaskWorld=\(modelMatrix\*/);assert.match(shader.fragmentShader,/original packed alpha depth/);assert.match(shader.fragmentShader,/insideMask/);assert.equal(shader.uniforms.artMaskInverse,state.uniforms.artMaskInverse);
 }
 assert.equal(material.customProgramCacheKey(),'original-key|ararart-portals-0111');
});
test('curved and planar masks with animation survive authored project serialization',async()=>{
 const p=toProject(JSON.parse(await readFile(new URL('../public/scenes/demo-interactive/scene.json',import.meta.url)))),o=p.scenes.flatMap(s=>s.objects)[0];
 for(const type of ['box','ellipsoid','cylinder','circle','rectangle']){
  o.boxMask={...mask(),type,name:'動く窓',animation:{...defaultMaskAnimation(),enabled:true}};
  validateScene(p);const restored=toProject(JSON.parse(JSON.stringify(p)));assert.deepEqual(restored.scenes.flatMap(s=>s.objects)[0].boxMask,o.boxMask);
 }
});
test('peephole is perspective-correct: depth world is visible through the aperture despite being outside the old extrusion',()=>{
 assert.equal(portalPointInside('rectangle',[0,0,2],[.8,0,-2]),true);
 assert.equal(portalPointInside('circle',[0,0,2],[.8,0,-2]),true);
 assert.equal(portalPointInside('rectangle',[0,0,2],[1.2,0,-2]),false);
 assert.equal(portalPointInside('circle',[0,0,2],[.8,.8,-2]),false);
 // Looking sideways shifts what is visible behind the same window.
 assert.equal(portalPointInside('rectangle',[2,0,2],[.8,0,-2]),false);
 // Objects between the eye and window, or parallel rays, are not inside the portal.
 assert.equal(portalPointInside('rectangle',[0,0,2],[0,0,1]),false);
 assert.equal(portalPointInside('rectangle',[0,0,0],[1,0,0]),false);
});
test('common window targets every scene artwork in space mode and same-marker artwork in marker mode',()=>{
 const p={experienceMode:'marker',scenes:[{objects:[{id:'window',markerId:'a',boxMask:{...mask(),type:'circle',scope:'scene'}},{id:'glb',markerId:'a'},{id:'webm',markerId:'a'},{id:'sprite',markerId:'b'}]},{objects:[{id:'other',markerId:'a'}]}]};
 let sources=sceneMaskSources(p);assert.equal(sources.get('glb'),'window');assert.equal(sources.get('webm'),'window');assert.equal(sources.has('sprite'),false);assert.equal(sources.has('other'),false);
 p.experienceMode='space';sources=sceneMaskSources(p);assert.equal(sources.get('sprite'),'window');p.scenes[0].objects[0].boxMask.enabled=false;assert.equal(sceneMaskSources(p).size,0);
});
test('common window runtime uses source frame and animation time for all media, then releases on removal',async()=>{
 const source=await readFile(new URL('../studio/media.js',import.meta.url),'utf8'),calls=[];
 const ctx={URL,sceneMaskSources,createBoxMask:()=>({}),updateBoxMask:(state,spec,parent,time)=>{state.enabled=!!spec.boxMask?.enabled;calls.push({spec,parent,time});},applyBoxMask(){}};vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;\n/gm,'').replace('export class MediaScene','class MediaScene').replace("new URL('../', import.meta.url)","new URL('https://example.test/')")+';globalThis.Media=MediaScene;',ctx);
 const a={id:'a',markerId:'one',boxMask:{...mask(),type:'rectangle',scope:'scene'}},b={id:'b',markerId:'one'},p={scenes:[{objects:[a,b]}]},media=Object.create(ctx.Media.prototype);
 media.items=new Map([['a',{spec:a,maskTime:3,group:{parent:'window frame'},mask:{},motion:{}}],['b',{spec:b,maskTime:20,group:{parent:'artwork frame'},mask:{},motion:{}}]]);
 media.updateMasks(p);assert.equal(calls.length,2);assert.equal(calls[1].spec,a);assert.equal(calls[1].parent,'window frame');assert.equal(calls[1].time,3);
 const receiver={userData:{},parent:'ground frame'};media.maskReceiver(receiver,'b');assert.equal(calls.at(-1).spec,a);assert.equal(calls.at(-1).parent,'window frame');delete a.boxMask;media.updateMasks(p);media.maskReceiver(receiver,'b');assert.equal(receiver.userData.portalMaskState.enabled,false);assert.equal(media.items.get('b').mask.enabled,false);
});
