// Use the same pinned release for the JS module and its WASM files.
export const sources=[
 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18',
 'https://unpkg.com/@mediapipe/tasks-vision@0.10.18'
];
export async function loadVision({importer=url=>import(url),report=()=>{},isCancelled=()=>false}={}){
 const failures=[];
 for(const base of sources){
  if(isCancelled())throw new Error('開始をキャンセルしました');
  const url=base+'/vision_bundle.mjs';report('MediaPipe読込: '+url);
  try{
   const module=await importer(url);
   if(isCancelled())throw new Error('開始をキャンセルしました');
   if(!module.FaceLandmarker||!module.FilesetResolver)throw new Error('必要なAPIがありません');
   report('WASM準備: '+base+'/wasm');
   const files=await module.FilesetResolver.forVisionTasks(base+'/wasm');
   return {FaceLandmarker:module.FaceLandmarker,files};
  }catch(e){failures.push(url+'\n'+(e.message||e));}
 }
 throw new Error('MediaPipeの読み込みに失敗しました。\n'+failures.join('\n'));
}
