import {createHash} from 'node:crypto';
import {assetPath,validateScene,validateAssetFiles,requiredAssets,MAX_ASSET_BYTES,MAX_TOTAL_BYTES} from '../studio/schema.js';
export function gitBlobSHA(bytes){return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');}
// Reuse is accepted only against entries read from GitHub at the current parent commit.
export function validateDelta(scene,files,reused,existing){
 validateScene(scene);const {map,total:uploaded}=validateAssetFiles(files);let total=uploaded;
 if(!Array.isArray(reused)||map.size+reused.length>160)throw Error('差分ファイル数が不正です。');
 for(const f of reused){const known=existing.get(f?.name);if(!f||!assetPath(f.name)||map.has(f.name)||!known||known.type!=='blob'||known.mode!=='100644'||known.sha!==f.sha||known.size!==f.size||!Number.isInteger(f.size)||f.size<1||f.size>MAX_ASSET_BYTES)throw Error('再利用素材を検証できません。公開をやり直してください。');map.set(f.name,f);total+=f.size;}
 if(total>MAX_TOTAL_BYTES)throw Error('素材合計は48MB以内です。');
 for(const name of requiredAssets(scene))if(!map.has(name))throw Error('素材が不足: '+name);
 return {scene,files,total};
}
export async function mapLimit(items,limit,fn){const result=new Array(items.length);let cursor=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length){const i=cursor++;result[i]=await fn(items[i],i);}}));return result;}
