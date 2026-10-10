/** Build a dedicated scene without changing existing scenes or artwork settings. */
export function createPairScene(project,{sourceSceneId,sourceMarkerId,targetMarker,newId=()=>crypto.randomUUID()}){
 const source=project.scenes.find(s=>s.id===sourceSceneId),marker=project.markers.find(m=>m.id===sourceMarkerId);
 if(!source||!marker)throw new Error('複製元のシーン・マーカーがありません。');
 if(project.markers.length!==1)throw new Error('専用作成はマーカー1枚のプロジェクトで使用してください。');
 if(!targetMarker||targetMarker.id===sourceMarkerId||project.markers.some(m=>m.id===targetMarker.id)||targetMarker.targetIndex!==project.markers.length)throw new Error('2枚目のマーカー設定が不正です。');
 const originals=source.objects.filter(o=>o.markerId===sourceMarkerId);
 if(!originals.length)throw new Error('1枚目のマーカーに作品を配置してください。');
 if(originals.length*2>24)throw new Error('専用作成の複製元は12作品以内にしてください。');
 if(project.scenes.length>=12||project.scenes.flatMap(s=>s.objects).length+originals.length*2>48)throw new Error('シーン数または全体の作品数の上限を超えます。');
 const used=new Set([...project.scenes.map(s=>s.id),...project.scenes.flatMap(s=>s.objects.map(o=>o.id))]);
 const fresh=()=>{const id=newId();if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)||used.has(id))throw new Error('新しいIDを作成できません。');used.add(id);return id;};
 const result={id:fresh(),name:'2マーカー同時表示',autoNextSeconds:0,nextSceneId:null,markerLost:'pause',objects:[]};
 for(const [id,label] of [[sourceMarkerId,'A'],[targetMarker.id,'B']])for(const original of originals){const o=structuredClone(original);o.id=fresh();o.markerId=id;o.name=(original.name+' / '+label).slice(0,100);o.interaction.nextSceneId=null;result.objects.push(o);}
 return result;
}
export async function compileMarkerSet(blobs,{decode,compiler,onProgress}){
 const images=await Promise.all(blobs.map(decode));
 const data=await compiler.compileImageTargets(images,onProgress);
 if(!data?.length)throw new Error('認識データを生成できません。');
 const bytes=await compiler.exportData();if(!bytes?.byteLength)throw new Error('認識データが空です。');return bytes;
}
export function markerStates(project,sceneId,visible){const states=new Map();for(const s of project.scenes)for(const o of s.objects){const active=s.id===sceneId;states.set(o.id,{active,gate:active&&(s.markerLost==='continue'||visible.has(o.markerId))});}return states;}
export function trackingSummary(project,sceneId,visible){const s=project.scenes.find(s=>s.id===sceneId),needed=new Set(s?.objects.map(o=>o.markerId)||[]),markers=project.markers.filter(m=>needed.has(m.id)&&visible.has(m.id));return{count:markers.length,limit:Math.min(project.maxTrack,needed.size),names:markers.map(m=>m.name)};}
