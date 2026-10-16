import * as THREE from 'three';
import {maskPointVisible} from './box-mask-policy.js';
const axes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export function createBoxMask(){return {planes:axes.map(()=>new THREE.Plane()),matrix:new THREE.Matrix4(),position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),size:new THREE.Vector3(),rotation:new THREE.Euler(),enabled:false};}
export function updateBoxMask(state,spec,parent){
 const mask=spec.boxMask;state.enabled=!!mask?.enabled;state.mode=mask?.mode||'inside';if(!state.enabled)return;
 parent?.updateWorldMatrix(true,false);
 state.position.fromArray(mask.position);state.size.fromArray(mask.size);state.rotation.set(...mask.rotation.map(THREE.MathUtils.degToRad));state.quaternion.setFromEuler(state.rotation);
 state.matrix.compose(state.position,state.quaternion,state.size);if(parent)state.matrix.premultiply(parent.matrixWorld);
 for(let i=0;i<6;i++){state.planes[i].set(new THREE.Vector3(...axes[i]),.5).applyMatrix4(state.matrix);if(state.mode==='outside')state.planes[i].negate();}
}
export function applyBoxMask(root,state){
 root.traverse(node=>{for(const material of [...[].concat(node.material||[]),node.customDepthMaterial,node.customDistanceMaterial].filter(Boolean)){
  const planes=state.enabled?state.planes:null,intersection=state.mode==='outside';
  if(material.clippingPlanes!==planes||material.clipIntersection!==intersection){material.clippingPlanes=planes;material.clipIntersection=intersection;material.clipShadows=true;if(material.isShaderMaterial)material.clipping=true;material.needsUpdate=true;}
 }});
}
export function boxMaskAllows(state,point){
 if(!state?.enabled)return true;
 // Outside mode uses reversed planes for the renderer; recover original signs.
 const distances=state.planes.map(p=>p.distanceToPoint(point)*(state.mode==='outside'?-1:1));
 return maskPointVisible(distances,state.mode);
}
