import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,appendFile,mkdir,rm,cp,lstat,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sceneId,validateScene,requiredAssets,MAX_ASSET_BYTES,MAX_TOTAL_BYTES} from '../studio/schema.js';
const git=(root,...args)=>execFileSync('git',args,{cwd:root,maxBuffer:16*1024*1024});
export function buildPlan(root){
 const records=git(root,'ls-tree','-r','-z','HEAD').toString().split('\0').filter(Boolean);
 const source=records.filter(r=>!r.slice(r.indexOf('\t')+1).startsWith('public/scenes/'));
 const key=createHash('sha256').update(source.join('\0')).digest('hex');
 const changed=git(root,'diff-tree','--root','--no-commit-id','--name-only','-r','-z','HEAD').toString().split('\0').filter(Boolean);
 return{key,dataOnly:changed.length>0&&changed.every(p=>p.startsWith('public/scenes/'))};
}
export async function sealRuntime(root,key){
 for(const name of ['index.html','studio.html','dashboard.html','ar.html','vendor/three/build/three.module.js','external/xr/xr.js'])if(!(await lstat(resolve(root,'dist',name))).isFile())throw Error('ランタイムが不足: '+name);
 for(const path of ['dist/scenes','dist/public/scenes'])await rm(resolve(root,path),{recursive:true,force:true});
 await writeFile(resolve(root,'dist/.ararart-runtime.json'),JSON.stringify({key}));
}
export async function overlayScenes(root,key){
 const stamp=JSON.parse(await readFile(resolve(root,'dist/.ararart-runtime.json'),'utf8'));if(stamp.key!==key)throw Error('プログラムの版が異なるキャッシュです。通常ビルドが必要です。');
 const staging=resolve(root,'.publish-scenes-staging');await rm(staging,{recursive:true,force:true});await mkdir(staging,{recursive:true});let count=0;
 try{for(const dir of await readdir(resolve(root,'public/scenes'),{withFileTypes:true})){
  if(dir.isSymbolicLink())throw Error('シーンのリンクは公開できません。');if(!dir.isDirectory())continue;if(!sceneId(dir.name))throw Error('シーンIDが不正: '+dir.name);
  const src=resolve(root,'public/scenes',dir.name),manifestPath=resolve(src,'scene.json'),manifestStat=await lstat(manifestPath);if(!manifestStat.isFile()||manifestStat.size>2*1024*1024)throw Error('scene.jsonが不正です。');
  const scene=validateScene(JSON.parse(await readFile(manifestPath,'utf8')));if(scene.id!==dir.name)throw Error('フォルダーとシーンIDが一致しません: '+dir.name);
  const names=requiredAssets(scene);if(names.length>160)throw Error('素材数が上限を超えています。');let total=0;
  for(const name of names){const file=await lstat(resolve(src,name));if(!file.isFile()||file.size<1||file.size>MAX_ASSET_BYTES)throw Error('素材の形式・サイズが不正: '+name);total+=file.size;}
  if(total>MAX_TOTAL_BYTES)throw Error('素材合計が48MBを超えています: '+dir.name);
  const dest=resolve(staging,dir.name);await mkdir(dest);for(const name of ['scene.json',...names])await cp(resolve(src,name),resolve(dest,name));count++;
 }
 if(!count)throw Error('公開するシーンがありません。');
 for(const path of ['dist/scenes','dist/public/scenes']){await rm(resolve(root,path),{recursive:true,force:true});await cp(staging,resolve(root,path),{recursive:true});}
 return count;
 }finally{await rm(staging,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2],root=process.cwd(),key=process.argv[3];
 if(mode==='plan'){const p=buildPlan(root);if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`key=${p.key}\ndata_only=${p.dataOnly}\n`);console.log(JSON.stringify(p));}
 else if(mode==='seal')await sealRuntime(root,key);
 else if(mode==='overlay')console.log('公開素材を検証・反映: '+await overlayScenes(root,key)+' projects');
 else throw Error('plan / seal / overlay を指定してください。');
}
