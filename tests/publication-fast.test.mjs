import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {GitHubPublisher} from '../publisher/github.mjs';
import {gitBlobSHA,validateDelta,mapLimit} from '../publisher/publication-utils.mjs';
import {gitBlobHash,preparePublication,pollPublication} from '../studio/publication-client.js';
import {buildPlan,sealRuntime,overlayScenes} from '../scripts/publication-build.mjs';
import {requiredAssets,MAX_TOTAL_BYTES} from '../studio/schema.js';
const scene=JSON.parse(await readFile(new URL('../public/scenes/demo/scene.json',import.meta.url)));
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
function fixture({existing=new Map(),current='parent',truncated=false,dispatchStatus=204,runs=[]}={}){
 const calls=[];let now=100000;
 const fetcher=async(u,o={})=>{const url=String(u);calls.push({url,options:o});const body=o.body?JSON.parse(o.body):null;
  if(url.endsWith('/repos/correctree/webar-art'))return json({permissions:{push:true}});
  if(url.endsWith('/pages'))return json({html_url:'https://correctree.github.io/webar-art/'});
  if(url.includes('/git/ref/heads/'))return json({object:{sha:current}});
  if(url.endsWith('/git/commits/'+current))return json({tree:{sha:'root'}});
  const trees={root:[{path:'public',type:'tree',sha:'public'}],public:[{path:'scenes',type:'tree',sha:'scenes'}],scenes:[{path:scene.id,type:'tree',sha:'project'}],project:[...existing].map(([path,f])=>({path,...f}))};
  const key=url.split('/git/trees/')[1];if(key in trees)return json({tree:trees[key],truncated});
  if(url.endsWith('/git/blobs'))return json({sha:gitBlobSHA(Buffer.from(body.content,'base64'))});
  if(url.endsWith('/git/trees'))return json({sha:'updated-tree'});
  if(url.endsWith('/git/commits'))return json({sha:'published'});
  if(url.includes('/git/refs/heads/'))return json({object:{sha:'published'}});
  if(url.includes('/actions/runs?'))return json({workflow_runs:runs});
  if(url.endsWith('/dispatches'))return new Response(null,{status:dispatchStatus});
  throw Error('Unexpected '+url);
 };
 return{calls,p:new GitHubPublisher({owner:'correctree',repo:'webar-art',fetcher,now:()=>now}),setNow:n=>now=n};
}
const content=Buffer.alloc(600000,37).toString('base64');
const files=requiredAssets(scene).map(name=>({name,content}));
const known=()=>new Map(files.map(f=>[f.name,{type:'blob',mode:'100644',sha:gitBlobSHA(Buffer.from(f.content,'base64')),size:600000}]));
test('browser Git blob fingerprint agrees with server and unchanged media is omitted from upload body',async()=>{
 assert.equal((await gitBlobHash(content)).sha,gitBlobSHA(Buffer.from(content,'base64')));
 const existing=known(),progress=[];
 const data=await preparePublication({scene,files},{fetcher:async()=>json({baseSha:'parent',assets:[...existing].map(([name,e])=>({name,...e}))}),onProgress:s=>progress.push(s)});
 assert.equal(data.files.length,0);assert.equal(data.reused.length,files.length);assert.ok(!JSON.stringify(data).includes(content));assert.ok(progress.length>1);
 const f=fixture({existing}),job=await f.p.publish('fixture',data);
 assert.equal(job.uploaded,1);assert.equal(job.reused,files.length);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/git/blobs')).length,1);
 assert.match(JSON.parse(f.calls.find(c=>c.url.endsWith('/git/trees')).options.body).tree[0].path,/scene.json$/);
});
test('changed same-name asset uploads while other media reuses verified parent blobs',async()=>{
 const existing=known(),changed=files.map((f,i)=>i?f:{...f,content:'bmV3'});
 const data=await preparePublication({scene,files:changed},{fetcher:async()=>json({baseSha:'parent',assets:[...existing].map(([name,e])=>({name,...e}))})});
 assert.equal(data.files.length,1);const f=fixture({existing});await f.p.publish('fixture',data);assert.equal(f.calls.filter(c=>c.url.endsWith('/git/blobs')).length,2);
});
test('stale publication plan, invented reuse, invalid scene and incomplete Git tree never advance ref',async()=>{
 const existing=known(),reused=[...existing].map(([name,e])=>({name,...e}));
 for(const input of [{scene,files:[],reused,baseSha:'old'},{scene,files:[],reused:reused.map((f,i)=>i?f:{...f,sha:'forged'}),baseSha:'parent'},{scene:{...scene,id:'../escape'},files:[],reused}]){const f=fixture({existing});await assert.rejects(f.p.publish('fixture',input));assert.ok(!f.calls.some(c=>c.options.method==='PATCH'));}
 const f=fixture({truncated:true});await assert.rejects(f.p.inspectAssets('fixture',scene.id),/不完全/);
 const f2=fixture();await assert.rejects(f2.p.inspectAssets('fixture','../escape'),/不正/);assert.equal(f2.calls.length,0);
});
test('delta still enforces duplicate, missing, combined size limits and disallows symlinks',()=>{
 const existing=known(),reused=[...existing].map(([name,e])=>({name,...e}));
 assert.throws(()=>validateDelta(scene,[],[...reused,reused[0]],existing));assert.throws(()=>validateDelta(scene,[],[],existing),/不足/);
 const oversized=new Map(existing);for(let i=0;i<3;i++)oversized.set('extra'+i,{type:'blob',mode:'100644',size:Math.floor(MAX_TOTAL_BYTES/2),sha:'a'});
 assert.throws(()=>validateDelta(scene,[],[...oversized].map(([name,e])=>({name,...e})),oversized),/合計/);
 const symlink=new Map(existing);symlink.get(files[0].name).mode='120000';assert.throws(()=>validateDelta(scene,[],reused,symlink));
});
test('missing workflow requests one recovery dispatch after 60s, with matching branch SHA only',async()=>{
 const f=fixture(),job={sha:'parent',created:30000};let r=await f.p.status('fixture',job);assert.match(r.message,/再要求/);assert.equal(job.dispatchAttempted,true);
 await f.p.status('fixture',job);assert.equal(f.calls.filter(c=>c.url.endsWith('/dispatches')).length,1);
 const g=fixture({current:'different'}),old={sha:'parent',created:30000};assert.equal((await g.p.status('fixture',old)).state,'failed');assert.ok(!g.calls.some(c=>c.url.endsWith('/dispatches')));
});
test('recovery permission failure gives manual action link and never reports QR ready',async()=>{
 const f=fixture({dispatchStatus:403}),r=await f.p.status('fixture',{sha:'parent',created:10000});assert.equal(r.state,'waiting');assert.match(r.message,/権限/);assert.match(r.actionsURL,/github.com/);assert.equal(r.needsAttention,true);assert.equal(r.url,undefined);
 const g=fixture();const result=await g.p.status('fixture',{sha:'parent',created:90000});assert.equal(result.state,'waiting');assert.ok(!g.calls.some(c=>c.url.endsWith('/dispatches')));
});
test('bounded workers check concurrently without exceeding four; preserve result ordering',async()=>{
 let active=0,max=0;const out=await mapLimit([0,1,2,3,4,5,6],4,async n=>{max=Math.max(max,++active);await new Promise(r=>setTimeout(r,2));active--;return n*2;});assert.equal(max,4);assert.deepEqual(out,[0,2,4,6,8,10,12]);
});
test('publication polling tolerates transient failure, shortens verification interval, rejects failed jobs',async()=>{
 let time=0,calls=0;const waits=[],states=[];const ready=await pollPublication('id',{now:()=>time,wait:async ms=>{waits.push(ms);time+=ms;},fetcher:async()=>{if(calls++===0)throw Error('network');return json(calls===2?{state:'verifying',message:'check'}:{state:'ready',url:'https://example.test/'});},onStatus:s=>states.push(s.state)});
 assert.equal(ready.state,'ready');assert.deepEqual(states,['retrying','verifying','ready']);assert.deepEqual(waits,[2000,2000]);
 await assert.rejects(pollPublication('id',{fetcher:async()=>json({state:'failed',message:'build failed'})}),/build failed/);
 await assert.rejects(pollPublication('id',{fetcher:async()=>new Response(JSON.stringify({error:'login'}),{status:401})}),/login/);
});
test('polling timeout is recoverable and does not report deployment ready',async()=>{
 let time=0;await assert.rejects(pollPublication('id',{now:()=>time,maxMs:6000,wait:async ms=>{time+=ms;},fetcher:async()=>json({state:'waiting',message:'start'})}),/再確認/);
});
async function temp(t){const root=await mkdtemp(join(tmpdir(),'ararart-publication-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
test('runtime cache key excludes only project data; program edits require a different runtime',async t=>{
 const root=await temp(t),git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});git('init');git('config','user.name','Fixture');git('config','user.email','fixture@example.test');
 await mkdir(join(root,'public/scenes/demo'),{recursive:true});await writeFile(join(root,'app.js'),'one');await writeFile(join(root,'public/scenes/demo/scene.json'),'one');git('add','.');git('commit','-m','initial');const first=buildPlan(root);assert.equal(first.dataOnly,false);
 await writeFile(join(root,'public/scenes/demo/scene.json'),'two');git('add','.');git('commit','-m','data');const second=buildPlan(root);assert.equal(second.key,first.key);assert.equal(second.dataOnly,true);
 await writeFile(join(root,'app.js'),'two');git('add','.');git('commit','-m','code');const third=buildPlan(root);assert.notEqual(third.key,first.key);assert.equal(third.dataOnly,false);
});
test('scene overlay uses current data, removes cached scenes, rejects missing media before touching deployed copy',async t=>{
 const root=await temp(t);
 for(const f of ['index.html','studio.html','dashboard.html','ar.html','vendor/three/build/three.module.js','external/xr/xr.js']){const p=join(root,'dist',f);await mkdir(join(p,'..'),{recursive:true});await writeFile(p,'fixture');}
 await mkdir(join(root,'dist/scenes/stale'),{recursive:true});await sealRuntime(root,'key');
 const src=join(root,'public/scenes/demo');await mkdir(src,{recursive:true});await writeFile(join(src,'scene.json'),JSON.stringify(scene));for(const name of requiredAssets(scene))await writeFile(join(src,name),'fixture');
 assert.equal(await overlayScenes(root,'key'),1);assert.equal(JSON.parse(await readFile(join(root,'dist/scenes/demo/scene.json'))).revision,scene.revision);
 await assert.rejects(readFile(join(root,'dist/scenes/stale/scene.json')));
 await assert.rejects(overlayScenes(root,'wrong'),/版/);await rm(join(src,requiredAssets(scene)[0]));await assert.rejects(overlayScenes(root,'key'));assert.equal(JSON.parse(await readFile(join(root,'dist/scenes/demo/scene.json'))).revision,scene.revision);
});
test('missing published media holds QR despite concurrent verification; at most four requests are active',async()=>{
 let active=0,max=0;const expected=requiredAssets(scene),calls=[];
 const fetcher=async(u,o={})=>{const url=String(u);if(url.includes('/actions/runs?'))return json({workflow_runs:[{path:'.github/workflows/pages.yml',head_sha:'commit',status:'completed',conclusion:'success',id:1}]});if(url.includes('/deployments?'))return json([{id:1,sha:'commit'}]);if(url.includes('/deployments/1/statuses'))return json([{state:'success'}]);if(url.includes('scene.json'))return json(scene);if(url.includes('ar.html'))return new Response('ARARART');if(o.method==='HEAD'){calls.push(url);max=Math.max(max,++active);await new Promise(r=>setTimeout(r,2));active--;return new Response(null,{status:new URL(url).pathname.endsWith('/'+expected.at(-1))?404:200});}throw Error(url);};
 const p=new GitHubPublisher({owner:'correctree',repo:'webar-art',fetcher}),r=await p.status('fixture',{sha:'commit',sceneId:scene.id,revision:scene.revision,pagesURL:'https://correctree.github.io/webar-art/'});assert.equal(r.state,'verifying');assert.equal(r.url,undefined);assert.equal(calls.length,expected.length);assert.ok(max>1&&max<=4);assert.ok(calls.every(u=>new URL(u).searchParams.get('v')===scene.revision));
});
test('public watcher disables only publication and releases other editor controls while waiting',async()=>{
 const vm=await import('node:vm'),source=await readFile(new URL('../studio/editor.js',import.meta.url),'utf8'),nodes=new Map(),storage=new Map([['webar-publish-job','id'],['webar-publish-fingerprint','old-edit']]);
 const $=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,hidden:true,textContent:''});return nodes.get(id);};let finish;
 const context=vm.createContext({$,publicationWatching:false,session:{authenticated:true},publishedURL:'',publishedFingerprint:'',sessionStorage:{getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},status(){},updateGuide(){},QRCode:{toCanvas:async()=>{}},pollPublication:async(id,{onStatus})=>{onStatus({state:'building',message:'build',elapsed:60});return await new Promise(r=>finish=r);}});
 vm.runInContext(source.slice(source.indexOf('function publicationState('),source.indexOf("\n$('copy').onclick")),context);
 const pending=vm.runInContext("watch('id')",context);assert.equal($('publish').disabled,true);assert.equal($('move').disabled,false);assert.equal($('publication-recheck').disabled,true);finish({url:'https://example.test/ar.html'});await pending;assert.equal($('publish').disabled,false);assert.equal($('qr').hidden,false);assert.equal(storage.has('webar-publish-job'),false);assert.equal(vm.runInContext('publishedFingerprint',context),'old-edit');
});
test('newer manual workflow wins over an older failed rerun with a higher attempt number',async()=>{
 const f=fixture({runs:[{id:10,run_attempt:5,path:'.github/workflows/pages.yml',head_sha:'parent',status:'completed',conclusion:'failure'},{id:11,run_attempt:1,path:'.github/workflows/pages.yml',head_sha:'parent',status:'queued',html_url:'https://github.com/correctree/webar-art/actions/runs/11'}]});
 const r=await f.p.status('fixture',{sha:'parent',created:30000});assert.equal(r.state,'building');assert.equal(r.stage,'queue');assert.match(r.actionsURL,/11$/);assert.ok(!f.calls.some(c=>c.url.endsWith('/dispatches')));
});
