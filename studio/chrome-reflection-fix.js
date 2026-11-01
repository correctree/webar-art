// ARARART Studio 0.17.1 — selective chrome reflection add-on.
// No changes to editor.js, WebM, Sprite or GLB animation playback.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const VERSION = '0.17.1';
const STATE = { version: VERSION, patched: false, gltfLoaded: 0, chromeMeshes: 0, errors: [] };
let environment = null;

function makeEnvironment() {
  if (environment) return environment;
  // Self-contained studio reflection: no external HDR assets or renderer access required.
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0.0, '#cbd4df');
  gradient.addColorStop(0.22, '#f2f4f8');
  gradient.addColorStop(0.47, '#646e7c');
  gradient.addColorStop(0.55, '#333a43');
  gradient.addColorStop(0.77, '#828995');
  gradient.addColorStop(1.0, '#0c1119');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function softbox(cx, cy, width, height, strength=1) {
    // Repeated translucent bands soften a hard rectangle's border.
    for (let i=15; i>=0; i--) {
      const t = i/15;
      const pad = 24*t;
      ctx.fillStyle = `rgba(255,255,255,${(0.012 + (1-t)*0.041)*strength})`;
      ctx.fillRect(cx-width/2-pad, cy-height/2-pad,
                   width+2*pad, height+2*pad);
    }
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1,0.82*strength)})`;
    ctx.fillRect(cx-width/2,cy-height/2,width,height);
  }
  softbox(120, 185, 45, 245, 0.9);
  softbox(346, 115, 185, 66, 0.85);
  softbox(670, 180, 55, 300, 0.85);
  softbox(880, 122, 170, 56, 0.95);
  softbox(1000, 230, 25, 165, 0.7);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.name = 'ARARART_Chrome_Studio_Environment_0.17.1';
  environment = tex;
  return tex;
}

function isChrome(material, objectName='') {
  if (!material || (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial)) return false;
  const label = `${material.name || ''} ${objectName}`.toLowerCase();
  if (/chrome|liquid.?metal|liquid.?chrome|mercury|鏡面/.test(label)) return true;
  // Fallback only for highly polished, nearly fully metallic neutral materials.
  const c = material.color;
  const neutral = !c || (Math.max(c.r,c.g,c.b)-Math.min(c.r,c.g,c.b)<0.18);
  return material.metalness >= 0.98 && material.roughness <= 0.13 && neutral;
}

function fixGLTF(gltf) {
  if (!gltf || !gltf.scene) return gltf;
  STATE.gltfLoaded++;
  const objectSet = new Set();
  const scenes = Array.isArray(gltf.scenes) && gltf.scenes.length ? gltf.scenes : [gltf.scene];
  for (const root of scenes) root.traverse(obj => {
    if (!obj.isMesh || objectSet.has(obj)) return;
    objectSet.add(obj);
    const original = obj.material;
    const mats = Array.isArray(original) ? original : [original];
    let changed = false;
    const next = mats.map(mat => {
      if (!isChrome(mat, `${root.name || ''} ${obj.name || ''}`)) return mat;
      // Clone because the same material may be shared with an unrelated mesh.
      const copy = mat.clone();
      copy.envMap = makeEnvironment();
      copy.envMapIntensity = 1.6;
      // Keep the GLB's authored base color, animations and morph targets intact.
      copy.metalness = 1.0;
      copy.roughness = Math.min(0.12, Math.max(0.055, mat.roughness));
      copy.needsUpdate = true;
      changed = true;
      STATE.chromeMeshes++;
      return copy;
    });
    if (changed) obj.material = Array.isArray(original) ? next : next[0];
  });
  if (STATE.chromeMeshes) console.info('[ARARART Chrome Fix]', STATE);
  return gltf;
}

// GLTFLoader.load() internally uses parse(); wrapping parse also catches editor imports
// that use FileReader -> parse(), while preserving onLoad callback, clips and scenes.
if (!GLTFLoader.prototype.__ararartChrome0171) {
  const originalParse = GLTFLoader.prototype.parse;
  GLTFLoader.prototype.parse = function(data, path, onLoad, onError) {
    return originalParse.call(this, data, path, function(gltf) {
      try { fixGLTF(gltf); }
      catch(err) {
        STATE.errors.push(String(err));
        console.warn('[ARARART Chrome Fix] Enhancement skipped:', err);
      }
      if (typeof onLoad === 'function') onLoad(gltf);
    }, onError);
  };
  GLTFLoader.prototype.__ararartChrome0171 = true;
  STATE.patched = true;
}
window.ARARARTChromeFix = Object.freeze({ status: () => ({...STATE}), version: VERSION });
console.info('[ARARART Chrome Fix] 0.17.1 installed; original editor.js will load next.');
