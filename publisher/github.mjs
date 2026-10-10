import {validatePackage,validateScene,requiredAssets} from '../studio/schema.js';
export class GitHubPublisher {
 constructor({owner,repo,branch='main',fetcher=fetch}){if(!/^[a-zA-Z0-9-]+$/.test(owner)||!/^[a-zA-Z0-9_.-]+$/.test(repo)||!/^[-a-zA-Z0-9_/]+$/.test(branch))throw new Error('公開先設定が不正です。');Object.assign(this,{owner,repo,branch,fetcher});}
 async request(token,path,method='GET',body){const response=await this.fetcher('https://api.github.com'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'WebAR-Art-Publisher','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(!response.ok){const error=new Error('GitHub API '+response.status+'。権限・公開先・接続を確認してください。');error.status=response.status;throw error;}return response.status===204?null:response.json();}
 get root(){return '/repos/'+this.owner+'/'+this.repo;}
 async publish(token,input){const {scene,files}=validatePackage(input.scene,input.files);const repository=await this.request(token,this.root);if(!repository.permissions?.push)throw new Error('このリポジトリへの書込権限がありません。');
  const pages=await this.request(token,this.root+'/pages');if(!pages.html_url)throw new Error('GitHub Pagesが設定されていません。');
  const ref=await this.request(token,this.root+'/git/ref/heads/'+this.branch);const parent=ref.object.sha;const commit=await this.request(token,this.root+'/git/commits/'+parent);const entries=[];
  const all=[...files,{name:'scene.json',content:Buffer.from(JSON.stringify(scene,null,2)).toString('base64')}];
  for(const file of all){const blob=await this.request(token,this.root+'/git/blobs','POST',{content:file.content,encoding:'base64'});entries.push({path:'public/scenes/'+scene.id+'/'+file.name,mode:'100644',type:'blob',sha:blob.sha});}
  const tree=await this.request(token,this.root+'/git/trees','POST',{base_tree:commit.tree.sha,tree:entries});
  const next=await this.request(token,this.root+'/git/commits','POST',{message:'Publish WebAR scene '+scene.id+' / '+scene.revision,tree:tree.sha,parents:[parent]});
  await this.request(token,this.root+'/git/refs/heads/'+this.branch,'PATCH',{sha:next.sha,force:false});
  return {sha:next.sha,pagesURL:pages.html_url,sceneId:scene.id,revision:scene.revision};
 }
 async status(token,job){const runs=await this.request(token,this.root+'/actions/runs?head_sha='+encodeURIComponent(job.sha)+'&per_page=50');const relevant=runs.workflow_runs.filter(r=>r.path?.split('@')[0]==='.github/workflows/pages.yml'&&r.head_sha===job.sha);
  if(!relevant.length)return {state:'waiting',message:'GitHub Actionsの開始待ちです。'};
  relevant.sort((a,b)=>b.run_attempt-a.run_attempt||b.id-a.id);const run=relevant[0];
  if(run.status!=='completed')return{state:'building',message:'公開用ファイルをビルド・デプロイしています。'};
  if(run.conclusion!=='success')return{state:'failed',message:'公開処理が '+run.conclusion+' で終了しました。GitHub Actionsを確認してください。',actionsURL:run.html_url};
  const deployments=await this.request(token,this.root+'/deployments?sha='+encodeURIComponent(job.sha)+'&environment=github-pages&per_page=20');let deployed=false;
  for(const d of deployments){if(d.sha!==job.sha)continue;const statuses=await this.request(token,this.root+'/deployments/'+d.id+'/statuses?per_page=1');if(statuses[0]?.state==='success'){deployed=true;break;}}
  if(!deployed)return{state:'verifying',message:'今回の版のPagesデプロイ完了を確認しています。'};
  const base=new URL(job.pagesURL);if(base.protocol!=='https:'||base.hostname!==this.owner.toLowerCase()+'.github.io')throw new Error('この版は標準のgithub.io公開URLに対応しています。カスタムドメインは別設定が必要です。');
  const manifestURL=new URL('scenes/'+job.sceneId+'/scene.json',base);manifestURL.searchParams.set('v',job.revision);
  const response=await this.fetcher(manifestURL,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)return{state:'verifying',message:'公開ファイルの配信待ちです。'};
  const manifest=await response.json();if(manifest.revision!==job.revision)return{state:'verifying',message:'新しい版の配信を確認しています。'};
  const page=new URL('ar.html',base);const check=await this.fetcher(page,{signal:AbortSignal.timeout(15000)});if(!check.ok)return{state:'failed',message:'AR再生ページがありません。初回のプログラム適用・公開を確認してください。'};
  const pageText=await check.text();if(!pageText.includes('WebAR Art'))return{state:'failed',message:'AR再生ページの内容が不正です。'};
  const names=requiredAssets(validateScene(manifest));
  for(const name of names){const asset=await this.fetcher(new URL('scenes/'+job.sceneId+'/'+name,base),{method:'HEAD',signal:AbortSignal.timeout(15000)});if(!asset.ok)return{state:'verifying',message:'作品素材の配信待ち: '+name};}
  page.searchParams.set('scene',job.sceneId);return{state:'ready',message:'公開完了。QRをiPhoneで読み取ってください。',url:page.href};
 }
}
