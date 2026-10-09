import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import * as THREE from 'three';
import {MediaScene} from './media.js';
import {sceneId,validateScene} from './schema.js';
const $=id=>document.getElementById(id);let mind,media,ready=false,active=false,busy=false,frame=0;
const clock=new THREE.Clock();
function stop(){active=false;mind?.renderer.setAnimationLoop(null);mind?.stop();media?.pause();$('start').hidden=false;$('start').disabled=!ready;$('stop').hidden=true;$('resume').hidden=true;$('status').textContent='終了しました。再度開始できます。';}
try {
 const id=new URLSearchParams(location.search).get('scene')||'demo';if(!sceneId(id))throw new Error('体験IDが不正です。');
 const base=new URL('./scenes/'+id+'/',location.href);
 const response=await fetch(new URL('scene.json',base),{cache:'no-store'});if(!response.ok)throw new Error('公開作品が見つかりません。');
 const scene=validateScene(await response.json());$('title').textContent=scene.title;
 $('marker-link').href=new URL(scene.marker.image,base).href;$('marker-link').hidden=false;
 mind=new MindARThree({container:$('stage'),imageTargetSrc:new URL(scene.marker.target,base).href,maxTrack:1,uiLoading:'no',uiScanning:'no',uiError:'no',filterMinCF:.001,filterBeta:.01,warmupTolerance:5,missTolerance:5});
 media=new MediaScene(name=>new URL(name,base).href,new URL('./',location.href));
 const anchor=mind.addAnchor(0);anchor.group.add(media.root);mind.scene.add(new THREE.HemisphereLight(0xffffff,0x555555,2));
 const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1,2,3);mind.scene.add(light);
 anchor.onTargetFound=()=>{$('status').textContent='マーカーを認識しました。作品を鑑賞できます。';};
 anchor.onTargetLost=()=>{$('status').textContent='マーカーへカメラを向けてください。';};
 for(const spec of scene.objects)await media.add(spec);
 ready=true;$('start').disabled=false;$('status').textContent='「ARを開始」を押し、印刷したマーカーにカメラを向けてください。';
 $('resume').onclick=()=>{media.play().then(results=>{$('resume').hidden=!results.some(r=>r.status==='rejected');});};
 $('start').onclick=async()=>{
  if(busy||active)return;busy=true;$('start').disabled=true;$('error').textContent='';
  // Start every loaded video synchronously inside the user's tap, before awaiting camera permission.
  const playback=media.play();
  try{await mind.start();active=true;clock.start();mind.renderer.setAnimationLoop(()=>{media.update(Math.min(clock.getDelta(),.05));mind.renderer.render(mind.scene,mind.camera);frame++;});
   $('start').hidden=true;$('stop').hidden=false;$('status').textContent='マーカーへカメラを向けてください。';$('resume').hidden=!(await playback).some(r=>r.status==='rejected');
  }catch(error){stop();$('error').textContent='開始できません: '+error.message+' Safariのカメラ許可を確認してください。';}
  finally{busy=false;$('start').disabled=false;}
 };
 $('stop').onclick=stop;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stop();});window.addEventListener('pagehide',stop);
}catch(error){$('error').textContent=error.message;$('status').textContent='準備できませんでした。';}
