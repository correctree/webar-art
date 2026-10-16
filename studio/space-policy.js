// Studio X/Y lie on the reference plane; Z is height. One rigid transform
// maps every artwork and its local animation into the AR world.
export const SPACE_SCALE=.35;
export function studioToWorld(position,anchor,scale=SPACE_SCALE){return [anchor[0]+position[0]*scale,anchor[1]+position[2]*scale,anchor[2]-position[1]*scale];}
export function placementCheck(relative){
 if(!Array.isArray(relative)||relative.length!==3||!relative.every(Number.isFinite))return {accepted:false,reason:'INVALID_POSITION'};
 const distance=Math.hypot(...relative);
 const reason=relative[2]>=0?'BEHIND_CAMERA':distance<.5?'TOO_CLOSE':-relative[2]<.35?'INSUFFICIENT_FORWARD_DEPTH':'ACCEPTED';
 return {accepted:reason==='ACCEPTED',reason,distance};
}
export function spaceGate(sceneId,currentSceneId,placed,tracking){return sceneId===currentSceneId&&placed&&tracking==='NORMAL';}
