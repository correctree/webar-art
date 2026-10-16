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
// Aim midway inside the camera area above the controls, in CSS viewport pixels.
export function aimPoint(rect,panelTop=Infinity,toggleBottom=0){
 const top=Math.max(rect.top+70,toggleBottom+16),bottom=Math.min(rect.top+rect.height-90,panelTop-28);
 const y=bottom-top>=80?(top+bottom)/2:rect.top+rect.height*.28;
 return {x:.5,y:Math.max(.12,Math.min(.7,(y-rect.top)/rect.height))};
}
export function projectedCandidateCheck(ndc,aim){
 if(![ndc.x,ndc.y,ndc.z].every(Number.isFinite)||ndc.z< -1||ndc.z>1)return false;
 const x=(ndc.x+1)/2,y=(1-ndc.y)/2;
 return x>.08&&x<.92&&y>.08&&y<.85&&Math.hypot(x-aim.x,y-aim.y)<.12;
}
export function pairDistances(objects){const result=[];for(let i=0;i<objects.length;i++)for(let j=i+1;j<objects.length;j++)result.push({ids:[objects[i].id,objects[j].id],distance:Math.hypot(...objects[i].worldPosition.map((v,k)=>v-objects[j].worldPosition[k]))});return result;}
export function pairDrift(previous,current){const map=new Map(previous.map(p=>[p.ids.join('|'),p.distance]));let maximum=0;for(const p of current){const before=map.get(p.ids.join('|'));if(before!==undefined)maximum=Math.max(maximum,Math.abs(p.distance-before));}return maximum;}
