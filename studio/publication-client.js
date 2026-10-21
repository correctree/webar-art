// Fingerprints use Git's blob hash, so unchanged media never needs to leave the PC.
export async function gitBlobHash(content,cryptoAPI=globalThis.crypto){
 const raw=atob(content),header=new TextEncoder().encode('blob '+raw.length+'\0'),bytes=new Uint8Array(header.length+raw.length);bytes.set(header);
 for(let start=0;start<raw.length;start+=1048576){const end=Math.min(raw.length,start+1048576);for(let i=start;i<end;i++)bytes[header.length+i]=raw.charCodeAt(i);if(end<raw.length)await new Promise(r=>setTimeout(r,0));}
 const digest=await cryptoAPI.subtle.digest('SHA-1',bytes);return{sha:[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join(''),size:raw.length};
}
export async function preparePublication(data,{fetcher=globalThis.fetch,onProgress=()=>{},hash=gitBlobHash}={}){
 onProgress('公開済み素材と照合しています…');
 const r=await fetcher('/api/publish-assets?scene='+encodeURIComponent(data.scene.id),{signal:AbortSignal.timeout(30000)});
 if(!r.ok){const e=await r.json();throw Error(e.error||'公開済み素材を取得できません。');}
 const plan=await r.json();if(!plan.baseSha||!Array.isArray(plan.assets))throw Error('差分送信の応答が不正です。');
 const known=new Map(plan.assets.map(f=>[f.name,f])),files=[],reused=[];let count=0;
 for(const f of data.files){const digest=await hash(f.content),old=known.get(f.name);if(old?.sha===digest.sha&&old?.size===digest.size)reused.push({name:f.name,...digest});else files.push(f);onProgress(`素材照合 ${++count}/${data.files.length}：再利用 ${reused.length}点`);}
 return{scene:data.scene,files,reused,baseSha:plan.baseSha};
}
export async function pollPublication(id,{fetcher=globalThis.fetch,onStatus=()=>{},wait=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now,maxMs=20*60*1000}={}){
 const started=now();let failures=0;
 while(now()-started<maxMs){
  let job;
  try{const r=await fetcher('/api/jobs/'+encodeURIComponent(id),{signal:AbortSignal.timeout(45000)});const data=await r.json();if(!r.ok){if([401,403,404].includes(r.status))throw Object.assign(Error(data.error||'公開確認を再開できません。'),{terminal:true});throw Error(data.error||'状態を取得できません。');}job=data;failures=0;}
  catch(e){if(e.terminal)throw e;failures++;onStatus({state:'retrying',message:`公開状況の通信を再試行しています（${failures}回）。GitHub上の公開処理は継続します。`,elapsed:Math.floor((now()-started)/1000)});await wait(Math.min(10000,2000*failures));continue;}
  onStatus(job);if(job.state==='failed')throw Object.assign(Error(job.message),{terminal:true});if(job.state==='ready')return job;
  await wait(job.state==='verifying'?2000:job.state==='building'?3000:5000);
 }
 throw Error('公開確認を一時停止しました。「公開状況を再確認」で続きから確認できます。GitHub上の処理は停止していません。');
}
