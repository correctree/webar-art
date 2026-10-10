import {readFile,access} from 'node:fs/promises';
for(const name of ['studio.html','ar.html','space.html','vendor/three/build/three.module.js','scenes/demo-interactive/scene.json','scenes/demo-interactive/tap.wav','scenes/demo/marker.mind','scenes/demo/sample.glb','scenes/demo/sample-safari.mp4','scenes/demo/sprite.png'])await access('dist/'+name);
for(const page of ['studio.html','ar.html']){
 const html=await readFile('dist/'+page,'utf8');
 const refs=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)].map(m=>m[1]);
 if(!refs.some(r=>r.endsWith('.js')))throw new Error(page+'のJSがありません。');
 for(const ref of refs)await access('dist/'+ref.slice(2));
}
console.log('公開用Studio・ARページ・JS・3形式素材の存在を確認しました。');
