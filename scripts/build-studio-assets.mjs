import {cp,access,mkdir,readFile} from 'node:fs/promises';
import {validateScene,requiredAssets} from '../studio/schema.js';
const scene=validateScene(JSON.parse(await readFile('public/scenes/demo/scene.json','utf8')));
for(const file of requiredAssets(scene))await access('public/scenes/demo/'+file);
await cp('public/scenes','dist/scenes',{recursive:true});
await cp('public/artworks','dist/artworks',{recursive:true});
await mkdir('dist/licenses',{recursive:true});
for(const pkg of ['mind-ar','jszip','qrcode']){
 let found=false;
 for(const name of ['LICENSE','LICENSE.txt','LICENSE.md','LICENSE.markdown','LICENSE-MIT']){
  try{await access('node_modules/'+pkg+'/'+name);}catch{continue;}
  await cp('node_modules/'+pkg+'/'+name,'dist/licenses/'+pkg+'.txt');found=true;break;
 }
 if(!found)throw new Error(pkg+'のライセンスファイルが見つかりません。');
}
console.log('Studio demo assets and dependency licenses copied.');
