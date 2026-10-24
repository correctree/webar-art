export function editingMarker(project,requested){return project.markers.find(m=>m.id===requested)?.id||project.markers.find(m=>m.id===project.editorMarkerId)?.id||project.markers[0]?.id||null;}
export function markerRemovalPlan(project,id,targetId){
 const removed=project.markers.find(m=>m.id===id);if(!removed)throw Error('削除するマーカーがありません。');
 const markers=project.markers.filter(m=>m.id!==id).map((m,targetIndex)=>({...m,targetIndex}));
 const affected=project.scenes.flatMap(s=>s.objects).filter(o=>o.markerId===id);
 if(!markers.length&&affected.length)throw Error('作品がある最後のマーカーは削除できません。先に別のマーカーを追加してください。');
 const target=markers.find(m=>m.id===targetId);
 if(affected.length&&!target)throw Error('作品の移動先マーカーを選択してください。');
 return{removed,markers,affectedIds:affected.map(o=>o.id),targetId:target?.id||markers[0]?.id||null,maxTrack:Math.max(1,Math.min(project.maxTrack,markers.length))};
}
// Compile first; only the caller commits this result. A compilation error leaves the project intact.
export async function prepareMarkerRemoval(project,id,targetId,{blobs,compile,newTarget}={}){
 const plan=markerRemovalPlan(project,id,targetId);let bytes=null;
 if(plan.markers.length){const inputs=plan.markers.map(m=>{const b=blobs.get(m.image);if(!b)throw Error('マーカー画像が不足: '+m.name);return b;});bytes=await compile(inputs);if(!bytes?.byteLength)throw Error('認識データが空です。');}
 return{...plan,bytes,trackingTarget:bytes?newTarget():'pending.mind'};
}
