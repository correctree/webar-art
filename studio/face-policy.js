export const FACE_ANCHORS=[{id:'nose',name:'鼻',aspect:1},{id:'head',name:'頭上',aspect:1}];
export const isFace=p=>p.experienceMode==='face';
export const placementKey=(p,o)=>isFace(p)?(o.faceAnchor||'nose'):o.markerId;
export const placementTargets=p=>isFace(p)?FACE_ANCHORS:p.markers;
export function editingPlacement(p,id){const targets=placementTargets(p);return targets.find(t=>t.id===id)?.id||targets.find(t=>t.id===(isFace(p)?p.editorFaceAnchor:p.editorMarkerId))?.id||targets[0]?.id||null;}
export function setExperienceMode(p,mode){
 if(!['marker','space','face'].includes(mode))throw Error('体験モードが不正です。');
 if(mode!=='face'&&p.scenes.some(s=>s.objects.some(o=>!p.markers.some(m=>m.id===o.markerId))))throw Error('顔専用作品があります。別プロジェクトでマーカーAR・空間配置を制作してください。');
 p.experienceMode=mode;
 if(mode==='face')for(const s of p.scenes)for(const o of s.objects)o.faceAnchor??='nose';
}
export function faceRuntimeProject(p){const result=structuredClone(p);result.markers=FACE_ANCHORS.map((a,targetIndex)=>({...a,targetIndex}));result.maxTrack=2;for(const s of result.scenes)for(const o of s.objects)o.markerId=o.faceAnchor||'nose';return result;}
