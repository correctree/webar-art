// ARARART Studio 0.17.1.3 — CHROME REFLECTION QUALITY CONTROL
// Drop-in replacement for 0.17.1.2. Does not change GLB animation or media pipeline.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const VERSION = '0.17.1.3';
import {reflectionSettings,reflectionProfiles} from './reflection-policy.js';
const profiles=reflectionProfiles;
let {profile:profileName,intensity}=reflectionSettings();
const state={version:VERSION,profile:profileName,intensity,patched:false,gltfLoaded:0,chromeMeshes:0,errors:[]};
const envCache = new Map();
const patchedMark = '__ararartChrome0171'; // preserve previous installation guard

function clamp(v) {return Math.max(0, Math.min(255, Math.round(v)));}
function adjustedHex(hex, exposure, contrast) {
  const n = parseInt(hex.slice(1),16);
  const c = [n>>16,(n>>8)&255,n&255].map(v=>clamp(((v/255-.5)*contrast+.5)*exposure*255));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function getEnvironment(name) {
  if (envCache.has(name)) return envCache.get(name);
  const cfg = profiles[name];
  const canvas = document.createElement('canvas');
  canvas.width=1024; canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Canvas 2D unavailable');
  const gradient=ctx.createLinearGradient(0,0,0,512);
  for(const [y,color] of [[0,'#cbd4df'],[.22,'#f2f4f8'],[.47,'#646e7c'],[.55,'#333a43'],[.77,'#828995'],[1,'#0c1119']]) {
    gradient.addColorStop(y,adjustedHex(color,cfg.exposure,cfg.contrast));
  }
  ctx.fillStyle=gradient; ctx.fillRect(0,0,1024,512);
  function softbox(cx,cy,w,h,strength=1){
    const sf=cfg.softness;
    for(let i=15;i>=0;i--){
      const t=i/15;
      const pad=24*t*sf;
      ctx.fillStyle=`rgba(255,255,255,${Math.min(1,(.012+(1-t)*.041)*strength*cfg.exposure)})`;
      ctx.fillRect(cx-w/2-pad,cy-h/2-pad,w+2*pad,h+2*pad);
    }
    ctx.fillStyle=`rgba(255,255,255,${Math.min(1,.82*strength*cfg.exposure)})`;
    ctx.fillRect(cx-w/2,cy-h/2,w,h);
  }
  softbox(120,185,45,245,.9);
  softbox(346,115,185,66,.85);
  softbox(670,180,55,300,.85);
  softbox(880,122,170,56,.95);
  softbox(1000,230,25,165,.7);
  const texture=new THREE.CanvasTexture(canvas);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.name=`ARARART_CHROME_${name}_${VERSION}`;
  texture.userData.ararartSharedReflection=true;
  envCache.set(name,texture);
  return texture;
}
function isChrome(mat, objectName=''){
  if(!mat || (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial))return false;
  const label=`${mat.name||''} ${objectName}`.toLowerCase();
  if(/chrome|liquid.?metal|liquid.?chrome|mercury|鏡面/.test(label))return true;
  const c=mat.color;
  const neutral=!c||(Math.max(c.r,c.g,c.b)-Math.min(c.r,c.g,c.b)<.18);
  return mat.metalness>=.98&&mat.roughness<=.13&&neutral;
}
const enhanced = new Set();
export function configureReflection(settings={}) {
 const next=reflectionSettings(settings);
 const texture=getEnvironment(next.profile);
 profileName=next.profile;intensity=next.intensity;
 state.profile=profileName;state.intensity=intensity;
 for(const material of enhanced){material.envMap=texture;material.envMapIntensity=intensity;material.needsUpdate=true;}
 return {...next};
}
function applyIntensity(value){return configureReflection({profile:profileName,intensity:Number(value)}).intensity;}
function enhance(gltf){
  if(!gltf?.scene)return gltf;
  state.gltfLoaded++;
  const seen=new Set();
  for(const root of gltf.scenes?.length ? gltf.scenes : [gltf.scene]){
    root.traverse(obj=>{
      if(!obj.isMesh || seen.has(obj))return;
      seen.add(obj);
      const original=obj.material;
      const mats=Array.isArray(original)?original:[original];
      let changed=false;
      const next=mats.map(mat=>{
        if(!isChrome(mat,`${root.name||''} ${obj.name||''}`))return mat;
        const copy=mat.clone(); // do not mutate materials shared with other objects
        copy.envMap=getEnvironment(profileName);
        copy.envMapIntensity=intensity;
        copy.metalness=1;
        copy.roughness=Math.min(.12,Math.max(.055,mat.roughness));
        copy.needsUpdate=true;
        enhanced.add(copy);
        copy.addEventListener('dispose',()=>enhanced.delete(copy));
        changed=true;
        state.chromeMeshes++;
        return copy;
      });
      if(changed)obj.material=Array.isArray(original)?next:next[0];
    });
  }
  return gltf;
}
if(!GLTFLoader.prototype[patchedMark]){
  const parse=GLTFLoader.prototype.parse;
  GLTFLoader.prototype.parse=function(data,path,onLoad,onError){
    return parse.call(this,data,path,function(gltf){
      try{enhance(gltf);}catch(e){state.errors.push(String(e));console.warn('[ARARART Chrome] enhancement skipped',e);}
      if(typeof onLoad==='function')onLoad(gltf);
    },onError);
  };
  GLTFLoader.prototype[patchedMark]=true;
  state.patched=true;
}
window.ARARARTChromeFix=Object.freeze({
  version:VERSION,
  status:()=>({...state,errors:[...state.errors],profile:profileName,intensity,activeMaterials:enhanced.size}),
  configure:configureReflection,
  setIntensity:applyIntensity,
  profiles:Object.keys(profiles)
});
console.info('[ARARART Chrome]',VERSION,'profile:',profileName,'intensity:',intensity);
