import {validatePackage,validateScene,requiredAssets,sceneId} from '../studio/schema.js';
import {gitBlobSHA,validateDelta,mapLimit} from './publication-utils.mjs';
export class GitHubPublisher {
 constructor({owner,repo,branch='main',fetcher=fetch,now=Date.now}){if(!/^[a-zA-Z0-9-]+$/.test(owner)||!/^[a-zA-Z0-9_.-]+$/.test(repo)||!/^[-a-zA-Z0-9_/]+$/.test(branch))throw new Error('公開先設定が不正です。');Object.assign(this,{owner,repo,branch,fetcher,now});}
 async request(token,path,method='GET',body){const response=await this.fetcher('https://api.github.com'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'WebAR-Art-Publisher','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(!response.ok){const error=new Error('GitHub API '+response.status+'。権限・公開先・接続を確認してください。');error.status=response.status;throw error;}return response.status===204?null:response.json();}
 get root(){return '/repos/'+this.owner+'/'+this.repo;}
 get actionsURL(){return 'https://github.com/'+this.owner+'/'+this.repo+'/actions/workflows/pages.yml';}
 async sceneEntries(token,treeSHA,id){let sha=treeSHA;for(const segment of ['public','scenes',id]){const tree=await this.request(token,this.root+'/git/trees/'+sha);if(tree.truncated||!Array.isArray(tree.tree))throw Error('GitHubの素材一覧が不完全です。再試行してください。');const entry=tree.tree.find(e=>e.path===segment&&e.type==='tree');if(!entry)return new Map();sha=entry.sha;}
  const tree=await this.request(token,this.root+'/git/trees/'+sha);if(tree.truncated||!Array.isArray(tree.tree))throw Error('GitHubの素材一覧が不完全です。');return new Map(tree.tree.filter(e=>e.type==='blob'&&e.mode==='100644').map(e=>[e.path,e]));
 }
 async inspectAssets(token,id){if(!sceneId(id))throw Error('体験IDが不正です。');const ref=await this.request(token,this.root+'/git/ref/heads/'+this.branch),commit=await this.request(token,this.root+'/git/commits/'+ref.object.sha),entries=await this.sceneEntries(token,commit.tree.sha,id);return{baseSha:ref.object.sha,assets:[...entries.values()].map(e=>({name:e.path,sha:e.sha,size:e.size}))};}
 async publish(token,input){
  validateScene(input.scene);if(!input.reused?.length)validatePackage(input.scene,input.files);
  const repository=await this.request(token,this.root);if(!repository.permissions?.push)throw new Error('このリポジトリへの書込権限がありません。');
  const pages=await this.request(token,this.root+'/pages');if(!pages.html_url)throw new Error('GitHub Pagesが設定されていません。');
  const ref=await this.request(token,this.root+'/git/ref/heads/'+this.branch),parent=ref.object.sha;
  if(input.baseSha&&input.baseSha!==parent)throw Object.assign(Error('公開先が更新されました。最新の素材と照合するため、もう一度「公開する」を押してください。'),{status:409});
  const commit=await this.request(token,this.root+'/git/commits/'+parent);
  const existing=await this.sceneEntries(token,commit.tree.sha,input.scene.id);
  const {scene,files}=validateDelta(input.scene,input.files,input.reused||[],existing);
  const all=[...files,{name:'scene.json',content:Buffer.from(JSON.stringify(scene,null,2)).toString('base64')}];let uploaded=0,reused=(input.reused||[]).length;
  const entries=await mapLimit(all,3,async file=>{const bytes=Buffer.from(file.content,'base64'),sha=gitBlobSHA(bytes);if(existing.get(file.name)?.sha===sha&&existing.get(file.name)?.size===bytes.length){reused++;return null;}const blob=await this.request(token,this.root+'/git/blobs','POST',{content:file.content,encoding:'base64'});if(blob.sha!==sha)throw Error('GitHubへ送信した素材のハッシュが一致しません。');uploaded++;return{path:'public/scenes/'+scene.id+'/'+file.name,mode:'100644',type:'blob',sha:blob.sha};});
  const changed=entries.filter(Boolean);if(!changed.length)throw Error('公開データに変更がありません。');
  const tree=await this.request(token,this.root+'/git/trees','POST',{base_tree:commit.tree.sha,tree:changed});
  const next=await this.request(token,this.root+'/git/commits','POST',{message:'Publish WebAR scene '+scene.id+' / '+scene.revision,tree:tree.sha,parents:[parent]});
  await this.request(token,this.root+'/git/refs/heads/'+this.branch,'PATCH',{sha:next.sha,force:false});
  return{sha:next.sha,pagesURL:pages.html_url,sceneId:scene.id,revision:scene.revision,created:this.now(),uploaded,reused,actionsURL:this.actionsURL};
 }
 async status(token,job){const elapsed=Math.max(0,Math.floor((this.now()-(job.created||this.now()))/1000));const info={elapsed,actionsURL:this.actionsURL,uploaded:job.uploaded,reused:job.reused,needsAttention:false};
  const runs=await this.request(token,this.root+'/actions/runs?head_sha='+encodeURIComponent(job.sha)+'&per_page=50');const relevant=runs.workflow_runs.filter(r=>r.path?.split('@')[0]==='.github/workflows/pages.yml'&&r.head_sha===job.sha);
  if(!relevant.length){
   if(elapsed>=60&&!job.dispatchAttempted){job.dispatchAttempted=true;try{const ref=await this.request(token,this.root+'/git/ref/heads/'+this.branch);if(ref.object.sha!==job.sha)return{...info,state:'failed',message:'公開先に新しい更新があります。今回の公開確認を終了しました。最新の編集内容から公開し直してください。'};await this.request(token,this.root+'/actions/workflows/pages.yml/dispatches','POST',{ref:this.branch});job.dispatchMessage='Actionsの自動起動が確認できないため、起動を再要求しました。';}catch(e){job.dispatchMessage=e.status===403?'Actionsを起動する権限がありません。GitHub Actionsを開き、Deploy WebAR Art → Run workflow → mainで実行してください。':'Actionsの起動要求に失敗しました。GitHub ActionsでRun workflowを実行してください。';}}
   return{...info,state:'waiting',stage:'start',message:job.dispatchMessage||'GitHub Actionsの開始待ちです。',needsAttention:elapsed>=90};
  }
  relevant.sort((a,b)=>b.id-a.id||(b.run_attempt||1)-(a.run_attempt||1));const run=relevant[0];info.actionsURL=run.html_url||this.actionsURL;
  if(run.status!=='completed')return{...info,state:'building',stage:run.status==='queued'?'queue':'build',message:run.status==='queued'?'GitHubの実行順番を待っています。':'公開用ファイルを生成・デプロイしています。'};
  if(run.conclusion!=='success')return{...info,state:'failed',message:'公開処理が '+run.conclusion+' で終了しました。GitHub Actionsを確認してください。'};
  const deployments=await this.request(token,this.root+'/deployments?sha='+encodeURIComponent(job.sha)+'&environment=github-pages&per_page=20');let deployed=false;
  for(const d of deployments){if(d.sha!==job.sha)continue;const statuses=await this.request(token,this.root+'/deployments/'+d.id+'/statuses?per_page=1');if(statuses[0]?.state==='success'){deployed=true;break;}}
  if(!deployed)return{...info,state:'verifying',stage:'deploy',message:'今回の版のPagesデプロイ完了を確認しています。'};
  const base=new URL(job.pagesURL);if(base.protocol!=='https:'||base.hostname!==this.owner.toLowerCase()+'.github.io')throw new Error('この版は標準のgithub.io公開URLに対応しています。カスタムドメインは別設定が必要です。');
  const manifestURL=new URL('scenes/'+job.sceneId+'/scene.json',base);manifestURL.searchParams.set('v',job.revision);
  const response=await this.fetcher(manifestURL,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)return{...info,state:'verifying',stage:'verify',message:'公開ファイルの配信待ちです。'};
  const manifest=await response.json();if(manifest.revision!==job.revision)return{...info,state:'verifying',stage:'verify',message:'新しい版の配信を確認しています。'};
  const page=new URL('ar.html',base);const check=await this.fetcher(page,{signal:AbortSignal.timeout(15000)});if(!check.ok)return{...info,state:'failed',message:'AR再生ページがありません。初回のプログラム適用・公開を確認してください。'};
  const pageText=await check.text();if(!pageText.includes('ARARART')&&!pageText.includes('WebAR Art'))return{...info,state:'failed',message:'AR再生ページの内容が不正です。'};
  const names=requiredAssets(validateScene(manifest));
  const checks=await mapLimit(names,4,async name=>{const u=new URL('scenes/'+job.sceneId+'/'+name,base);u.searchParams.set('v',job.revision);const asset=await this.fetcher(u,{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(15000)});return asset.ok?null:name;});
  const missing=checks.find(Boolean);if(missing)return{...info,state:'verifying',stage:'verify',message:'作品素材の配信待ち: '+missing};
  page.searchParams.set('scene',job.sceneId);return{...info,state:'ready',stage:'ready',message:'公開完了。QRをiPhoneで読み取ってください。',url:page.href};
 }
}
