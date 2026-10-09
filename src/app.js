import * as THREE from 'three';
import {Artwork, disposeObject} from './artwork.js';
import {TapAudio} from './audio.js';
import {loadEngine} from './engine-loader.js';
import {XRAdapter} from './xr-adapter.js';
import {canvasPoint, validTarget, targetName, validAssetName} from './policy.js';

window.THREE = THREE; // XR8.Threejs uses the same Three.js instance as the artwork loader.
const $ = id => document.getElementById(id);
const canvas = $('camera'); const artwork = new Artwork(); const audio = new TapAudio();
const assets = {glb: {kind: 'glb', url: './public/artworks/sample.glb'}, image: {kind: 'image', url: './public/targets/mk_1008.jpg'}};
let xr, target = null, name = null, adapter = null, context = null, anchor, reticle;
let active = false, loading = true, placing = true, tracked = false, worldStatus = 'LIMITED';
let mode = 'world', imageWidth = 1, lastTime = 0, lastHitTime = 0, imageFound = 0, imageLost = 0;
let localURL = null, lastAsset = 'glb', imageVisible = false, pointer = null, sceneItems = [];
let lastMessage = '';
const raycaster = new THREE.Raycaster();
function status(message) { if (lastMessage !== message) { $('status').textContent = message; lastMessage = message; } }
function errorText(error) { return error?.message || String(error); }
function updateStart() {
  $('artwork').disabled = loading; $('file').disabled = loading;
  const image = document.querySelector('input[name=mode]:checked').value === 'image';
  $('start').disabled = loading || !xr || (image && !target);
  $('start').textContent = loading ? '準備中…' : 'カメラを開始';
  if (!loading && xr) $('setup-status').textContent = image && !target ?
    '画像ARはターゲット未準備です。Macで npm run target:prepare を実行してください。空間ARは開始できます。' :
    image ? 'MK 1008の紙にかざしてください。' : '床や机へ向け、カメラをゆっくり動かしてください。';
}
async function loadTarget() {
  try {
    const response = await fetch('./public/targets/target.json');
    if (!response.ok) return;
    const data = await response.json();
    if (!validTarget(data) || !targetName(data)) throw new Error('画像ターゲットの形式・名前を確認してください。');
    data.imagePath = new URL(data.imagePath, response.url).href;
    target = data; name = targetName(data);
  } catch (error) { $('setup-status').textContent = errorText(error); }
}
function resize() {
  canvas.width = Math.round(window.innerWidth); canvas.height = Math.round(window.innerHeight);
}
window.addEventListener('resize', resize); resize();
function scaleArtwork() { artwork.root.scale.setScalar((mode === 'image' ? imageWidth * .6 : .6) * Number($('size').value)); }
function diagnostic() {
  $('diagnostic').textContent = `0.2.0 / 8th Wall + Three.js ${THREE.REVISION}\n${mode === 'image' ? '画像AR：' + name + ' / 取得 ' + imageFound + ' / 見失い ' + imageLost : '空間AR：' + worldStatus}\nタップ反応 ${artwork.actionCount}回`;
}
function initScene(sceneContext) {
  context = sceneContext; const {scene} = context;
  sceneItems = [];
  const ambient = new THREE.HemisphereLight(0xffffff, 0x405247, 2);
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(2, 5, 3);
  anchor = new THREE.Group(); anchor.visible = false; anchor.add(artwork.root);
  artwork.root.rotation.set(mode === 'image' ? Math.PI / 2 : 0, 0, 0);
  reticle = new THREE.Mesh(new THREE.RingGeometry(.09, .115, 40),
    new THREE.MeshBasicMaterial({color: 0xc1efd2, side: THREE.DoubleSide, depthTest: false}));
  reticle.rotation.x = -Math.PI / 2; reticle.visible = false; reticle.renderOrder = 20;
  for (const item of [ambient, key, anchor, reticle]) { scene.add(item); sceneItems.push(item); }
  scaleArtwork(); lastTime = performance.now(); lastHitTime = 0;
}
function frame() {
  if (!active || !context) return;
  const now = performance.now(); const delta = Math.min(.05, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
  if (anchor.visible) artwork.update(delta);
  if (mode === 'world' && placing && now - lastHitTime > 120) {
    lastHitTime = now;
    const hit = worldStatus === 'NORMAL' ? adapter.hitTest(.5, .5) : null;
    reticle.visible = !!hit; updatePlacementGuide(hit);
    if (hit) reticle.position.copy(hit.position);
  }
}
function trackingStatus(value) {
  if (!active) return;
  if (mode === 'world') {
    if (value === 'NORMAL' || value === 'LIMITED') {
      if (worldStatus === value) return;
      worldStatus = value;
      if (value === 'LIMITED') { if (reticle) reticle.visible = false; status('空間を確認しています。床や机へ向けて、ゆっくり動かしてください。'); }
      else status(placing ? '床や机の置きたい場所をタップしてください。' : '配置しました。作品をタップすると動きが切り替わります。');
    } else if (value === 'started') status('床や机へ向け、カメラをゆっくり動かしてください。');
  } else if (!imageVisible) status('MK 1008の紙にカメラを向けてください。');
  diagnostic();
}
function imageEvent(event, detail) {
  if (!active || !anchor) return;
  if (event === 'lost') {
    imageLost++; imageVisible = false; anchor.visible = false;
    status('作品を探しています。MK 1008の紙にもう一度かざしてください。');
  } else {
    const reacquired = !imageVisible;
    if (reacquired) imageFound++;
    imageVisible = true;
    anchor.position.copy(detail.position); anchor.quaternion.copy(detail.rotation); anchor.scale.setScalar(detail.scale);
    imageWidth = detail.scaledWidth || 1; scaleArtwork(); anchor.visible = true;
    if (reacquired) status('画像に重ねています。立体・画像をタップすると動きが切り替わります。');
  }
  diagnostic();
}
function closeSettings() { $('settings-panel').hidden = true; $('settings').setAttribute('aria-expanded', 'false'); }
function stop(message) {
  active = false; updatePlacementGuide(null);
  try { adapter?.stop(); } catch (error) { message ||= errorText(error); }
  adapter = null;
  if (context) {
    anchor?.remove(artwork.root);
    for (const item of sceneItems) context.scene.remove(item);
    disposeObject(reticle); sceneItems = [];
  }
  context = anchor = reticle = null; imageVisible = false; tracked = false;
  audio.mute(); $('sound').textContent = '音 OFF'; $('sound').setAttribute('aria-pressed', 'false');
  closeSettings(); document.body.classList.remove('active'); $('hud').hidden = true;
  updateStart(); if (message) $('setup-status').textContent = message;
}
$('start').addEventListener('click', () => {
  if (active || loading || !xr) return;
  if (!window.isSecureContext) { $('setup-status').textContent = 'カメラはHTTPSのURLで開いてください。'; return; }
  mode = document.querySelector('input[name=mode]:checked').value;
  if (mode === 'image' && !target) { updateStart(); return; }
  active = true; placing = true; worldStatus = 'LIMITED'; imageFound = imageLost = 0; imageVisible = false;
  $('size').value = '1'; $('hud').hidden = false; $('replace').hidden = mode !== 'world';
  document.body.classList.add('active'); status('カメラを開始しています…'); resize(); updatePlacementGuide(null);
  adapter = new XRAdapter(xr, {canvas, mode, target, name, onScene: initScene, onFrame: frame,
    onStatus: trackingStatus, onImage: imageEvent, onError: error => stop(errorText(error))});
  adapter.start();
});
$('stop').addEventListener('click', () => stop('終了しました。作品と表示方法を選んで再開できます。'));
$('replace').addEventListener('click', () => { placing = true; status('新しい場所をタップしてください。'); });
$('settings').addEventListener('click', () => {
  $('settings-panel').hidden = !$('settings-panel').hidden;
  $('settings').setAttribute('aria-expanded', String(!$('settings-panel').hidden)); diagnostic();
});
$('close-settings').addEventListener('click', closeSettings);
$('size').addEventListener('input', scaleArtwork);
$('sound').addEventListener('click', async () => {
  try {
    if (audio.enabled) audio.mute(); else await audio.unlock();
    $('sound').textContent = audio.enabled ? '音 ON' : '音 OFF';
    $('sound').setAttribute('aria-pressed', String(audio.enabled)); audio.tone();
  } catch (error) { status(errorText(error)); }
});
function tap(point) {
  if (!active || !context || !anchor) return;
  if (mode === 'world' && placing) {
    if (worldStatus !== 'NORMAL') { status('空間を確認中です。少しカメラを動かしてからタップしてください。'); return; }
    const hit = adapter.hitTest(point.x, point.y);
    if (!hit) { status('この場所には配置できません。模様のある床や机へ向けて再度タップしてください。'); return; }
    anchor.position.copy(hit.position); anchor.quaternion.identity(); anchor.scale.setScalar(1); anchor.visible = true;
    placing = false; reticle.visible = false; updatePlacementGuide(null);
    status('配置しました。作品をタップすると動きが切り替わります。'); diagnostic(); return;
  }
  if (!anchor.visible) return;
  context.scene.updateMatrixWorld(true); context.camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(point.x * 2 - 1, 1 - point.y * 2), context.camera);
  if (raycaster.intersectObject(artwork.root, true).length) {
    artwork.react(); audio.tone(); diagnostic();
    status(artwork.enabled ? '作品が動き始めました。もう一度タップすると止まります。' : '作品の動きを止めました。');
  }
}
canvas.addEventListener('pointerdown', event => { pointer = {id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now()}; });
canvas.addEventListener('pointercancel', () => { pointer = null; });
canvas.addEventListener('pointerup', event => {
  const down = pointer; pointer = null;
  if (!down || down.id !== event.pointerId || performance.now() - down.time > 650 || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 14) return;
  const point = canvasPoint(event.clientX, event.clientY, canvas.getBoundingClientRect()); if (point) tap(point);
});
document.querySelectorAll('input[name=mode]').forEach(input => input.addEventListener('change', updateStart));
async function changeAsset(key, spec, label, candidateURL = null) {
  if (active) return;
  loading = true; updateStart(); $('setup-status').textContent = '作品を読み込んでいます…';
  try {
    if (await artwork.load(spec)) {
      if (localURL && localURL !== candidateURL) URL.revokeObjectURL(localURL);
      localURL = candidateURL; lastAsset = key;
      $('asset-label').textContent = label;
      if (key === 'local' && !$('artwork').querySelector('[value=local]')) $('artwork').add(new Option('読み込んだ作品', 'local'));
      $('artwork').value = key;
    }
    loading = false; updateStart();
  } catch (error) {
    if (candidateURL) URL.revokeObjectURL(candidateURL);
    loading = false; updateStart(); $('artwork').value = lastAsset;
    $('setup-status').textContent = '作品の読込に失敗しました：' + errorText(error);
  }
}
$('artwork').addEventListener('change', () => {
  const key = $('artwork').value;
  if (key === 'local') { $('artwork').value = lastAsset; $('file').click(); return; }
  changeAsset(key, assets[key], '同梱の作品を表示します。');
});
$('file').addEventListener('change', () => {
  const file = $('file').files[0]; $('file').value = ''; if (!file) return;
  if (!validAssetName(file.name) || file.size > 50 * 1024 * 1024) {
    $('setup-status').textContent = '50MB以下のGLB・PNG・JPEG・WebPを選んでください。'; return;
  }
  const url = URL.createObjectURL(file);
  changeAsset('local', {kind: /\.glb$/i.test(file.name) ? 'glb' : 'image', url}, file.name + '（今回の表示のみ）', url);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop('バックグラウンドへ移動したため終了しました。カメラを開始して再開できます。'); });
window.addEventListener('pagehide', () => { stop(); if (localURL) URL.revokeObjectURL(localURL); artwork.dispose(); });
window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });

const preparation = await Promise.allSettled([loadTarget(), artwork.load(assets.glb), loadEngine()]);
if (preparation[2].status === 'fulfilled') xr = preparation[2].value;
loading = false; updateStart();
for (const result of preparation) if (result.status === 'rejected') { $('setup-status').textContent = errorText(result.reason); }
if (preparation[1].status === 'rejected') { loading = true; $('start').disabled = true; }

function updatePlacementGuide(hit) {
  let guide = document.getElementById('placement-guide');
  if (!guide) {
    guide = document.createElement('section');
    guide.id = 'placement-guide';
    guide.setAttribute('role', 'status');
    guide.innerHTML = '<strong></strong><p></p>';
    document.body.append(guide);
  }
  guide.hidden = !active || mode !== 'world' || !placing ||
    !$('settings-panel').hidden;
  if (guide.hidden) return;

  const ready = !!hit;
  guide.classList.toggle('ready', ready);
  const title = ready ? '配置できます' :
    worldStatus === 'NORMAL' ?
      '配置する場所を探しています' : '空間を確認しています';
  const message = ready ?
    '輪の近くをタップすると作品を置けます。' :
    '模様のある床や机に向け、左右へゆっくりカメラを動かしてください。配置できる場所が見つかるまでお待ちください。';

  const heading = guide.querySelector('strong');
  const paragraph = guide.querySelector('p');
  if (heading.textContent !== title) heading.textContent = title;
  if (paragraph.textContent !== message) paragraph.textContent = message;
}
