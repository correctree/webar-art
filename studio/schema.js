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
export function validateScene(scene) {
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
  const set = new Set([scene.marker.image,scene.marker.target]);
  scene.objects.forEach(o=>{set.add(o.src); if(o.fallback)set.add(o.fallback.src);});
  return [...set];
}
export function validatePackage(scene, files) {
  validateScene(scene);
  if (!Array.isArray(files) || files.length>100) throw new Error('ファイル数が不正です。');
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
