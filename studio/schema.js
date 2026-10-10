export const MAX_ASSET_BYTES = 24 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 48 * 1024 * 1024;
export const sceneId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,39}$/.test(value);
export function assetPath(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(value) && !value.includes('..');
}
export function spriteSpec(data) {
  const n = key => Number(data[key]);
  for (const key of ['columns', 'rows', 'frames', 'frameWidth', 'frameHeight']) {
    if (!Number.isInteger(n(key)) || n(key) < 1) throw new Error('Spriteの数値が不正: ' + key);
  }
  if (n('frames') > n('columns') * n('rows') || n('frames') > 4096) throw new Error('Spriteのフレーム数が不正です。');
  if (data.origin && data.origin !== 'top-left') throw new Error('Spriteはtop-left形式に対応しています。');
  const fps = Number(data.fps ?? data.frameRate ?? 12);
  if (!Number.isFinite(fps) || fps < 1 || fps > 60) throw new Error('FPSは1〜60です。');
  return {columns:n('columns'), rows:n('rows'), frames:n('frames'), frameWidth:n('frameWidth'), frameHeight:n('frameHeight'), fps, loop:data.loop !== false};
}
export function spriteFrame(time, spec) {
  const raw = Math.floor(Math.max(0, time) * spec.fps);
  const frame = spec.loop ? raw % spec.frames : Math.min(raw, spec.frames - 1);
  return {frame, x:(frame % spec.columns) / spec.columns, y:1 - (Math.floor(frame / spec.columns) + 1) / spec.rows};
}
export function validateScene(scene, options) {
  if (scene?.version === 2) return validateProject(scene, options);
  return validateLegacy(scene);
}
function validateLegacy(scene) {
  if (!scene || scene.version !== 1 || !sceneId(scene.id)) throw new Error('シーンID・形式が不正です。');
  if (typeof scene.title !== 'string' || scene.title.length > 100) throw new Error('タイトルが不正です。');
  if (typeof scene.revision !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(scene.revision)) throw new Error('版番号が不正です。');
  if (!assetPath(scene.marker?.image) || !assetPath(scene.marker?.target) || !scene.marker.target.endsWith('.mind')) throw new Error('マーカー画像と認識データが必要です。');
  if (!Number.isFinite(scene.marker.aspect) || scene.marker.aspect <= 0 || scene.marker.aspect > 20) throw new Error('マーカー比率が不正です。');
  if (!Array.isArray(scene.objects) || scene.objects.length < 1 || scene.objects.length > 24) throw new Error('作品数は1〜24です。');
  const ids = new Set();
  for (const object of scene.objects) {
    if (!assetPath(object.id) || ids.has(object.id)) throw new Error('作品IDが不正・重複しています。'); ids.add(object.id);
    if (!['glb','video','sprite'].includes(object.kind) || !assetPath(object.src)) throw new Error('作品形式が不正です。');
    if (typeof object.name !== 'string' || object.name.length > 100) throw new Error('作品名が不正です。');
    if (object.kind === 'sprite') spriteSpec(object.sprite);
    if (object.kind === 'video' && (!assetPath(object.fallback?.src) || typeof object.fallback.packedAlpha !== 'boolean')) throw new Error('Safari用動画を用意してください。');
    for (const key of ['position','rotation','scale']) {
      const a=object[key];
      if (!Array.isArray(a) || a.length !== 3 || a.some(v=>!Number.isFinite(v) || Math.abs(v)>100)) throw new Error('作品変形が不正です。');
      if (key==='scale' && a.some(v=>v<=0)) throw new Error('サイズは0より大きくしてください。');
    }
  }
  return scene;
}
export function requiredAssets(scene) {
  const set = new Set(scene.version===2 ? [scene.trackingTarget,...scene.markers.map(m=>m.image),...scene.sounds.map(s=>s.src)] : [scene.marker.image,scene.marker.target]);
  const objects=scene.version===2 ? scene.scenes.flatMap(s=>s.objects) : scene.objects;
  objects.forEach(o=>{set.add(o.src); if(o.fallback)set.add(o.fallback.src);});
  return [...set];
}
export function validatePackage(scene, files, options) {
  validateScene(scene, options);
  if (!Array.isArray(files) || files.length>160) throw new Error('ファイル数が不正です。');
  const map=new Map(); let total=0;
  for(const file of files) {
    if(!assetPath(file.name)||map.has(file.name)||typeof file.content!=='string'|| !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.content)) throw new Error('ファイルが不正です。');
    const size=file.content.length*3/4 - (file.content.endsWith('==')?2:file.content.endsWith('=')?1:0);
    if(size<1||size>MAX_ASSET_BYTES)throw new Error('各ファイルは24MB以内にしてください。');
    total+=size;map.set(file.name,file);
  }
  if(total>MAX_TOTAL_BYTES)throw new Error('素材合計は48MB以内です。');
  for(const name of requiredAssets(scene))if(!map.has(name))throw new Error('素材が不足: '+name);
  return {scene,files,total};
}

export function toProject(input, options) {
  validateScene(input, options);
  if(input.version===2)return structuredClone(input);
  const p=structuredClone(input);
  return {version:2,id:p.id,title:p.title,revision:p.revision,trackingTarget:p.marker.target,maxTrack:1,
    markers:[{id:'marker-1',name:'マーカー1',image:p.marker.image,aspect:p.marker.aspect,targetIndex:0}],sounds:[],
    initialSceneId:'scene-1',scenes:[{id:'scene-1',name:'シーン1',autoNextSeconds:0,nextSceneId:null,markerLost:'continue',
      objects:p.objects.map(o=>({...o,markerId:'marker-1',autoplay:true,interaction:{...defaultInteraction(),loop:o.kind==='sprite'?o.sprite.loop!==false:o.loop!==false}}))}]};
}
export function defaultInteraction(){return {action:'none',clip:'all',loop:false,effect:'none',duration:1,soundId:null,volume:1,nextSceneId:null,delay:1};}
function namedId(item,seen,label){if(!sceneId(item?.id)||seen.has(item.id)||typeof item.name!=='string'||item.name.length>100)throw new Error(label+'ID・名前が不正・重複しています。');seen.add(item.id);}
export function validateProject(p,{draft=false}={}){
  if(!p||p.version!==2||!sceneId(p.id)||typeof p.title!=='string'||p.title.length>100||typeof p.revision!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(p.revision))throw new Error('プロジェクト形式が不正です。');
  if(!assetPath(p.trackingTarget)||!p.trackingTarget.endsWith('.mind'))throw new Error('複数マーカーの認識データが必要です。');
  if(!Array.isArray(p.markers)||p.markers.length<1||p.markers.length>8)throw new Error('マーカーは1〜8枚です。');
  if(![1,2].includes(p.maxTrack)||p.maxTrack>p.markers.length)throw new Error('同時追跡枚数が不正です。');
  const markers=new Set();p.markers.forEach((m,i)=>{namedId(m,markers,'マーカー');if(m.targetIndex!==i||!assetPath(m.image)||!Number.isFinite(m.aspect)||m.aspect<=0||m.aspect>20)throw new Error('マーカー順序・画像・比率が不正です。');});
  if(!Array.isArray(p.sounds)||p.sounds.length>24)throw new Error('音素材は24個までです。');
  const sounds=new Set();for(const a of p.sounds){namedId(a,sounds,'音素材');if(!assetPath(a.src)||! /\.(mp3|wav|m4a|aac)$/i.test(a.src))throw new Error('音素材形式が不正です。');}
  if(!Array.isArray(p.scenes)||p.scenes.length<1||p.scenes.length>12)throw new Error('シーンは1〜12個です。');
  const scenes=new Set();for(const s of p.scenes)namedId(s,scenes,'シーン');
  if(!scenes.has(p.initialSceneId))throw new Error('開始シーンが見つかりません。');
  const allIds=new Set();let total=0;
  for(const s of p.scenes){
    if(!['pause','continue'].includes(s.markerLost)||!Number.isFinite(s.autoNextSeconds)||s.autoNextSeconds<0||s.autoNextSeconds>3600||s.nextSceneId!=null&&!scenes.has(s.nextSceneId))throw new Error('シーン切替設定が不正です。');
    if(!draft&&s.autoNextSeconds>0&&!s.nextSceneId)throw new Error('自動切替の行き先が必要です。');
    // Reuse the strict legacy media validation for each scene.
    if(!Array.isArray(s.objects))throw new Error('作品一覧が不正です。');
    if(!draft||s.objects.length)validateLegacy({version:1,id:p.id,title:p.title,revision:p.revision,marker:{image:p.markers[0].image,target:p.trackingTarget,aspect:p.markers[0].aspect},objects:s.objects});
    for(const o of s.objects){
      if(allIds.has(o.id))throw new Error('シーンをまたぐ作品IDが重複しています。');allIds.add(o.id);total++;
      if(!markers.has(o.markerId)||typeof o.autoplay!=='boolean')throw new Error('作品のマーカー・自動再生設定が不正です。');
      const b=o.interaction;
      if(!b||!['none','restart','toggle'].includes(b.action)||typeof b.clip!=='string'||b.clip.length>200||typeof b.loop!=='boolean'||!['none','rotate','bounce','pulse'].includes(b.effect))throw new Error('タップ反応が不正です。');
      if(!Number.isFinite(b.duration)||b.duration<.1||b.duration>60||!Number.isFinite(b.delay)||b.delay<0||b.delay>60||!Number.isFinite(b.volume)||b.volume<0||b.volume>1)throw new Error('反応の時間・音量が不正です。');
      if(b.soundId!=null&&!sounds.has(b.soundId)||b.nextSceneId!=null&&!scenes.has(b.nextSceneId))throw new Error('反応の音・シーンが見つかりません。');
    }
  }
  if(total>48)throw new Error('プロジェクト全体の作品は48個までです。');
  return p;
}
