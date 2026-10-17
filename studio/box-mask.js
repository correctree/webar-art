import * as THREE from 'three';
import {maskPointVisible,maskPose,normalizedMaskInside,portalPointInside} from './box-mask-policy.js';
const axes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export function createBoxMask(){return {planes:axes.map(()=>new THREE.Plane()),matrix:new THREE.Matrix4(),position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),size:new THREE.Vector3(),rotation:new THREE.Euler(),enabled:false,inverse:new THREE.Matrix4(),uniforms:{artMaskInverse:{value:new THREE.Matrix4()},artMaskType:{value:0},artMaskOutside:{value:0},artMaskActive:{value:0},artMaskEye:{value:new THREE.Vector3()}}};}
export function updateBoxMask(state,spec,parent,time=0){
 const mask=spec.boxMask;state.enabled=!!mask?.enabled;state.mode=mask?.mode||'inside';state.type=mask?.type||'box';if(state.uniforms)state.uniforms.artMaskActive.value=state.enabled&&state.type!=='box'?1:0;if(!state.enabled)return;
 parent?.updateWorldMatrix(true,false);
 const pose=maskPose(mask,time);state.position.fromArray(pose.position);state.size.fromArray(pose.size);state.rotation.set(...pose.rotation.map(THREE.MathUtils.degToRad));state.quaternion.setFromEuler(state.rotation);
 state.matrix.compose(state.position,state.quaternion,state.size);if(parent)state.matrix.premultiply(parent.matrixWorld);
 if(state.inverse){state.inverse.copy(state.matrix).invert();state.uniforms.artMaskInverse.value.copy(state.inverse);state.uniforms.artMaskType.value=state.type==='ellipsoid'?1:state.type==='cylinder'?2:state.type==='circle'?3:4;state.uniforms.artMaskOutside.value=state.mode==='outside'?1:0;}
 for(let i=0;i<6;i++){state.planes[i].set(new THREE.Vector3(...axes[i]),.5).applyMatrix4(state.matrix);if(state.mode==='outside')state.planes[i].negate();}
}
export function applyBoxMask(root,state){
 root.traverse(node=>{for(const material of [...[].concat(node.material||[]),node.customDepthMaterial,node.customDistanceMaterial].filter(Boolean)){
  const planes=state.enabled&&(state.type||'box')==='box'?state.planes:null,intersection=state.mode==='outside';
  if(state.uniforms)installShapeShader(material,state);if(material.clippingPlanes?.length===planes?.length&&material.clippingPlanes?.every((p,i)=>p===planes[i])&&material.clipIntersection===intersection)continue;
  if(material.clippingPlanes!==planes||material.clipIntersection!==intersection){material.clippingPlanes=planes;material.clipIntersection=intersection;material.clipShadows=true;if(material.isShaderMaterial)material.clipping=true;material.needsUpdate=true;}
 }});
}
export function boxMaskAllows(state,point){
 if(!state?.enabled)return true;
 // Outside mode uses reversed planes for the renderer; recover original signs.
 if(state.inverse&&state.type&&state.type!=='box'){const local=point.clone().applyMatrix4(state.inverse);const inside=['circle','rectangle'].includes(state.type)?portalPointInside(state.type,state.uniforms.artMaskEye.value.clone().applyMatrix4(state.inverse).toArray(),local.toArray()):normalizedMaskInside(state.type,local.toArray());return state.mode==='outside'?!inside:inside;}
 const distances=state.planes.map(p=>p.distanceToPoint(point)*(state.mode==='outside'?-1:1));
 return maskPointVisible(distances,state.mode);
}

// Hook existing shaders after skinning/morphing and preserve packed-alpha hooks.
export function installShapeShader(material,state){
 material.userData??={};if(material.userData.arMaskShader===state)return;material.userData.arMaskShader=state;
 const before=material.onBeforeCompile,cache=material.customProgramCacheKey?.bind(material);
 material.onBeforeCompile=function(shader,renderer){
  before?.call(this,shader,renderer);Object.assign(shader.uniforms,state.uniforms);
  const declarations='varying vec3 vArtMaskWorld;\n';
  shader.vertexShader=declarations+shader.vertexShader;
  const code=`vec4 artMaskPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
artMaskPosition=instanceMatrix*artMaskPosition;
#endif
vArtMaskWorld=(modelMatrix*artMaskPosition).xyz;`;
  if(shader.vertexShader.includes('#include <project_vertex>'))shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n'+code);
  else shader.vertexShader=shader.vertexShader.replace('gl_Position=projectionMatrix*mvPosition;','gl_Position=projectionMatrix*mvPosition;vArtMaskWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=declarations+'uniform mat4 artMaskInverse;uniform float artMaskType;uniform float artMaskOutside;uniform float artMaskActive;uniform vec3 artMaskEye;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,`void main(){
if(artMaskActive>0.5){vec3 p=(artMaskInverse*vec4(vArtMaskWorld,1.0)).xyz;
bool insideMask=false;
if(artMaskType<1.5)insideMask=dot(p,p)<=0.25;
else if(artMaskType<2.5)insideMask=dot(p.xy,p.xy)<=0.25&&abs(p.z)<=0.5;
else {vec3 eye=(artMaskInverse*vec4(artMaskEye,1.0)).xyz;float dz=p.z-eye.z;
if(abs(dz)>0.0000001){float t=-eye.z/dz;vec2 aperture=eye.xy+t*(p.xy-eye.xy);
insideMask=t>=0.0&&t<=1.0&&(artMaskType>3.5?(abs(aperture.x)<=0.5&&abs(aperture.y)<=0.5):dot(aperture,aperture)<=0.25);}}
if((artMaskOutside<0.5&&!insideMask)||(artMaskOutside>0.5&&insideMask))discard;}
`);
 };
 material.customProgramCacheKey=()=>String(cache?.()||'')+'|ararart-portals-0111';material.needsUpdate=true;
}
