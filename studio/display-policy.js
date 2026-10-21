// An explicit overlay is for labels/collages that should not be occluded by other artwork.
// Normal mode retains the imported material's depth and face settings.
export function validateDisplay(spec){if(spec.displayMode!==undefined&&!['depth','front'].includes(spec.displayMode))throw Error('重なり表示の設定が不正です。');if(spec.doubleSided!==undefined&&typeof spec.doubleSided!=='boolean')throw Error('両面表示の設定が不正です。');}
export function applyDisplayPolicy(item,doubleSide){
 const front=item.spec.displayMode==='front';
 item.group.userData.artRenderOrder??=item.group.renderOrder||0;
 item.group.renderOrder=front?10000:item.group.userData.artRenderOrder;
 item.motion.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.userData.artRenderOrder??=mesh.renderOrder||0;mesh.renderOrder=front?10000:mesh.userData.artRenderOrder;
  // Animated skinned geometry can leave the static imported bounding volume.
  if(mesh.isSkinnedMesh)mesh.frustumCulled=false;
  for(const m of [].concat(mesh.material||[])){
   m.userData.artDisplayBase??={side:m.side,depthTest:m.depthTest??true,depthWrite:m.userData.artBase?.depthWrite??m.depthWrite,transparent:m.userData.artBase?.transparent??m.transparent};
   const base=m.userData.artDisplayBase,opacity=(item.spec.opacity??1)*(item.fade??1);
   const next={side:item.spec.doubleSided?doubleSide:base.side,depthTest:front?false:base.depthTest,depthWrite:front||opacity<1?false:base.depthWrite,transparent:front||base.transparent||opacity<1};
   for(const [key,value]of Object.entries(next))if(m[key]!==value){m[key]=value;m.needsUpdate=true;}
  }
 });
}
